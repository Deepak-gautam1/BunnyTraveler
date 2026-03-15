import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { mockUser } from "./supabaseMock";

const { mockFrom, toastMock } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  toastMock: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: mockFrom },
}));

vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: toastMock }) }));

import { useTripStatus } from "@/hooks/useTripStatus";

function builder(resolved: unknown) {
  const b: any = {};
  ["select", "update", "insert", "eq"].forEach((m) => {
    b[m] = vi.fn().mockReturnValue(b);
  });
  b.maybeSingle = vi.fn().mockResolvedValue(resolved);
  b.then = (resolve: any) => resolve(resolved);
  b.catch = () => b;
  return b;
}

describe("useTripStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false and does nothing when no user", async () => {
    const { result } = renderHook(() => useTripStatus(null));
    let returned: boolean;
    await act(async () => { returned = await result.current.updateTripStatus(1, "confirmed"); });
    expect(returned!).toBe(false);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("loading is false initially", () => {
    const { result } = renderHook(() => useTripStatus(mockUser));
    expect(result.current.loading).toBe(false);
  });

  it("updateTripStatus returns false when trip not found", async () => {
    mockFrom.mockReturnValue(builder({ data: null, error: null }));
    const { result } = renderHook(() => useTripStatus(mockUser));
    let returned: boolean;
    await act(async () => { returned = await result.current.updateTripStatus(99, "confirmed"); });
    expect(returned!).toBe(false);
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Update failed" }));
  });

  it("updateTripStatus returns false when user is not creator", async () => {
    mockFrom.mockReturnValue(
      builder({ data: { status: "planning", creator_id: "other-user" }, error: null })
    );
    const { result } = renderHook(() => useTripStatus(mockUser));
    let returned: boolean;
    await act(async () => { returned = await result.current.updateTripStatus(1, "confirmed"); });
    expect(returned!).toBe(false);
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Update failed" }));
  });

  it("updateTripStatus succeeds when user is creator", async () => {
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      // call 1: select trip (maybeSingle resolves to creator match)
      if (callCount === 1) return builder({ data: { status: "planning", creator_id: mockUser.id }, error: null });
      // call 2: update trip
      if (callCount === 2) return builder({ data: null, error: null });
      // call 3: insert status history
      return builder({ data: null, error: null });
    });

    const { result } = renderHook(() => useTripStatus(mockUser));
    let returned: boolean;
    await act(async () => { returned = await result.current.updateTripStatus(1, "confirmed", "Manual confirm"); });
    expect(returned!).toBe(true);
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Trip confirmed!" }));
  });

  it("updateTripStatus returns false on supabase update error", async () => {
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return builder({ data: { status: "planning", creator_id: mockUser.id }, error: null });
      return builder({ data: null, error: { message: "Update failed in DB" } });
    });

    const { result } = renderHook(() => useTripStatus(mockUser));
    let returned: boolean;
    await act(async () => { returned = await result.current.updateTripStatus(1, "confirmed"); });
    expect(returned!).toBe(false);
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Update failed" }));
  });

  it("autoUpdateStatusBasedOnDates transitions confirmed → ongoing when within trip dates", async () => {
    const now = new Date();
    const start = new Date(now.getTime() - 1000 * 60 * 60).toISOString(); // 1hr ago
    const end = new Date(now.getTime() + 1000 * 60 * 60).toISOString();   // 1hr ahead

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // autoUpdate fetch
        return builder({ data: { status: "confirmed", start_date: start, end_date: end, creator_id: mockUser.id }, error: null });
      }
      // updateTripStatus inner calls
      if (callCount === 2) return builder({ data: { status: "confirmed", creator_id: mockUser.id }, error: null });
      return builder({ data: null, error: null });
    });

    const { result } = renderHook(() => useTripStatus(mockUser));
    await act(async () => { await result.current.autoUpdateStatusBasedOnDates(1); });
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Trip ongoing!" }));
  });

  it("autoUpdateStatusBasedOnDates transitions ongoing → completed after trip ends", async () => {
    const past = new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(); // 2 days ago

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return builder({ data: { status: "ongoing", start_date: past, end_date: past, creator_id: mockUser.id }, error: null });
      }
      if (callCount === 2) return builder({ data: { status: "ongoing", creator_id: mockUser.id }, error: null });
      return builder({ data: null, error: null });
    });

    const { result } = renderHook(() => useTripStatus(mockUser));
    await act(async () => { await result.current.autoUpdateStatusBasedOnDates(1); });
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Trip completed!" }));
  });
});
