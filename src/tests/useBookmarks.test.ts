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

import { useBookmarks } from "@/hooks/useBookmarks";

function builder(resolved: unknown) {
  const b: any = {};
  ["select", "insert", "delete", "eq", "order", "filter"].forEach((m) => {
    b[m] = vi.fn().mockReturnValue(b);
  });
  b.then = (resolve: any) => resolve(resolved);
  b.catch = () => b;
  return b;
}

const mockBookmarks = [
  { id: 1, user_id: mockUser.id, trip_id: 10, bookmarked_at: "2024-01-01T00:00:00Z" },
  { id: 2, user_id: mockUser.id, trip_id: 20, bookmarked_at: "2024-01-02T00:00:00Z" },
];

describe("useBookmarks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initialises with empty state when no user", async () => {
    const { result } = renderHook(() => useBookmarks(null));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.bookmarks).toHaveLength(0);
    expect(result.current.bookmarkedTripIds.size).toBe(0);
  });

  it("fetches bookmarks on mount for authenticated user", async () => {
    mockFrom.mockReturnValue(builder({ data: mockBookmarks, error: null }));
    const { result } = renderHook(() => useBookmarks(mockUser));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.bookmarks).toHaveLength(2);
    expect(result.current.isBookmarked(10)).toBe(true);
    expect(result.current.isBookmarked(20)).toBe(true);
    expect(result.current.isBookmarked(99)).toBe(false);
  });

  it("addBookmark adds a new trip and shows success toast", async () => {
    const bookmarksWithNew = [
      ...mockBookmarks,
      { id: 3, user_id: mockUser.id, trip_id: 30, bookmarked_at: "2024-01-03T00:00:00Z" },
    ];
    mockFrom
      .mockReturnValueOnce(builder({ data: mockBookmarks, error: null }))    // initial fetch
      .mockReturnValueOnce(builder({ data: null, error: null }))              // insert
      .mockReturnValueOnce(builder({ data: bookmarksWithNew, error: null })); // refetch after add

    const { result } = renderHook(() => useBookmarks(mockUser));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let added: boolean;
    await act(async () => { added = await result.current.addBookmark(30); });
    expect(added!).toBe(true);
    await waitFor(() => expect(result.current.isBookmarked(30)).toBe(true));
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "💾 Trip saved!" }));
  });

  it("addBookmark shows sign-in toast when no user", async () => {
    const { result } = renderHook(() => useBookmarks(null));
    let added: boolean;
    await act(async () => { added = await result.current.addBookmark(10); });
    expect(added!).toBe(false);
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Sign in required" }));
  });

  it("addBookmark handles duplicate (23505) gracefully", async () => {
    mockFrom
      .mockReturnValueOnce(builder({ data: [], error: null }))
      .mockReturnValueOnce(builder({ data: null, error: { code: "23505", message: "dup" } }));

    const { result } = renderHook(() => useBookmarks(mockUser));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let added: boolean;
    await act(async () => { added = await result.current.addBookmark(10); });
    expect(added!).toBe(false);
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Already saved!" }));
  });

  it("removeBookmark removes trip and updates local state", async () => {
    mockFrom
      .mockReturnValueOnce(builder({ data: mockBookmarks, error: null }))
      .mockReturnValueOnce(builder({ data: null, error: null }));

    const { result } = renderHook(() => useBookmarks(mockUser));
    await waitFor(() => expect(result.current.isBookmarked(10)).toBe(true));

    let removed: boolean;
    await act(async () => { removed = await result.current.removeBookmark(10); });
    expect(removed!).toBe(true);
    expect(result.current.isBookmarked(10)).toBe(false);
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Trip removed" }));
  });

  it("toggleBookmark adds when not bookmarked", async () => {
    const bookmarksWithNew = [
      { id: 1, user_id: mockUser.id, trip_id: 55, bookmarked_at: "2024-01-01T00:00:00Z" },
    ];
    mockFrom
      .mockReturnValueOnce(builder({ data: [], error: null }))               // initial fetch
      .mockReturnValueOnce(builder({ data: null, error: null }))             // insert
      .mockReturnValueOnce(builder({ data: bookmarksWithNew, error: null })); // refetch after add

    const { result } = renderHook(() => useBookmarks(mockUser));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.toggleBookmark(55); });
    await waitFor(() => expect(result.current.isBookmarked(55)).toBe(true));
  });

  it("toggleBookmark removes when already bookmarked", async () => {
    mockFrom
      .mockReturnValueOnce(builder({ data: [{ id: 1, user_id: mockUser.id, trip_id: 55, bookmarked_at: "2024-01-01" }], error: null }))
      .mockReturnValueOnce(builder({ data: null, error: null }));

    const { result } = renderHook(() => useBookmarks(mockUser));
    await waitFor(() => expect(result.current.isBookmarked(55)).toBe(true));

    await act(async () => { await result.current.toggleBookmark(55); });
    expect(result.current.isBookmarked(55)).toBe(false);
  });

  it("getBookmarkCount returns count from supabase", async () => {
    mockFrom
      .mockReturnValueOnce(builder({ data: mockBookmarks, error: null }))
      .mockReturnValueOnce(builder({ count: 7, error: null }));

    const { result } = renderHook(() => useBookmarks(mockUser));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let count: number;
    await act(async () => { count = await result.current.getBookmarkCount(10); });
    expect(count!).toBe(7);
  });

  it("getBookmarkCount returns 0 on error", async () => {
    mockFrom
      .mockReturnValueOnce(builder({ data: [], error: null }))
      .mockReturnValueOnce(builder({ count: null, error: { message: "fail" } }));

    const { result } = renderHook(() => useBookmarks(mockUser));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let count: number;
    await act(async () => { count = await result.current.getBookmarkCount(10); });
    expect(count!).toBe(0);
  });
});
