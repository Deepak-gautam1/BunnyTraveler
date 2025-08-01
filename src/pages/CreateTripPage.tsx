import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin,
  Calendar,
  Users,
  FileText,
  Loader2,
  ArrowRight,
  Plus,
} from "lucide-react";
import { Link } from "react-router-dom";

interface CreateTripPageProps {
  user: User | null;
}

const CreateTripPage = ({ user }: CreateTripPageProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    destination: "",
    startCity: "",
    startDate: "",
    endDate: "",
    maxGroupSize: "",
    description: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.destination.trim()) errors.push("Destination is required");
    if (!formData.startCity.trim()) errors.push("Starting city is required");
    if (!formData.startDate) errors.push("Start date is required");
    if (!formData.endDate) errors.push("End date is required");
    if (!formData.maxGroupSize) errors.push("Group size is required");

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const today = new Date();

    if (startDate <= today) errors.push("Start date must be in the future");
    if (endDate <= startDate) errors.push("End date must be after start date");

    const groupSize = parseInt(formData.maxGroupSize);
    if (isNaN(groupSize) || groupSize < 2 || groupSize > 20) {
      errors.push("Group size must be between 2 and 20 people");
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a trip",
        variant: "destructive",
      });
      return;
    }

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      toast({
        title: "Please fix the following errors:",
        description: validationErrors.join(", "),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("trips")
        .insert({
          creator_id: user.id,
          destination: formData.destination.trim(),
          start_city: formData.startCity.trim(),
          start_date: formData.startDate,
          end_date: formData.endDate,
          max_group_size: parseInt(formData.maxGroupSize),
          description: formData.description.trim() || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Trip created successfully! 🎉",
        description: `Your trip to ${formData.destination} has been posted`,
      });

      // Navigate to the created trip or trips page
      navigate(`/trip/${data.id}`);
    } catch (error: any) {
      console.error("Error creating trip:", error);
      toast({
        title: "Failed to create trip",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Create a Trip</h1>
          <p className="text-muted-foreground mb-6">
            Sign in to start planning your next adventure with fellow travelers
          </p>
          <Button asChild>
            <Link to="/auth">Sign In to Continue</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create a New Trip</h1>
          <p className="text-muted-foreground">
            Plan your adventure and invite fellow travelers to join you
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>Trip Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Destination */}
              <div className="space-y-2">
                <Label htmlFor="destination" className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  Destination *
                </Label>
                <Input
                  id="destination"
                  placeholder="e.g., Manali, Himachal Pradesh"
                  value={formData.destination}
                  onChange={(e) =>
                    handleInputChange("destination", e.target.value)
                  }
                  required
                />
              </div>

              {/* Starting City */}
              <div className="space-y-2">
                <Label htmlFor="startCity" className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  Starting City *
                </Label>
                <Input
                  id="startCity"
                  placeholder="e.g., Delhi, Mumbai, Bangalore"
                  value={formData.startCity}
                  onChange={(e) =>
                    handleInputChange("startCity", e.target.value)
                  }
                  required
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Start Date *
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      handleInputChange("startDate", e.target.value)
                    }
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    End Date *
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      handleInputChange("endDate", e.target.value)
                    }
                    min={
                      formData.startDate ||
                      new Date().toISOString().split("T")[0]
                    }
                    required
                  />
                </div>
              </div>

              {/* Group Size */}
              <div className="space-y-2">
                <Label htmlFor="maxGroupSize" className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Maximum Group Size *
                </Label>
                <Input
                  id="maxGroupSize"
                  type="number"
                  min="2"
                  max="20"
                  placeholder="e.g., 6"
                  value={formData.maxGroupSize}
                  onChange={(e) =>
                    handleInputChange("maxGroupSize", e.target.value)
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Including yourself (2-20 people)
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe your trip plan, activities, accommodation preferences, etc."
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.description.length}/500 characters
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Trip
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3 text-blue-900">
              💡 Tips for a Great Trip Post
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Be specific about your destination and activities</li>
              <li>• Include information about budget and accommodation</li>
              <li>
                • Mention your travel style (adventure, leisure, cultural)
              </li>
              <li>• Set clear expectations for group dynamics</li>
              <li>• Respond promptly to interested travelers</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateTripPage;
