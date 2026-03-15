import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { mockUser } from "./supabaseMock";

const { mockFrom, mockChannelObj, removeChannelMock } = vi.hoisted(() => {
  const mockChannelObj = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn((cb?: (status: string) => void) => {
      cb?.("SUBSCRIBED");
      return mockChannelObj;
    }),
  };
  return {
    mockFrom: vi.fn(),
    mockChannelObj,
    removeChannelMock: vi.fn(),
  };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: mockFrom,
    channel: vi.fn().mockReturnValue(mockChannelObj),
    removeChannel: removeChannelMock,
  },
}));

import { useUnreadMessages } from "@/hooks/useUnreadMessages";

function builder(resolved: unknown) {
  const b: any = {};
  ["select", "eq", "is"].forEach((m) => {
    b[m] = vi.fn().mockReturnValue(b);
  });
  b.then = (resolve: any) => resolve(resolved);
  b.catch = () => b;
  return b;
}

describe("useUnreadMessages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-apply subscribe mock after clearAllMocks
    mockChannelObj.on.mockReturnThis();
    mockChannelObj.subscribe.mockReturnThis();
  });

  it("returns 0 when user is null", () => {
    const { result } = renderHook(() => useUnreadMessages(null));
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.loading).toBe(false);
  });

  it("fetches unread count on mount for authenticated user", async () => {
    mockFrom.mockReturnValue(builder({ count: 5, error: null }));
    const { result } = renderHook(() => useUnreadMessages(mockUser));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.unreadCount).toBe(5);
  });

  it("sets unreadCount to 0 when supabase returns null count", async () => {
    mockFrom.mockReturnValue(builder({ count: null, error: null }));
    const { result } = renderHook(() => useUnreadMessages(mockUser));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.unreadCount).toBe(0);
  });

  it("handles fetch error gracefully without crashing", async () => {
    mockFrom.mockReturnValue(builder({ count: null, error: { message: "DB error" } }));
    const { result } = renderHook(() => useUnreadMessages(mockUser));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.unreadCount).toBe(0);
  });

  it("refreshCount re-fetches the unread count", async () => {
    mockFrom
      .mockReturnValueOnce(builder({ count: 3, error: null }))
      .mockReturnValueOnce(builder({ count: 7, error: null }));

    const { result } = renderHook(() => useUnreadMessages(mockUser));
    await waitFor(() => expect(result.current.unreadCount).toBe(3));

    await act(async () => { await result.current.refreshCount(); });
    expect(result.current.unreadCount).toBe(7);
  });

  it("cleans up realtime channel on unmount", async () => {
    mockFrom.mockReturnValue(builder({ count: 2, error: null }));
    const { unmount } = renderHook(() => useUnreadMessages(mockUser));
    await waitFor(() => {});
    unmount();
    expect(removeChannelMock).toHaveBeenCalled();
  });

  it("responds to custom unread-count-changed window event", async () => {
    mockFrom
      .mockReturnValueOnce(builder({ count: 1, error: null }))
      .mockReturnValueOnce(builder({ count: 4, error: null }));

    const { result } = renderHook(() => useUnreadMessages(mockUser));
    await waitFor(() => expect(result.current.unreadCount).toBe(1));

    await act(async () => {
      window.dispatchEvent(new Event("unread-count-changed"));
    });

    await waitFor(() => expect(result.current.unreadCount).toBe(4));
  });

  it("does not subscribe to realtime when user is null", () => {
    renderHook(() => useUnreadMessages(null));
    // channel should never be called when user is null — verify via the hoisted mock
    expect(mockChannelObj.on).not.toHaveBeenCalled();
    expect(mockChannelObj.subscribe).not.toHaveBeenCalled();
  });
});
