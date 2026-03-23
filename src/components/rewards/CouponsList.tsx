// src/components/rewards/CouponsList.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Gift,
  Calendar,
  Copy,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Coupon {
  id: string;
  status: string | null;
  awarded_at: string | null;
  used_at: string | null;
  coupon: {
    code: string;
    title: string;
    description: string | null;
    discount_type: string | null;
    discount_value: number | null;
    partner_name: string;
    partner_logo_url: string | null;
    valid_until: string | null;
    category: string | null;
  };
  trip: {
    destination: string;
  } | null;
}

const CouponsList = ({ userId }: { userId: string }) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoupons = async () => {
      if (!userId) return;

      try {
        const { data, error } = await supabase
          .from("user_coupons")
          .select(
            `
            *,
            coupon:coupons(*),
            trip:trips(destination)
          `
          )
          .eq("user_id", userId)
          .order("awarded_at", { ascending: false });

        if (error) throw error;
        setCoupons(data || []);
      } catch {
        toast.error("Failed to load coupons");
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, [userId]);

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Coupon code copied to clipboard!");
  };

  const markAsUsed = async (couponId: string) => {
    try {
      const { error } = await supabase
        .from("user_coupons")
        .update({ status: "used", used_at: new Date().toISOString() })
        .eq("id", couponId);

      if (error) throw error;

      toast.success("Coupon marked as used ✓");
      setCoupons((prev) =>
        prev.map((c) =>
          c.id === couponId
            ? { ...c, status: "used", used_at: new Date().toISOString() }
            : c
        )
      );
    } catch {
      toast.error("Failed to update coupon");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading your rewards...</p>
      </div>
    );
  }

  if (coupons.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4">
          <Gift className="w-8 h-8 text-accent" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Coupons Yet</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Host a trip and get 3+ confirmed attendees to earn your first reward
          coupon!
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="w-4 h-4 text-yellow-500" />
          <span>
            Create amazing trips to unlock exclusive partner discounts
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Banner */}
      <Card className="p-4 bg-gradient-to-r from-accent/10 to-accent/5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Total Rewards Earned
            </p>
            <p className="text-2xl font-bold">{coupons.length}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Active Coupons</p>
            <p className="text-2xl font-bold text-green-600">
              {coupons.filter((c) => c.status === "active").length}
            </p>
          </div>
        </div>
      </Card>

      {/* Coupons List */}
      {coupons.map((userCoupon) => (
        <Card key={userCoupon.id} className="overflow-hidden">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">
                    {userCoupon.coupon.title}
                  </h3>
                  <Badge
                    variant={
                      userCoupon.status === "used" ? "secondary" : "default"
                    }
                    className={
                      userCoupon.status === "active"
                        ? "bg-green-500 text-white"
                        : ""
                    }
                  >
                    {userCoupon.status}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {userCoupon.coupon.category}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {userCoupon.coupon.description}
                </p>

                {/* Trip earned from */}
                {userCoupon.trip && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <Sparkles className="w-3 h-3 text-yellow-500" />
                    <span>
                      Earned from trip to{" "}
                      <strong>{userCoupon.trip.destination}</strong>
                    </span>
                  </div>
                )}

                {/* Details */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Valid until:{" "}
                      {format(
                        new Date(userCoupon.coupon.valid_until ?? 0),
                        "MMM dd, yyyy"
                      )}
                    </span>
                  </div>
                  <div className="font-semibold text-accent">
                    {userCoupon.coupon.discount_type === "percentage"
                      ? `${userCoupon.coupon.discount_value}% OFF`
                      : `₹${userCoupon.coupon.discount_value} OFF`}
                  </div>
                </div>
              </div>

              {/* Partner Logo */}
              {userCoupon.coupon.partner_logo_url && (
                <div className="ml-4 flex-shrink-0">
                  <img
                    src={userCoupon.coupon.partner_logo_url}
                    alt={userCoupon.coupon.partner_name}
                    className="w-20 h-20 object-contain rounded-lg border p-2"
                  />
                </div>
              )}
            </div>

            {/* Coupon Code Section */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <code className="text-lg font-mono bg-accent/10 px-4 py-2 rounded-lg font-bold border-2 border-dashed border-accent/30">
                    {userCoupon.coupon.code}
                  </code>
                  <div className="text-sm">
                    <p className="font-medium">
                      {userCoupon.coupon.partner_name}
                    </p>
                    <p className="text-xs text-muted-foreground">Partner</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyCouponCode(userCoupon.coupon.code)}
                    disabled={userCoupon.status === "used"}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Code
                  </Button>
                  {userCoupon.status === "active" && (
                    <Button size="sm" onClick={() => markAsUsed(userCoupon.id)}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Used
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Used timestamp */}
            {userCoupon.used_at && (
              <div className="mt-3 text-xs text-muted-foreground">
                Used on{" "}
                {format(
                  new Date(userCoupon.used_at),
                  "MMM dd, yyyy 'at' hh:mm a"
                )}
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default CouponsList;
