// src/pages/DiscoverPage.tsx
import { User } from "@supabase/supabase-js";

interface DiscoverPageProps {
  user: User | null;
}

const DiscoverPage = ({ user }: DiscoverPageProps) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Discover Trips</h1>
      <p className="text-muted-foreground">
        Explore amazing trips planned by fellow travelers.
      </p>
      {/* Add your discover trips functionality here */}
    </div>
  );
};

export default DiscoverPage;

// Create similar files for:
// - MyTripsPage.tsx
// - CreateTripPage.tsx
// - CommunityPage.tsx
// - MessagesPage.tsx
// - SettingsPage.tsx
// - AuthPage.tsx
