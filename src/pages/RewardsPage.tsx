import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import CouponsList from "@/components/rewards/CouponsList";

interface RewardsPageProps {
  user: User | null;
}

const RewardsPage = ({ user }: RewardsPageProps) => {
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Gift className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-3xl font-bold mb-4">My Rewards</h1>
          <p className="text-muted-foreground mb-6">
            Sign in to view your earned rewards and coupons
          </p>
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <Button variant="ghost" asChild className="mb-4">
        <Link to="/settings">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Settings
        </Link>
      </Button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Gift className="w-8 h-8 text-accent" />
          My Rewards
        </h1>
        <p className="text-muted-foreground">
          View and manage your earned discount coupons from partner brands
        </p>
      </div>

      {/* How to Earn Section */}
      <Card className="mb-6 bg-gradient-to-r from-accent/10 to-accent/5 border-accent/30">
        <CardHeader>
          <CardTitle className="text-lg">How to Earn Rewards</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-accent font-bold">1.</span>
              Create a trip and share your unique referral code
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent font-bold">2.</span>
              Get at least 3 participants to join using your referral code
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent font-bold">3.</span>
              Complete the trip with all participants
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent font-bold">4.</span>
              Receive exclusive discount coupons from our partners!
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Coupons List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Coupons</CardTitle>
        </CardHeader>
        <CardContent>
          <CouponsList userId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
};

export default RewardsPage;
