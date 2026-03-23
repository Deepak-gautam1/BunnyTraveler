import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { mockUser } from "./supabaseMock";

const { mockGetSession, mockOnAuthStateChange, mockSignOut, mockEnsureProfile } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockOnAuthStateChange: vi.fn(),
  mockSignOut: vi.fn().mockResolvedValue({ error: null }),
  mockEnsureProfile: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signOut: mockSignOut,
    },
  },
}));

vi.mock("@/lib/auth-helpers", () => ({
  ensureProfileExists: mockEnsureProfile,
}));

import { useAuth } from "@/hooks/useAuth";

const mockProfile = {
  id: mockUser.id,
  full_name: "Test User",
  avatar_url: null,
  email: "test@safarsquad.com",
  terms_accepted_at: "2024-01-01T00:00:00Z",
  privacy_accepted_at: "2024-01-01T00:00:00Z",
};

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  it("starts in loading state", () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    const { result } = renderHook(() => useAuth());
    expect(result.current.loading).toBe(true);
  });

  it("sets user and profile when session exists", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } });
    mockEnsureProfile.mockResolvedValue(mockProfile);

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.id).toBe(mockUser.id);
    expect(result.current.profile?.full_name).toBe("Test User");
  });

  it("sets null user when no session", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
  });

  it("handles session fetch error gracefully", async () => {
    mockGetSession.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("reacts to auth state change — sign in", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockEnsureProfile.mockResolvedValue(mockProfile);

    let authCallback: ((event: string, session: any) => void) | null = null;
    mockOnAuthStateChange.mockImplementation((cb: any) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);

    await act(async () => { authCallback!("SIGNED_IN", { user: mockUser }); });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    expect(result.current.user?.id).toBe(mockUser.id);
  });

  it("reacts to auth state change — sign out", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } });
    mockEnsureProfile.mockResolvedValue(mockProfile);

    let authCallback: ((event: string, session: any) => void) | null = null;
    mockOnAuthStateChange.mockImplementation((cb: any) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    await act(async () => { authCallback!("SIGNED_OUT", null); });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it("signOut calls supabase.auth.signOut", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.signOut(); });
    expect(mockSignOut).toHaveBeenCalled();
  });

  it("unsubscribes from auth listener on unmount", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    const unsubscribeMock = vi.fn();
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: unsubscribeMock } },
    });

    const { unmount } = renderHook(() => useAuth());
    // waitFor removed — hook initializes synchronously in mock
    unmount();
    expect(unsubscribeMock).toHaveBeenCalled();
  });

  it("refreshProfile re-fetches and updates profile state", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: mockUser } } });
    mockEnsureProfile
      .mockResolvedValueOnce(mockProfile)
      .mockResolvedValueOnce({ ...mockProfile, full_name: "Updated Name" });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.profile?.full_name).toBe("Test User"));

    await act(async () => { await result.current.refreshProfile(); });
    expect(result.current.profile?.full_name).toBe("Updated Name");
  });
});
