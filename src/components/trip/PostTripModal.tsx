// src/components/trip/PostTripModal.tsx
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MapPin,
  MessageSquare,
  Users,
  Sparkles,
  IndianRupee,
  Edit3,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// ✅ NEW: Add trip data type for editing
interface TripData {
  id: number;
  destination: string;
  start_city: string;
  start_date: string;
  end_date: string;
  description: string | null;
  max_group_size: number;
  budget_per_person?: number;
  travel_style?: string[];
}

interface PostTripModalProps {
  open: boolean;
  onClose: () => void;
  onTripCreated?: () => void;
  onTripUpdated?: () => void; // ✅ NEW: Update callback
  tripData?: TripData; // ✅ NEW: Optional trip data for editing
  mode?: "create" | "edit"; // ✅ NEW: Modal mode
}

const availableTravelStyles = [
  { id: "adventure", label: "Adventure", emoji: "🏔️" },
  { id: "cultural", label: "Cultural", emoji: "🏛️" },
  { id: "relaxation", label: "Relaxation", emoji: "🌴" },
  { id: "foodie", label: "Foodie", emoji: "🍜" },
  { id: "nightlife", label: "Nightlife", emoji: "🌃" },
  { id: "budget", label: "Budget", emoji: "💰" },
  { id: "luxury", label: "Luxury", emoji: "✨" },
  { id: "solo-friendly", label: "Solo Friendly", emoji: "🎒" },
  { id: "photography", label: "Photography", emoji: "📸" },
  { id: "spiritual", label: "Spiritual", emoji: "🕉️" },
  { id: "backpacking", label: "Backpacking", emoji: "🏃‍♂️" },
  { id: "wellness", label: "Wellness", emoji: "🧘‍♀️" },
];

const PostTripModal = ({
  open,
  onClose,
  onTripCreated,
  onTripUpdated,
  tripData,
  mode = "create", // ✅ NEW: Default to create mode
}: PostTripModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // ✅ NEW: Initialize form based on mode
  const getInitialFormData = () => {
    if (mode === "edit" && tripData) {
      return {
        destination: tripData.destination,
        start_city: tripData.start_city,
        start_date: tripData.start_date.split("T")[0], // Format for date input
        end_date: tripData.end_date.split("T")[0],
        description: tripData.description || "",
        max_participants: tripData.max_group_size,
        budget_per_person: tripData.budget_per_person || 0,
        travel_style: tripData.travel_style || [],
      };
    }
    return {
      destination: "",
      start_city: "",
      start_date: "",
      end_date: "",
      description: "",
      max_participants: 8,
      budget_per_person: 0,
      travel_style: [] as string[],
    };
  };

  const [formData, setFormData] = useState(getInitialFormData());

  // ✅ NEW: Reset form when modal opens/closes or trip data changes
  useEffect(() => {
    if (open) {
      setFormData(getInitialFormData());
    }
  }, [open, tripData, mode]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleStyleToggle = (styleId: string) => {
    setFormData((prev) => {
      const styles = prev.travel_style.includes(styleId)
        ? prev.travel_style.filter((s) => s !== styleId)
        : [...prev.travel_style, styleId];
      return { ...prev, travel_style: styles };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to manage trips.");

      // Validate dates
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (startDate < today && mode === "create") {
        throw new Error("Start date cannot be in the past.");
      }

      if (endDate <= startDate) {
        throw new Error("End date must be after start date.");
      }

      if (mode === "edit" && tripData) {
        // ✅ UPDATE TRIP
        const updateData = {
          destination: formData.destination.trim(),
          start_city: formData.start_city.trim(),
          start_date: formData.start_date,
          end_date: formData.end_date,
          description: formData.description.trim() || null,
          max_group_size: formData.max_participants,
          budget_per_person:
            formData.budget_per_person > 0 ? formData.budget_per_person : null,
          travel_style:
            formData.travel_style.length > 0 ? formData.travel_style : null,
          updated_at: new Date().toISOString(),
        };

        console.log("Updating trip with data:", updateData);

        const { error } = await supabase
          .from("trips")
          .update(updateData)
          .eq("id", tripData.id);

        if (error) {
          console.error("Supabase update error:", error);
          throw error;
        }

        toast({
          title: "🎉 Trip Updated!",
          description: "Your trip details have been successfully updated!",
        });

        onTripUpdated?.();
      } else {
        // ✅ CREATE NEW TRIP
        const newTrip = {
          creator_id: user.id,
          destination: formData.destination.trim(),
          start_city: formData.start_city.trim(),
          start_date: formData.start_date,
          end_date: formData.end_date,
          description: formData.description.trim() || null,
          max_participants: formData.max_participants,
          budget_per_person:
            formData.budget_per_person > 0 ? formData.budget_per_person : null,
          travel_style:
            formData.travel_style.length > 0 ? formData.travel_style : null,
          status: "active",
          current_participants: 1,
        };

        console.log("Creating trip with data:", newTrip);

        const { data, error } = await supabase.from("trips").insert([newTrip])
          .select(`
            *,
            profiles:creator_id (
              full_name,
              avatar_url
            )
          `);

        if (error) {
          console.error("Supabase create error:", error);
          throw error;
        }

        console.log("Trip created successfully:", data);

        toast({
          title: "🎉 Trip Created!",
          description: "Your adventure is now live and ready for companions!",
        });

        onTripCreated?.();
      }

      // Reset form only for create mode
      if (mode === "create") {
        setFormData({
          destination: "",
          start_city: "",
          start_date: "",
          end_date: "",
          description: "",
          max_participants: 8,
          budget_per_person: 0,
          travel_style: [],
        });
      }

      onClose();
    } catch (error: any) {
      console.error(
        `Error ${mode === "edit" ? "updating" : "creating"} trip:`,
        error
      );
      toast({
        title: `Failed to ${mode === "edit" ? "update" : "create"} trip`,
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    formData.destination.trim() &&
    formData.start_city.trim() &&
    formData.start_date &&
    formData.end_date &&
    formData.description.trim();

  const formatBudget = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount}`;
  };

  // ✅ NEW: Dynamic content based on mode
  const modalContent = {
    create: {
      title: "Create Your Adventure",
      subtitle: "Share your travel plans and find amazing companions",
      buttonText: "Create Adventure",
      buttonIcon: <Sparkles className="w-4 h-4" />,
      loadingText: "Creating Trip...",
    },
    edit: {
      title: "Edit Your Adventure",
      subtitle: "Update your trip details and preferences",
      buttonText: "Update Trip",
      buttonIcon: <Edit3 className="w-4 h-4" />,
      loadingText: "Updating Trip...",
    },
  };

  const content = modalContent[mode];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="mx-4 rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-warm bg-clip-text text-transparent">
            {content.title}
          </DialogTitle>
          <p className="text-sm text-muted-foreground text-center">
            {content.subtitle}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Destination */}
          <div className="space-y-2">
            <Label
              htmlFor="destination"
              className="text-sm font-medium flex items-center gap-2"
            >
              <MapPin className="w-4 h-4 text-accent" />
              Where are we going? *
            </Label>
            <Input
              id="destination"
              placeholder="e.g., Weekend Trek to Triund"
              value={formData.destination}
              onChange={(e) => handleInputChange("destination", e.target.value)}
              className="rounded-xl border-0 bg-muted/50 focus:bg-white transition-colors"
              required
            />
          </div>

          {/* Start City */}
          <div className="space-y-2">
            <Label htmlFor="start_city" className="text-sm font-medium">
              Starting from *
            </Label>
            <Input
              id="start_city"
              placeholder="e.g., Mumbai, Delhi, Bangalore"
              value={formData.start_city}
              onChange={(e) => handleInputChange("start_city", e.target.value)}
              className="rounded-xl border-0 bg-muted/50 focus:bg-white transition-colors"
              required
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="start_date"
                className="text-sm font-medium flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-accent" />
                Start Date *
              </Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) =>
                  handleInputChange("start_date", e.target.value)
                }
                className="rounded-xl border-0 bg-muted/50 focus:bg-white transition-colors"
                min={
                  mode === "create"
                    ? new Date().toISOString().split("T")[0]
                    : undefined
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date" className="text-sm font-medium">
                End Date *
              </Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => handleInputChange("end_date", e.target.value)}
                className="rounded-xl border-0 bg-muted/50 focus:bg-white transition-colors"
                min={
                  formData.start_date || new Date().toISOString().split("T")[0]
                }
                required
              />
            </div>
          </div>

          {/* Budget */}
          <div className="space-y-2">
            <Label
              htmlFor="budget"
              className="text-sm font-medium flex items-center gap-2"
            >
              <IndianRupee className="w-4 h-4 text-accent" />
              Budget per person (optional)
            </Label>
            <Input
              id="budget"
              type="number"
              placeholder="e.g., 5000"
              value={
                formData.budget_per_person === 0
                  ? ""
                  : formData.budget_per_person
              }
              onChange={(e) =>
                handleInputChange(
                  "budget_per_person",
                  parseInt(e.target.value) || 0
                )
              }
              className="rounded-xl border-0 bg-muted/50 focus:bg-white transition-colors"
              min="0"
              step="100"
            />
            {formData.budget_per_person > 0 && (
              <p className="text-xs text-muted-foreground">
                Budget: {formatBudget(formData.budget_per_person)} per person
              </p>
            )}
          </div>

          {/* Group Size */}
          <div className="space-y-2">
            <Label
              htmlFor="max_participants"
              className="text-sm font-medium flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-accent" />
              Max Group Size
            </Label>
            <Input
              id="max_participants"
              type="number"
              value={formData.max_participants}
              onChange={(e) =>
                handleInputChange(
                  "max_participants",
                  parseInt(e.target.value) || 8
                )
              }
              className="rounded-xl border-0 bg-muted/50 focus:bg-white transition-colors"
              min="2"
              max="50"
              placeholder="Maximum number of people"
            />
          </div>

          {/* Travel Style */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              Travel Style (optional)
            </Label>
            <div className="flex flex-wrap gap-2">
              {availableTravelStyles.map((style) => (
                <Badge
                  key={style.id}
                  variant={
                    formData.travel_style.includes(style.id)
                      ? "default"
                      : "outline"
                  }
                  onClick={() => handleStyleToggle(style.id)}
                  className={`cursor-pointer transition-all hover:scale-105 ${
                    formData.travel_style.includes(style.id)
                      ? "bg-accent hover:bg-accent/90 text-accent-foreground"
                      : "hover:bg-accent/10 border-accent/20"
                  }`}
                >
                  <span className="mr-1">{style.emoji}</span>
                  {style.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label
              htmlFor="description"
              className="text-sm font-medium flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-accent" />
              Describe the Plan & Vibe *
            </Label>
            <Textarea
              id="description"
              placeholder="What's the plan? What kind of vibe are you going for? Any specific activities, requirements, or things to know?"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="rounded-xl min-h-[120px] resize-none border-0 bg-muted/50 focus:bg-white transition-colors"
              rows={5}
              required
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-medium py-3 rounded-xl transition-all hover:scale-[1.02] shadow-soft"
              disabled={!isFormValid || loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {content.loadingText}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {content.buttonIcon}
                  {content.buttonText}
                </span>
              )}
            </Button>
          </div>

          {!isFormValid && (
            <p className="text-xs text-muted-foreground text-center">
              Please fill in all required fields (*) to{" "}
              {mode === "edit" ? "update" : "create"} your trip
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PostTripModal;
