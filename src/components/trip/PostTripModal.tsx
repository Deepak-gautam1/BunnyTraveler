import { useState } from "react";
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
import { Calendar, MapPin, MessageSquare, Users } from "lucide-react"; // Added Users icon for max group size

// --- ORIGINAL SUPABASE INTEGRATION ---
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
// --- END ORIGINAL INTEGRATION ---

interface PostTripModalProps {
  open: boolean;
  onClose: () => void;
}

const PostTripModal = ({ open, onClose }: PostTripModalProps) => {
  // --- ORIGINAL TOAST AND LOADING STATE ---
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  // --- END ORIGINAL STATE ---

  // --- UPDATED FORM DATA WITH MAX GROUP SIZE ---
  const [formData, setFormData] = useState({
    destination: "",
    startCity: "",
    startDate: "",
    endDate: "",
    description: "",
    maxGroupSize: 8, // NEW: Added max group size with default value of 8
  });
  // --- END UPDATED FORM DATA ---

  // --- UPDATED INPUT HANDLER TO SUPPORT NUMBERS ---
  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  // --- END UPDATED HANDLER ---

  // --- ORIGINAL SUBMIT FUNCTION WITH MAX GROUP SIZE ADDITION ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Get the current logged-in user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to post a trip.");
      console.log("user data:", user);

      // 2. Prepare the data for insertion (using snake_case for Supabase columns)
      const newTrip = {
        creator_id: user.id,
        destination: formData.destination,
        start_city: formData.startCity,
        start_date: formData.startDate,
        end_date: formData.endDate,
        description: formData.description,
        max_group_size: formData.maxGroupSize, // NEW: Added max group size to database insert
      };

      // 3. Insert the new trip into the 'trips' table
      const { error } = await supabase.from("trips").insert([newTrip]);

      if (error) throw error;

      // 4. Show a success message and close the modal
      toast({
        title: "Success!",
        description: "Your trip has been posted.",
      });
      onClose();
      setFormData({
        // Reset form after successful submission (including new max group size field)
        destination: "",
        startCity: "",
        startDate: "",
        endDate: "",
        description: "",
        maxGroupSize: 8, // NEW: Reset max group size to default
      });
    } catch (error: any) {
      // Show an error message if something goes wrong
      toast({
        title: "Error Posting Trip",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      // Re-enable the button
      setLoading(false);
    }
  };
  // --- END ORIGINAL SUBMIT FUNCTION ---

  // --- ORIGINAL FORM VALIDATION ---
  const isFormValid =
    formData.destination &&
    formData.startCity &&
    formData.startDate &&
    formData.endDate &&
    formData.description;
  // --- END ORIGINAL VALIDATION ---

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="mx-4 rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">
            Create Your Adventure
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* --- ORIGINAL DESTINATION FIELD --- */}
          <div className="space-y-2">
            <Label
              htmlFor="destination"
              className="text-sm font-medium flex items-center space-x-1"
            >
              <MapPin className="w-4 h-4 text-accent" />
              <span>Where are we going?</span>
            </Label>
            <Input
              id="destination"
              placeholder="e.g., Weekend Trek to Triund"
              value={formData.destination}
              onChange={(e) => handleInputChange("destination", e.target.value)}
              className="rounded-xl"
            />
          </div>
          {/* --- END ORIGINAL DESTINATION FIELD --- */}

          {/* --- ORIGINAL STARTING CITY FIELD --- */}
          <div className="space-y-2">
            <Label htmlFor="startCity" className="text-sm font-medium">
              Starting from
            </Label>
            <Input
              id="startCity"
              placeholder="e.g., Chandigarh"
              value={formData.startCity}
              onChange={(e) => handleInputChange("startCity", e.target.value)}
              className="rounded-xl"
            />
          </div>
          {/* --- END ORIGINAL STARTING CITY FIELD --- */}

          {/* --- ORIGINAL DATE RANGE FIELDS --- */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label
                htmlFor="startDate"
                className="text-sm font-medium flex items-center space-x-1"
              >
                <Calendar className="w-4 h-4 text-accent" />
                <span>Start Date</span>
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange("startDate", e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-sm font-medium">
                End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange("endDate", e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>
          {/* --- END ORIGINAL DATE RANGE FIELDS --- */}

          {/* --- NEW MAX GROUP SIZE FIELD --- */}
          <div className="space-y-2">
            <Label
              htmlFor="maxGroupSize"
              className="text-sm font-medium flex items-center space-x-1"
            >
              <Users className="w-4 h-4 text-accent" />
              <span>Max Group Size</span>
            </Label>
            <Input
              id="maxGroupSize"
              type="number"
              value={formData.maxGroupSize}
              onChange={(e) =>
                handleInputChange(
                  "maxGroupSize",
                  parseInt(e.target.value, 10) || 8
                )
              }
              className="rounded-xl"
              min="2"
              max="50"
              placeholder="Maximum number of people"
            />
          </div>
          {/* --- END NEW MAX GROUP SIZE FIELD --- */}

          {/* --- ORIGINAL DESCRIPTION FIELD --- */}
          <div className="space-y-2">
            <Label
              htmlFor="description"
              className="text-sm font-medium flex items-center space-x-1"
            >
              <MessageSquare className="w-4 h-4 text-accent" />
              <span>Describe the Plan & Vibe</span>
            </Label>
            <Textarea
              id="description"
              placeholder="What's the plan? What kind of vibe are you going for? Any specific activities or requirements?"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="rounded-xl min-h-[100px] resize-none"
              rows={4}
            />
          </div>
          {/* --- END ORIGINAL DESCRIPTION FIELD --- */}

          {/* --- ORIGINAL SUBMIT BUTTON WITH LOADING STATE --- */}
          <div className="pt-4">
            <Button
              type="submit"
              variant="cta"
              className="w-full"
              disabled={!isFormValid || loading} // Original validation and loading state
            >
              {loading ? "Posting..." : "Post Trip"}
            </Button>
          </div>
          {/* --- END ORIGINAL SUBMIT BUTTON --- */}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PostTripModal;
