import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  User as UserIcon,
  MapPin,
  Link,
  Edit,
  Loader2,
  MessageSquare,
  Tag,
} from "lucide-react";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onProfileUpdated?: () => void;
}

const EditProfileModal = ({
  isOpen,
  onClose,
  user,
  onProfileUpdated,
}: EditProfileModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
    home_city: "",
    tagline: "",
    website: "",
    avatar_url: "",
  });

  const [characterCounts, setCharacterCounts] = useState({
    bio: 0,
    tagline: 0,
  });

  useEffect(() => {
    if (isOpen && user) {
      fetchCurrentProfile();
    }
  }, [isOpen, user]);

  useEffect(() => {
    // Update character counts when form data changes
    setCharacterCounts({
      bio: formData.bio.length,
      tagline: formData.tagline.length,
    });
  }, [formData.bio, formData.tagline]);

  const fetchCurrentProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error);
        return;
      }

      if (data) {
        setFormData({
          full_name: data.full_name || user.user_metadata?.full_name || "",
          bio: data.bio || "",
          home_city: data.home_city || "",
          tagline: data.tagline || "",
          website: data.website || "",
          avatar_url: data.avatar_url || user.user_metadata?.avatar_url || "",
        });
      } else {
        // No profile exists, use Google data as defaults
        setFormData({
          full_name: user.user_metadata?.full_name || "",
          bio: "",
          home_city: "",
          tagline: "",
          website: "",
          avatar_url: user.user_metadata?.avatar_url || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.full_name.trim()) {
      errors.push("Full name is required");
    }

    if (formData.tagline.length > 50) {
      errors.push("Tagline must be 50 characters or less");
    }

    if (formData.bio.length > 200) {
      errors.push("Bio must be 200 characters or less");
    }

    if (formData.website && !isValidUrl(formData.website)) {
      errors.push("Please enter a valid website URL");
    }

    return errors;
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: validationErrors.join(", "),
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const profileData = {
        id: user.id,
        user_id: user.id,
        email: user.email,
        ...formData,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("profiles").upsert(profileData);

      if (error) throw error;

      toast({
        title: "Profile Updated! 🎉",
        description: "Your profile has been successfully updated.",
      });

      onProfileUpdated?.();
      onClose();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  const isFormValid = formData.full_name.trim().length > 0;
  const hasChanges = Object.values(formData).some(
    (value) => value.trim().length > 0
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Edit className="w-5 h-5 mr-2" />
            Edit Profile
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            {/* Profile Picture Preview */}
            <div className="flex justify-center">
              <div className="relative">
                <Avatar className="w-20 h-20">
                  {formData.avatar_url ? (
                    <AvatarImage src={formData.avatar_url} />
                  ) : (
                    <AvatarFallback>
                      {formData.full_name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs">Google Photo</span>
                </div>
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name" className="flex items-center">
                <UserIcon className="w-4 h-4 mr-2" />
                Full Name *
              </Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleInputChange("full_name", e.target.value)}
                placeholder="Your full name"
                required
                className="transition-all focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Tagline */}
            <div className="space-y-2">
              <Label htmlFor="tagline" className="flex items-center">
                <Tag className="w-4 h-4 mr-2" />
                Tagline
              </Label>
              <Input
                id="tagline"
                value={formData.tagline}
                onChange={(e) => handleInputChange("tagline", e.target.value)}
                placeholder="Adventure seeker, Digital nomad, etc."
                maxLength={50}
                className="transition-all focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  Short phrase that describes you
                </p>
                <p
                  className={`text-xs ${
                    characterCounts.tagline > 45
                      ? "text-orange-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {characterCounts.tagline}/50
                </p>
              </div>
            </div>

            {/* Home City */}
            <div className="space-y-2">
              <Label htmlFor="home_city" className="flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                Home City
              </Label>
              <Input
                id="home_city"
                value={formData.home_city}
                onChange={(e) => handleInputChange("home_city", e.target.value)}
                placeholder="Mumbai, Delhi, Bangalore, etc."
                className="transition-all focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-muted-foreground">
                Help other travelers find you
              </p>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio" className="flex items-center">
                <MessageSquare className="w-4 h-4 mr-2" />
                Bio
              </Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                placeholder="Tell us about yourself, your travel interests, favorite destinations..."
                rows={3}
                maxLength={200}
                className="transition-all focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  Share your travel story
                </p>
                <p
                  className={`text-xs ${
                    characterCounts.bio > 180
                      ? "text-orange-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {characterCounts.bio}/200
                </p>
              </div>
            </div>

            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="website" className="flex items-center">
                <Link className="w-4 h-4 mr-2" />
                Website/Social
              </Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
                placeholder="https://instagram.com/yourhandle"
                className="transition-all focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-muted-foreground">
                Instagram, personal website, or travel blog
              </p>
            </div>

            {/* Progress Indicator */}
            {hasChanges && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-700 font-medium mb-1">
                  Profile Completion Tips:
                </p>
                <ul className="text-xs text-blue-600 space-y-1">
                  {!formData.bio && (
                    <li>• Add a bio to tell your travel story</li>
                  )}
                  {!formData.home_city && <li>• Share your home city</li>}
                  {!formData.tagline && <li>• Add a catchy tagline</li>}
                  {!formData.website && <li>• Link your social media</li>}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={!isFormValid || saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Profile"
                )}
              </Button>
            </div>

            {/* Helper text */}
            <p className="text-xs text-center text-muted-foreground pt-2">
              Your profile helps other travelers connect with you
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileModal;
