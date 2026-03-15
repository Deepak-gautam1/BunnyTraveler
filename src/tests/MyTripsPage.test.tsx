import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { mockUser } from "./supabaseMock";

const { mockFrom, toastMock, mockUseBookmarks } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  toastMock: vi.fn(),
  mockUseBookmarks: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: mockFrom } }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: toastMock }) }));
vi.mock("@/hooks/useBookmarks", () => ({ useBookmarks: mockUseBookmarks }));
vi.mock("@/components/trip/PostTripModal", () => ({
  default: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? <div data-testid="post-trip-modal"><button onClick={onClose}>Close</button></div> : null,
}));
vi.mock("@/pages/SavedTripsPage", () => ({
  default: () => <div data-testid="saved-trips-page">Saved Trips</div>,
}));

import MyTripsPage from "@/pages/MyTripsPage";

function builder(resolved: unknown) {
  const b: any = {};
  ["select", "eq", "order"].forEach((m) => { b[m] = vi.fn().mockReturnValue(b); });
  b.then = (resolve: any) => resolve(resolved);
  b.catch = () => b;
  return b;
}

const mockCreatedTrips = [
  {
    id: 1, destination: "Goa", start_city: "Mumbai",
    start_date: "2025-12-01", end_date: "2025-12-07",
    description: "Beach trip", created_at: "2024-01-01T00:00:00Z",
    max_participants: 8, current_participants: 3,
    budget_per_person: 5000, travel_style: ["Relaxation"],
    status: "active", completed_at: null, creator_id: mockUser.id,
    profiles: { full_name: "Test User", avatar_url: null },
    trip_participants: [],
  },
];

const renderPage = (user = mockUser) =>
  render(<MemoryRouter><MyTripsPage user={user as any} /></MemoryRouter>);

describe("MyTripsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseBookmarks.mockReturnValue({
      bookmarks: [], loading: false,
      toggleBookmark: vi.fn(), isBookmarked: vi.fn(), refreshBookmarks: vi.fn(),
    });
  });

  it("shows sign-in prompt when user is null", () => {
    renderPage(null as any);
    // Match the paragraph text specifically — avoids the "Sign In" link also matching /sign in/i
    expect(screen.getByText(/sign in to view and manage your trips/i)).toBeInTheDocument();
  });

  it("shows loading spinner while fetching", () => {
    mockUseBookmarks.mockReturnValue({
      bookmarks: [], loading: true,
      toggleBookmark: vi.fn(), isBookmarked: vi.fn(), refreshBookmarks: vi.fn(),
    });
    mockFrom.mockReturnValue(builder({ data: [], error: null }));
    renderPage();
    expect(screen.getByText(/loading your trips/i)).toBeInTheDocument();
  });

  it("renders all four tabs", async () => {
    mockFrom.mockReturnValue(builder({ data: [], error: null }));
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /created/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /joined/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /saved/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /history/i })).toBeInTheDocument();
    });
  });

  it("fetches and renders created trips", async () => {
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return builder({ data: mockCreatedTrips, error: null });
      return builder({ data: [], error: null });
    });
    renderPage();
    await waitFor(() => expect(screen.getByText("Goa")).toBeInTheDocument());
  });

  it("shows empty state for created trips when none exist", async () => {
    mockFrom.mockReturnValue(builder({ data: [], error: null }));
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/no trips created yet/i)).toBeInTheDocument()
    );
  });

  it("shows empty state for joined trips tab", async () => {
    mockFrom.mockReturnValue(builder({ data: [], error: null }));
    renderPage();
    // Wait for initial load first so the page is stable
    await waitFor(() =>
      expect(screen.getByText(/no trips created yet/i)).toBeInTheDocument()
    );
    // userEvent fires the full pointer-event chain that Radix UI requires
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: /joined/i }));
    await waitFor(() =>
      expect(screen.getByText(/no trips joined yet/i)).toBeInTheDocument()
    );
  });

  it("shows empty state for history tab", async () => {
    mockFrom.mockReturnValue(builder({ data: [], error: null }));
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/no trips created yet/i)).toBeInTheDocument()
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: /history/i }));
    await waitFor(() =>
      expect(screen.getByText(/no completed trips yet/i)).toBeInTheDocument()
    );
  });

  it("renders saved trips tab with SavedTripsPage component", async () => {
    mockFrom.mockReturnValue(builder({ data: [], error: null }));
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/no trips created yet/i)).toBeInTheDocument()
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: /saved/i }));
    await waitFor(() =>
      expect(screen.getByTestId("saved-trips-page")).toBeInTheDocument()
    );
  });

  it("opens PostTripModal when Create New Trips is clicked", async () => {
    mockFrom.mockReturnValue(builder({ data: [], error: null }));
    renderPage();
    await waitFor(() => screen.getByRole("button", { name: /create new trips/i }));
    fireEvent.click(screen.getByRole("button", { name: /create new trips/i }));
    await waitFor(() =>
      expect(screen.getByTestId("post-trip-modal")).toBeInTheDocument()
    );
  });

  it("closes PostTripModal when closed", async () => {
    mockFrom.mockReturnValue(builder({ data: [], error: null }));
    renderPage();
    await waitFor(() => screen.getByRole("button", { name: /create new trips/i }));
    fireEvent.click(screen.getByRole("button", { name: /create new trips/i }));
    await waitFor(() => screen.getByTestId("post-trip-modal"));
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    await waitFor(() =>
      expect(screen.queryByTestId("post-trip-modal")).not.toBeInTheDocument()
    );
  });

  it("shows error toast when fetch fails", async () => {
    mockFrom.mockReturnValue(builder({ data: null, error: { message: "DB error" } }));
    renderPage();
    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Error" })
      )
    );
  });

  it("Create Your First Trip button opens modal from empty state", async () => {
    mockFrom.mockReturnValue(builder({ data: [], error: null }));
    renderPage();
    await waitFor(() =>
      screen.getByRole("button", { name: /create your first trip/i })
    );
    fireEvent.click(screen.getByRole("button", { name: /create your first trip/i }));
    await waitFor(() =>
      expect(screen.getByTestId("post-trip-modal")).toBeInTheDocument()
    );
  });
});
