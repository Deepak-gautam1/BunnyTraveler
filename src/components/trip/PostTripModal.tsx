import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getCityCoordinates } from "@/lib/geocoding";

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
  onTripUpdated?: () => void;
  tripData?: TripData;
  mode?: "create" | "edit";
}

const availableInterests = [
  {
    category: "Travel Styles",
    tags: [
      { name: "City Exploration", emoji: "🏙️" },
      { name: "Backpacking", emoji: "🎒" },
      { name: "Road Trips", emoji: "🚗" },
      { name: "Photography Tours", emoji: "📷" },
      { name: "Cruise Travel", emoji: "🚢" },
      { name: "Train Journeys", emoji: "🚆" },
      { name: "Desert Exploration", emoji: "🌵" },
      { name: "Solo Travel", emoji: "🧳" },
      { name: "Luxury Travel", emoji: "👑" },
      { name: "Budget Travel", emoji: "💸" },
      { name: "Slow Travel", emoji: "🐢" },
      { name: "Digital Nomad", emoji: "💻" },
    ],
  },
  {
    category: "Adventure",
    tags: [
      { name: "Mountain Hiking", emoji: "🏔️" },
      { name: "Adventure Sports", emoji: "🏅" },
      { name: "Rock Climbing", emoji: "🧗" },
      { name: "River Rafting", emoji: "🛶" },
      { name: "Jungle Trekking", emoji: "🌴" },
      { name: "Bungee Jumping", emoji: "⚡" },
      { name: "Skydiving", emoji: "🪂" },
      { name: "Mountain Biking", emoji: "🚵" },
      { name: "Canyoning", emoji: "🌊" },
    ],
  },
  {
    category: "Water Activities",
    tags: [
      { name: "Beach Relaxation", emoji: "🏖️" },
      { name: "Scuba Diving", emoji: "🤿" },
      { name: "Kayaking", emoji: "🛶" },
      { name: "Surfing", emoji: "🏄" },
      { name: "Snorkeling", emoji: "🐠" },
      { name: "Deep Sea Fishing", emoji: "🎣" },
      { name: "Sailing", emoji: "⛵" },
      { name: "Jet Skiing", emoji: "🌊" },
      { name: "Windsurfing", emoji: "🏄‍♂️" },
      { name: "Paddleboarding", emoji: "🛶" },
      { name: "Whale Watching", emoji: "🐋" },
      { name: "Underwater Photography", emoji: "📷" },
    ],
  },
  {
    category: "Nature & Wildlife",
    tags: [
      { name: "Wildlife Safari", emoji: "🦁" },
      { name: "Nature Conservation", emoji: "🌱" },
      { name: "Bird Watching", emoji: "🐦" },
      { name: "Wildlife Photography", emoji: "📸" },
      { name: "Stargazing", emoji: "✨" },
      { name: "Ecotourism", emoji: "🌿" },
      { name: "Cave Exploring", emoji: "🕳️" },
      { name: "Butterfly Watching", emoji: "🦋" },
      { name: "Camping", emoji: "⛺" },
      { name: "Botanical Gardens", emoji: "🌺" },
      { name: "National Parks", emoji: "🏞️" },
      { name: "Volcano Tours", emoji: "🌋" },
    ],
  },
  {
    category: "Culture & Arts",
    tags: [
      { name: "Cultural Immersion", emoji: "🌍" },
      { name: "Historical Tours", emoji: "🏺" },
      { name: "Museum Tours", emoji: "🏛️" },
      { name: "Architecture Tours", emoji: "🏛️" },
      { name: "Local Handicrafts", emoji: "🧵" },
      { name: "Temple Visits", emoji: "⛩️" },
      { name: "Festival Hopping", emoji: "🎊" },
      { name: "Art Galleries", emoji: "🖼️" },
      { name: "Traditional Dance", emoji: "💃" },
      { name: "Local Music", emoji: "🎵" },
      { name: "Cooking Classes", emoji: "👨‍🍳" },
      { name: "Language Learning", emoji: "🗣️" },
      { name: "Religious Sites", emoji: "🙏" },
    ],
  },
  {
    category: "Food & Lifestyle",
    tags: [
      { name: "Culinary Exploration", emoji: "🍽️" },
      { name: "Street Food Tasting", emoji: "🥘" },
      { name: "Wine Tasting", emoji: "🍷" },
      { name: "Spa & Wellness", emoji: "💆" },
      { name: "Yoga Retreats", emoji: "🧘" },
      { name: "Nightlife Exploration", emoji: "🌃" },
      { name: "Food Markets", emoji: "🛒" },
      { name: "Cooking Classes", emoji: "👨‍🍳" },
      { name: "Farm Visits", emoji: "🚜" },
      { name: "Food Photography", emoji: "📸" },
      { name: "Restaurant Hopping", emoji: "🍴" },
    ],
  },
];

const PostTripModal = ({
  open,
  onClose,
  onTripCreated,
  onTripUpdated,
  tripData,
  mode = "create",
}: PostTripModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  const motivationalMessages = [
    { text: "✨ Your adventure starts here", emoji: "🚀" },
    { text: "🌍 Find your travel companions", emoji: "👥" },
    { text: "🗺️ Plan your dream journey", emoji: "💫" },
    { text: "🎒 Adventures are better together", emoji: "❤️" },
  ];

  // ✅ Rotate messages every 3 seconds
  useEffect(() => {
    if (!open) return;

    const interval = setInterval(() => {
      setCurrentMessageIndex(
        (prev) => (prev + 1) % motivationalMessages.length
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [open]);

  const getInitialFormData = () => {
    if (mode === "edit" && tripData) {
      return {
        destination: tripData.destination,
        start_city: tripData.start_city,
        start_date: tripData.start_date.split("T")[0],
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

  const handleInterestToggle = (interest: string) => {
    setFormData((prev) => {
      const currentInterests = prev.travel_style || [];

      if (currentInterests.includes(interest)) {
        return {
          ...prev,
          travel_style: currentInterests.filter((i) => i !== interest),
        };
      }

      if (currentInterests.length >= 5) {
        toast({
          title: "Maximum reached",
          description: "You can select up to 5 interests only",
          variant: "destructive",
        });
        return prev;
      }

      return {
        ...prev,
        travel_style: [...currentInterests, interest],
      };
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

      let startLat: number | null = null;
      let startLng: number | null = null;

      try {
        const coords = await getCityCoordinates(formData.start_city);
        if (coords && coords.latitude !== null && coords.longitude !== null) {
          startLat = coords.latitude;
          startLng = coords.longitude;
        }
      } catch (geocodeError) {
        console.error("Geocoding error:", geocodeError);
      }

      if (mode === "edit" && tripData) {
        const updateData: any = {
          destination: formData.destination.trim(),
          start_city: formData.start_city.trim(),
          start_date: formData.start_date,
          end_date: formData.end_date,
          max_group_size: formData.max_participants,
          updated_at: new Date().toISOString(),
        };

        if (formData.description.trim()) {
          updateData.description = formData.description.trim();
        }

        if (formData.budget_per_person > 0) {
          updateData.budget_per_person = formData.budget_per_person;
        }

        if (formData.travel_style.length > 0) {
          updateData.travel_style = formData.travel_style;
        }

        if (startLat !== null) {
          updateData.start_lat = startLat;
        }

        if (startLng !== null) {
          updateData.start_lng = startLng;
        }

        const { error } = await supabase
          .from("trips")
          .update(updateData)
          .eq("id", tripData.id);

        if (error) throw error;

        toast({
          title: "🎉 Trip Updated!",
          description: "Your trip details have been successfully updated!",
        });

        onTripUpdated?.();
      } else {
        const newTrip: any = {
          creator_id: user.id,
          destination: formData.destination.trim(),
          start_city: formData.start_city.trim(),
          start_date: formData.start_date,
          end_date: formData.end_date,
          max_participants: formData.max_participants,
          status: "active",
          current_participants: 1,
        };

        if (formData.description.trim()) {
          newTrip.description = formData.description.trim();
        }

        if (formData.budget_per_person > 0) {
          newTrip.budget_per_person = formData.budget_per_person;
        }

        if (formData.travel_style.length > 0) {
          newTrip.travel_style = formData.travel_style;
        }

        if (startLat !== null) {
          newTrip.start_lat = startLat;
        }

        if (startLng !== null) {
          newTrip.start_lng = startLng;
        }

        const { error } = await supabase
          .from("trips")
          .insert([newTrip])
          .select();

        if (error) throw error;

        toast({
          title: "🎉 Trip Created!",
          description: "Your adventure is now live and ready for companions!",
        });

        onTripCreated?.();
      }

      if (mode === "create") {
        setFormData(getInitialFormData());
      }

      onClose();
    } catch (error: any) {
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
      {/* w-[95vw] sm:max-w-lg ensures it looks good on mobile and desktop */}
      <DialogContent className="w-[95vw] sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 [&>button:last-child]:hidden">
        {/* ✅ FIXED: Sleek, non-circular Red X */}
        <button
          onClick={onClose}
          type="button"
          className="absolute right-3 top-3 sm:right-4 sm:top-4 z-50 
                   w-8 h-8 sm:w-9 sm:h-9 
                   rounded-lg
                   bg-red-500/10 hover:bg-red-500 
                   text-red-600 hover:text-white
                   border-2 border-red-500/20 hover:border-red-500
                   flex items-center justify-center 
                   transition-all duration-200 
                   hover:rotate-90 hover:scale-110
                   focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                   group"
          aria-label="Close"
        >
          <X
            className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110"
            strokeWidth={2.5}
          />
        </button>

        {/* Animated Motivational Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-accent/10 via-accent/5 to-accent/10 rounded-xl py-3 px-4 mb-4 mt-6 sm:mt-0">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl animate-bounce">
              {motivationalMessages[currentMessageIndex].emoji}
            </span>
            <p
              key={currentMessageIndex}
              className="text-xs sm:text-sm font-medium text-accent animate-fade-in"
            >
              {motivationalMessages[currentMessageIndex].text}
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 mt-2">
            {motivationalMessages.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 rounded-full transition-all duration-300 ${
                  idx === currentMessageIndex
                    ? "w-6 bg-accent"
                    : "w-1.5 bg-accent/30"
                }`}
              />
            ))}
          </div>
        </div>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                formData.budget_per_person > 0 ? formData.budget_per_person : ""
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
              Max Group Size *
            </Label>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() =>
                  handleInputChange(
                    "max_participants",
                    Math.max(2, formData.max_participants - 1)
                  )
                }
                disabled={formData.max_participants <= 2}
                className="h-11 w-11 rounded-xl border-2 hover:bg-accent/10 hover:border-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <span className="text-lg font-bold">−</span>
              </Button>

              <div className="flex-1 relative">
                <Input
                  id="max_participants"
                  type="number"
                  value={formData.max_participants || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") {
                      handleInputChange("max_participants", "");
                      return;
                    }
                    const num = parseInt(value);
                    if (!isNaN(num)) {
                      handleInputChange(
                        "max_participants",
                        Math.min(50, Math.max(2, num))
                      );
                    }
                  }}
                  onBlur={() => {
                    if (
                      !formData.max_participants ||
                      formData.max_participants < 2
                    ) {
                      handleInputChange("max_participants", 2);
                    }
                  }}
                  className="rounded-xl border-2 bg-muted/50 focus:bg-white transition-colors text-center text-lg font-semibold h-11 hide-number-arrows"
                  min="2"
                  max="50"
                  placeholder="8"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() =>
                  handleInputChange(
                    "max_participants",
                    Math.min(50, formData.max_participants + 1)
                  )
                }
                disabled={formData.max_participants >= 50}
                className="h-11 w-11 rounded-xl border-2 hover:bg-accent/10 hover:border-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <span className="text-lg font-bold">+</span>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              {formData.max_participants === 2 && "Minimum 2 people"}
              {formData.max_participants > 2 &&
                formData.max_participants < 50 &&
                `Up to ${formData.max_participants} travelers`}
              {formData.max_participants >= 50 && "Maximum 50 people"}
            </p>
          </div>

          {/* Interests */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              Select up to 5 Interests (optional)
            </Label>

            <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-accent/20 scrollbar-track-transparent">
              {availableInterests.map(({ category, tags }) => (
                <div key={category} className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 bg-background py-1">
                    {category}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag.name}
                        variant={
                          formData.travel_style?.includes(tag.name)
                            ? "default"
                            : "outline"
                        }
                        onClick={() => handleInterestToggle(tag.name)}
                        className={`cursor-pointer transition-all hover:scale-105 text-sm ${
                          formData.travel_style?.includes(tag.name)
                            ? "bg-accent hover:bg-accent/90 text-accent-foreground shadow-md"
                            : "hover:bg-accent/10 border-accent/20"
                        }`}
                      >
                        <span className="mr-1.5">{tag.emoji}</span>
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                {formData.travel_style?.length || 0}/5 interests selected
              </p>
              {formData.travel_style && formData.travel_style.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, travel_style: [] }))
                  }
                  className="h-7 text-xs"
                >
                  Clear all
                </Button>
              )}
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

            {!isFormValid && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Please fill in all required fields (*) to{" "}
                {mode === "edit" ? "update" : "create"} your trip
              </p>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PostTripModal;
