import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { mockUser } from "./supabaseMock";

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

import { useNotifications } from "@/hooks/useNotifications";

function builder(resolved: unknown) {
  const b: any = {};
  ["select", "insert", "update", "delete", "eq", "order", "is", "filter"].forEach((m) => {
    b[m] = vi.fn().mockReturnValue(b);
  });
  b.then = (resolve: any) => resolve(resolved);
  b.catch = () => b;
  return b;
}

const mockNotifications = [
  { id: "n1", user_id: mockUser.id, type: "join_request", title: "New Request", message: "Someone wants to join", is_read: false, created_at: "2024-01-02T00:00:00Z", updated_at: "2024-01-02T00:00:00Z" },
  { id: "n2", user_id: mockUser.id, type: "trip_update", title: "Trip Updated", message: "Your trip was updated", is_read: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z" },
];

describe("useNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not fetch when user is null", async () => {
    const { result } = renderHook(() => useNotifications(null));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockFrom).not.toHaveBeenCalled();
    expect(result.current.notifications).toHaveLength(0);
  });

  it("fetches notifications on mount and computes unreadCount", async () => {
    mockFrom.mockReturnValue(builder({ data: mockNotifications, error: null }));
    const { result } = renderHook(() => useNotifications(mockUser));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.notifications).toHaveLength(2);
    expect(result.current.unreadCount).toBe(1);
  });

  it("markAsRead updates notification locally and decrements unreadCount", async () => {
    mockFrom
      .mockReturnValueOnce(builder({ data: mockNotifications, error: null }))
      .mockReturnValueOnce(builder({ data: null, error: null }));

    const { result } = renderHook(() => useNotifications(mockUser));
    await waitFor(() => expect(result.current.unreadCount).toBe(1));

    await act(async () => { await result.current.markAsRead("n1"); });
    expect(result.current.notifications.find((n) => n.id === "n1")?.is_read).toBe(true);
    expect(result.current.unreadCount).toBe(0);
  });

  it("markAllAsRead marks all as read and resets unreadCount to 0", async () => {
    mockFrom
      .mockReturnValueOnce(builder({ data: mockNotifications, error: null }))
      .mockReturnValueOnce(builder({ data: null, error: null }));

    const { result } = renderHook(() => useNotifications(mockUser));
    await waitFor(() => expect(result.current.unreadCount).toBe(1));

    await act(async () => { await result.current.markAllAsRead(); });
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.notifications.every((n) => n.is_read)).toBe(true);
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Success" }));
  });

  it("deleteNotification removes notification from list", async () => {
    mockFrom
      .mockReturnValueOnce(builder({ data: mockNotifications, error: null }))
      .mockReturnValueOnce(builder({ data: null, error: null }));

    const { result } = renderHook(() => useNotifications(mockUser));
    await waitFor(() => expect(result.current.notifications).toHaveLength(2));

    await act(async () => { await result.current.deleteNotification("n1"); });
    expect(result.current.notifications.find((n) => n.id === "n1")).toBeUndefined();
    expect(result.current.notifications).toHaveLength(1);
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Notification deleted" }));
  });

  it("deleteNotification adjusts unreadCount when deleted notification was unread", async () => {
    mockFrom
      .mockReturnValueOnce(builder({ data: mockNotifications, error: null }))
      .mockReturnValueOnce(builder({ data: null, error: null }));

    const { result } = renderHook(() => useNotifications(mockUser));
    await waitFor(() => expect(result.current.unreadCount).toBe(1));

    await act(async () => { await result.current.deleteNotification("n1"); });
    expect(result.current.unreadCount).toBe(0);
  });

  it("deleteAllNotifications clears all notifications and resets unreadCount", async () => {
    mockFrom
      .mockReturnValueOnce(builder({ data: mockNotifications, error: null }))
      .mockReturnValueOnce(builder({ data: null, error: null }));

    const { result } = renderHook(() => useNotifications(mockUser));
    await waitFor(() => expect(result.current.notifications).toHaveLength(2));

    await act(async () => { await result.current.deleteAllNotifications(); });
    expect(result.current.notifications).toHaveLength(0);
    expect(result.current.unreadCount).toBe(0);
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "All notifications deleted" }));
  });

  it("shows error toast when fetch fails", async () => {
    mockFrom.mockReturnValue(builder({ data: null, error: { message: "DB error" } }));
    const { result } = renderHook(() => useNotifications(mockUser));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ variant: "destructive" }));
  });

  it("deleteAllNotifications does nothing when no user", async () => {
    const { result } = renderHook(() => useNotifications(null));
    await act(async () => { await result.current.deleteAllNotifications(); });
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
