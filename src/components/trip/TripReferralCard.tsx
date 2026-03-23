import { Button } from "@/components/ui/button";

import { Card, CardContent } from "@/components/ui/card";
import { Copy, Gift, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ParticipantStats } from "@/types/trip";

interface TripReferralCardProps {
  referralCode: string;
  couponAwarded: boolean;
  destination: string;
  tripId: number;
  stats: ParticipantStats;
}

const TripReferralCard = ({
  referralCode,
  couponAwarded,
  destination,
  tripId,
  stats,
}: TripReferralCardProps) => {
  const { toast } = useToast();
  const remaining = Math.max(0, 3 - stats.referral_participants);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    toast({ title: "Copied!", description: "Referral code copied to clipboard" });
  };

  const handleShare = () => {
    const shareText = `Join my trip to ${destination}! 🌍\n\nUse referral code: ${referralCode}\n\n${window.location.origin}/trip/${tripId}?ref=${referralCode}`;
    if (navigator.share) {
      navigator.share({ title: `Trip to ${destination}`, text: shareText });
    } else {
      navigator.clipboard.writeText(shareText);
      toast({ title: "Copied!", description: "Share link copied to clipboard" });
    }
  };

  return (
    <Card className="mb-6 bg-gradient-to-r from-accent/10 to-accent/5 border-accent/30">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <Gift className="w-5 h-5 text-accent" />
          <h3 className="font-semibold text-lg">Your Trip Referral Code</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Share this code with friends to invite them! Get 3+ confirmed attendees to earn a reward coupon.
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          <code className="text-2xl font-mono font-bold bg-background px-4 py-2 rounded-lg border-2 border-dashed border-accent">
            {referralCode}
          </code>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleCopy}>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
            <Button size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Share Trip
            </Button>
          </div>
        </div>

        {!couponAwarded && (
          <>
            {remaining > 0 ? (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>{remaining} more participant{remaining !== 1 ? "s" : ""}</strong>{" "}
                  needed via your referral code to earn a reward coupon!
                </p>
              </div>
            ) : (
              <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg border-2 border-green-300 dark:border-green-700 animate-in fade-in duration-500">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-full">
                    <Gift className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-green-900 dark:text-green-100 mb-1">
                      🎉 Coupon Unlocked!
                    </p>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Amazing!{" "}
                      <strong>{stats.referral_participants} participants</strong>{" "}
                      joined using your referral code. Your reward coupon will be awarded after the trip completes.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {couponAwarded && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg flex items-center gap-2">
            <Gift className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-800 dark:text-green-200 font-medium">
              Congratulations! You've earned a reward coupon. Check your Settings → My Rewards!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TripReferralCard;
