import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { mockUser } from "./supabaseMock";

const { mockToggleBookmark, mockRefreshBookmarks, mockIsBookmarked, mockUseBookmarks } =
  vi.hoisted(() => ({
    mockToggleBookmark:   vi.fn().mockResolvedValue(true),
    mockRefreshBookmarks: vi.fn(),
    mockIsBookmarked:     vi.fn().mockReturnValue(true),
    mockUseBookmarks:     vi.fn(),
  }));

vi.mock("@/hooks/useBookmarks", () => ({ useBookmarks: mockUseBookmarks }));
vi.mock("@/components/home/EnhancedTripCard", () => ({
  default: ({
    destination,
    onClick,
    onBookmarkClick,
  }: {
    destination: string;
    onClick: () => void;
    onBookmarkClick: () => void;
  }) => (
    <div data-testid="trip-card" onClick={onClick}>
      <span>{destination}</span>
      <button onClick={onBookmarkClick} aria-label="Remove bookmark">
        Remove
      </button>
    </div>
  ),
}));
vi.mock("@/lib/cookies", () => ({
  getCookie:   vi.fn().mockReturnValue(null),
  setCookie:   vi.fn(),
  COOKIE_KEYS: { BOOKMARKS_SORT: "bs", BOOKMARKS_VIEW: "bv" },
}));

import SavedTripsPage from "@/pages/SavedTripsPage";

// Default sort = newest-first by bookmarked_at.
// 2024-07-01 (Manali, trip 20) > 2024-06-01 (Goa, trip 10)
// → rendered order: [Manali (index 0), Goa (index 1)]
const mockBookmarks = [
  {
    id: 1, user_id: mockUser.id, trip_id: 10,
    bookmarked_at: "2024-06-01T00:00:00Z",
    trips: {
      id: 10, destination: "Goa", start_city: "Mumbai",
      start_date: "2024-12-01", end_date: "2024-12-07",
      description: "Beach vibes", budget_per_person: 5000,
      travel_style: ["Relaxation"], max_participants: 8, current_participants: 3,
      profiles: { full_name: "Test Creator", avatar_url: null },
    },
  },
  {
    id: 2, user_id: mockUser.id, trip_id: 20,
    bookmarked_at: "2024-07-01T00:00:00Z",
    trips: {
      id: 20, destination: "Manali", start_city: "Delhi",
      start_date: "2025-01-01", end_date: "2025-01-07",
      description: "Snow trek", budget_per_person: 8000,
      travel_style: ["Adventure"], max_participants: 6, current_participants: 2,
      profiles: null,
    },
  },
];

const baseHook = {
  bookmarks:        mockBookmarks,
  loading:          false,
  toggleBookmark:   mockToggleBookmark,
  isBookmarked:     mockIsBookmarked,
  refreshBookmarks: mockRefreshBookmarks,
};

const renderPage = (user = mockUser) =>
  render(
    <MemoryRouter>
      <SavedTripsPage user={user as any} />
    </MemoryRouter>
  );

describe("SavedTripsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseBookmarks.mockReturnValue(baseHook);
  });

  it("shows sign-in prompt when user is null", () => {
    mockUseBookmarks.mockReturnValue({ ...baseHook, bookmarks: [] });
    renderPage(null as any);
    expect(screen.getByText(/sign in to view saved trips/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("shows loading spinner while fetching", () => {
    mockUseBookmarks.mockReturnValue({ ...baseHook, loading: true, bookmarks: [] });
    renderPage();
    expect(screen.getByText(/loading saved trips/i)).toBeInTheDocument();
  });

  it("renders all bookmarked trips", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getAllByTestId("trip-card")).toHaveLength(2)
    );
    expect(screen.getByText("Goa")).toBeInTheDocument();
    expect(screen.getByText("Manali")).toBeInTheDocument();
  });

  it("shows correct saved count badge", () => {
    renderPage();
    expect(screen.getByText(/2 saved trips/i)).toBeInTheDocument();
  });

  it("shows empty state when no bookmarks", () => {
    mockUseBookmarks.mockReturnValue({ ...baseHook, bookmarks: [] });
    renderPage();
    expect(screen.getByText(/no saved trips yet/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /discover trips/i })).toBeInTheDocument();
  });

  it("filters trips by search term", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getAllByTestId("trip-card")).toHaveLength(2)
    );
    fireEvent.change(
      screen.getByRole("textbox", { name: /search saved trips/i }),
      { target: { value: "Goa" } }
    );
    await waitFor(() =>
      expect(screen.getAllByTestId("trip-card")).toHaveLength(1)
    );
    expect(screen.getByText("Goa")).toBeInTheDocument();
    expect(screen.queryByText("Manali")).not.toBeInTheDocument();
  });

  it("shows no-match message when search finds nothing", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getAllByTestId("trip-card")).toHaveLength(2)
    );
    fireEvent.change(
      screen.getByRole("textbox", { name: /search saved trips/i }),
      { target: { value: "Timbuktu" } }
    );
    await waitFor(() =>
      expect(screen.queryAllByTestId("trip-card")).toHaveLength(0)
    );
    expect(screen.getByText(/no trips match your search/i)).toBeInTheDocument();
  });

  it("calls refreshBookmarks when refresh button clicked", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /refresh saved trips/i }));
    expect(mockRefreshBookmarks).toHaveBeenCalledTimes(1);
  });

  it("calls toggleBookmark with correct trip_id when remove clicked", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getAllByTestId("trip-card")).toHaveLength(2)
    );

    const removeButtons = screen.getAllByRole("button", { name: /remove bookmark/i });

    // Newest-first sort: Manali (trip 20, July) is index 0, Goa (trip 10, June) is index 1
    fireEvent.click(removeButtons[0]);
    expect(mockToggleBookmark).toHaveBeenNthCalledWith(1, 20);

    fireEvent.click(removeButtons[1]);
    expect(mockToggleBookmark).toHaveBeenNthCalledWith(2, 10);
  });

  it("view mode toggles aria-pressed state correctly", async () => {
    renderPage();
    const listBtn = screen.getByRole("button", { name: /list view/i });
    const gridBtn = screen.getByRole("button", { name: /grid view/i });

    // Default is list
    expect(listBtn).toHaveAttribute("aria-pressed", "true");
    expect(gridBtn).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(gridBtn);
    await waitFor(() => {
      expect(gridBtn).toHaveAttribute("aria-pressed", "true");
      expect(listBtn).toHaveAttribute("aria-pressed", "false");
    });
  });
});
