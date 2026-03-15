import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { mockUser } from "./supabaseMock";

// ─── Hoist mocks so they're available when vi.mock factory runs ───────────────
const { mockFrom, toastMock } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  toastMock: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: mockFrom,
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    }),
    removeChannel: vi.fn(),
  },
}));

vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: toastMock }) }));

import { useTripLikes } from "@/hooks/useTripLikes";

function builder(resolved: unknown) {
  const b: any = {};
  ["select", "insert", "delete", "eq", "order"].forEach((m) => {
    b[m] = vi.fn().mockReturnValue(b);
  });
  b.then = (resolve: any) => resolve(resolved);
  b.catch = () => b;
  return b;
}

describe("useTripLikes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initialises with empty liked set when no user", () => {
    const { result } = renderHook(() => useTripLikes(null));
    expect(result.current.likedTripIds.size).toBe(0);
  });

  it("fetches liked trips for authenticated user on mount", async () => {
    mockFrom.mockReturnValue(builder({ data: [{ trip_id: 1 }, { trip_id: 2 }], error: null }));
    const { result } = renderHook(() => useTripLikes(mockUser));
    await waitFor(() => expect(result.current.isLiked(1)).toBe(true));
    expect(result.current.isLiked(2)).toBe(true);
    expect(result.current.isLiked(99)).toBe(false);
  });

  it("isLiked returns false for trips not in liked set", async () => {
    mockFrom.mockReturnValue(builder({ data: [], error: null }));
    const { result } = renderHook(() => useTripLikes(mockUser));
    await waitFor(() => expect(result.current.likedTripIds.size).toBe(0));
    expect(result.current.isLiked(42)).toBe(false);
  });

  it("toggleLike shows sign-in toast when no user", async () => {
    const { result } = renderHook(() => useTripLikes(null));
    let returned: boolean;
    await act(async () => { returned = await result.current.toggleLike(1); });
    expect(returned!).toBe(false);
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Please sign in" }));
  });

  it("toggleLike likes a trip not yet liked", async () => {
    mockFrom
      .mockReturnValueOnce(builder({ data: [], error: null }))
      .mockReturnValueOnce(builder({ data: null, error: null }));

    const { result } = renderHook(() => useTripLikes(mockUser));
    await waitFor(() => expect(result.current.likedTripIds.size).toBe(0));

    let returned: boolean;
    await act(async () => { returned = await result.current.toggleLike(5); });
    expect(returned!).toBe(true);
    expect(result.current.isLiked(5)).toBe(true);
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Added to favorites! ❤️" }));
  });

  it("toggleLike unlikes an already liked trip", async () => {
    mockFrom
      .mockReturnValueOnce(builder({ data: [{ trip_id: 5 }], error: null }))
      .mockReturnValueOnce(builder({ data: null, error: null }));

    const { result } = renderHook(() => useTripLikes(mockUser));
    await waitFor(() => expect(result.current.isLiked(5)).toBe(true));

    let returned: boolean;
    await act(async () => { returned = await result.current.toggleLike(5); });
    expect(returned!).toBe(false);
    expect(result.current.isLiked(5)).toBe(false);
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Removed from favorites" }));
  });

  it("handles supabase insert error gracefully", async () => {
    mockFrom
      .mockReturnValueOnce(builder({ data: [], error: null }))
      .mockReturnValueOnce(builder({ data: null, error: { message: "DB error", code: "500" } }));

    const { result } = renderHook(() => useTripLikes(mockUser));
    await waitFor(() => expect(result.current.likedTripIds.size).toBe(0));

    let returned: boolean;
    await act(async () => { returned = await result.current.toggleLike(5); });
    expect(returned!).toBe(false);
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Error" }));
  });

  it("handles duplicate insert (23505) gracefully", async () => {
    mockFrom
      .mockReturnValueOnce(builder({ data: [], error: null }))
      .mockReturnValueOnce(builder({ data: null, error: { code: "23505", message: "dup" } }));

    const { result } = renderHook(() => useTripLikes(mockUser));
    await waitFor(() => expect(result.current.likedTripIds.size).toBe(0));

    let returned: boolean;
    await act(async () => { returned = await result.current.toggleLike(5); });
    expect(returned!).toBe(true);
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Already liked!" }));
  });

  it("refreshLikes re-fetches from supabase", async () => {
    mockFrom
      .mockReturnValueOnce(builder({ data: [], error: null }))
      .mockReturnValueOnce(builder({ data: [{ trip_id: 7 }], error: null }));

    const { result } = renderHook(() => useTripLikes(mockUser));
    await waitFor(() => expect(result.current.likedTripIds.size).toBe(0));

    await act(async () => { await result.current.refreshLikes(); });
    expect(result.current.isLiked(7)).toBe(true);
  });
});
