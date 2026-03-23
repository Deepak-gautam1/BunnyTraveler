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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, Users, Loader2 } from "lucide-react";

interface EditTripModalProps {
  trip: {
    id: number;
    destination: string;
    start_date: string;
    end_date: string;
    start_city: string;
    description: string | null;
    max_group_size: number;
  };
  isOpen: boolean;
  onClose: () => void;
  onTripUpdated: () => void;
}

const EditTripModal = ({
  trip,
  isOpen,
  onClose,
  onTripUpdated,
}: EditTripModalProps) => {
  const [formData, setFormData] = useState({
    destination: trip.destination,
    start_date: trip.start_date.split("T")[0], // Format for date input
    end_date: trip.end_date.split("T")[0],
    start_city: trip.start_city,
    description: trip.description || "",
    max_group_size: trip.max_group_size,
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Reset form when trip changes
  useEffect(() => {
    setFormData({
      destination: trip.destination,
      start_date: trip.start_date.split("T")[0],
      end_date: trip.end_date.split("T")[0],
      start_city: trip.start_city,
      description: trip.description || "",
      max_group_size: trip.max_group_size,
    });
  }, [trip]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    const { destination, start_date, end_date, start_city, max_group_size } =
      formData;

    if (!destination.trim()) {
      toast({
        title: "Destination required",
        description: "Please enter a destination",
        variant: "destructive",
      });
      return false;
    }

    if (!start_city.trim()) {
      toast({
        title: "Start city required",
        description: "Please enter your starting city",
        variant: "destructive",
      });
      return false;
    }

    if (!start_date || !end_date) {
      toast({
        title: "Dates required",
        description: "Please select both start and end dates",
        variant: "destructive",
      });
      return false;
    }

    if (new Date(start_date) >= new Date(end_date)) {
      toast({
        title: "Invalid dates",
        description: "End date must be after start date",
        variant: "destructive",
      });
      return false;
    }

    if (max_group_size < 2 || max_group_size > 20) {
      toast({
        title: "Invalid group size",
        description: "Group size must be between 2 and 20",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("trips")
        .update({
          destination: formData.destination.trim(),
          start_date: formData.start_date,
          end_date: formData.end_date,
          start_city: formData.start_city.trim(),
          description: formData.description.trim() || null,
          max_group_size: formData.max_group_size,
          updated_at: new Date().toISOString(),
        })
        .eq("id", trip.id);

      if (error) throw error;

      toast({
        title: "Trip updated! ✅",
        description: "Your trip details have been successfully updated.",
      });

      onTripUpdated();
      onClose();
    } catch (e: unknown) {
      toast({
        title: "Update failed",
        description: e instanceof Error ? e.message : 'An error occurred',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Edit Trip Details
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Destination */}
          <div className="space-y-2">
            <Label htmlFor="destination" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Destination *
            </Label>
            <Input
              id="destination"
              value={formData.destination}
              onChange={(e) => handleInputChange("destination", e.target.value)}
              placeholder="Where are you going?"
              disabled={loading}
            />
          </div>

          {/* Start City */}
          <div className="space-y-2">
            <Label htmlFor="start_city" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Starting City *
            </Label>
            <Input
              id="start_city"
              value={formData.start_city}
              onChange={(e) => handleInputChange("start_city", e.target.value)}
              placeholder="Where are you starting from?"
              disabled={loading}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Start Date *
              </Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) =>
                  handleInputChange("start_date", e.target.value)
                }
                min={new Date().toISOString().split("T")[0]}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                End Date *
              </Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => handleInputChange("end_date", e.target.value)}
                min={formData.start_date}
                disabled={loading}
              />
            </div>
          </div>

          {/* Group Size */}
          <div className="space-y-2">
            <Label htmlFor="max_group_size" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Maximum Group Size *
            </Label>
            <Input
              id="max_group_size"
              type="number"
              min="2"
              max="20"
              value={formData.max_group_size}
              onChange={(e) =>
                handleInputChange("max_group_size", parseInt(e.target.value))
              }
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Tell people about your trip..."
              rows={4}
              disabled={loading}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Trip"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTripModal;
