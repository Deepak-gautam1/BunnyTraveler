import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Loader2,
  User,
  MapPin,
  Tag,
  Link,
  FileText,
  Camera,
  Upload,
} from "lucide-react";
import type { DbProfile } from "@/types/database";

type ProfileData = DbProfile;

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: ProfileData;
  onProfileUpdate?: (updatedProfile: ProfileData) => void;
}

const EditProfileModal = ({
  isOpen,
  onClose,
  profile,
  onProfileUpdate,
}: EditProfileModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [formData, setFormData] = useState({
    full_name: profile?.full_name ?? "",
    home_city: profile?.home_city ?? "",
    tagline: profile?.tagline ?? "",
    website: profile?.website ?? "",
    bio: profile?.bio ?? "",
    avatar_url: profile?.avatar_url ?? "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setAvatarUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${profile?.id ?? "user"}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      setFormData((prev) => ({ ...prev, avatar_url: publicUrl }));

      toast({
        title: "Avatar uploaded!",
        description: "Your profile photo has been updated",
      });
    } catch (e: unknown) {
      toast({
        title: "Upload failed",
        description: e instanceof Error ? e.message : "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setAvatarUploading(false);
    }
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.full_name.trim()) {
      errors.push("Full name is required");
    }

    if (formData.tagline && formData.tagline.length > 50) {
      errors.push("Tagline must be 50 characters or less");
    }

    if (formData.bio && formData.bio.length > 500) {
      errors.push("Bio must be 500 characters or less");
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
    } catch {
      return false;
    }
  };
  const handleSave = async () => {
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
      // ✅ FIXED: Select all fields to ensure complete ProfileData object
      const { data, error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name.trim(),
          home_city: formData.home_city.trim() || null,
          tagline: formData.tagline.trim() || null,
          website: formData.website.trim() || null,
          bio: formData.bio.trim() || null,
          avatar_url: formData.avatar_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile?.id ?? "")
        .select(
          `
        id,
        full_name,
        email,
        avatar_url,
        home_city,
        tagline,
        website,
        bio,
        created_at,
        updated_at,
        user_id
      `
        ) // ✅ Explicitly select all fields
        .single();

      if (error) throw error;

      // ✅ BETTER: Merge with existing profile to ensure no data loss
      const updatedProfile = { ...profile, ...data } as ProfileData;
      onProfileUpdate?.(updatedProfile);
      onClose();
    } catch (e: unknown) {
      toast({
        title: "Update failed",
        description: e instanceof Error ? e.message : "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="w-24 h-24">
                {formData.avatar_url ? (
                  <AvatarImage src={formData.avatar_url} alt="Profile" />
                ) : (
                  <AvatarFallback className="bg-earth-sand text-earth-terracotta text-2xl">
                    {formData.full_name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                )}
              </Avatar>

              <label className="absolute -bottom-2 -right-2 cursor-pointer">
                <div className="bg-accent text-white rounded-full p-2 hover:bg-accent/90 transition-colors">
                  {avatarUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={avatarUploading}
                />
              </label>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Click the camera icon to upload a new photo
            </p>
          </div>

          {/* Form Fields */}
          <div className="grid gap-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="flex items-center">
                <User className="w-4 h-4 mr-2" />
                Full Name *
              </Label>
              <Input
                id="fullName"
                value={formData.full_name}
                onChange={(e) => handleInputChange("full_name", e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>

            {/* Home City */}
            <div className="space-y-2">
              <Label htmlFor="homeCity" className="flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                Home City
              </Label>
              <Input
                id="homeCity"
                value={formData.home_city}
                onChange={(e) => handleInputChange("home_city", e.target.value)}
                placeholder="Mumbai, Delhi, Bangalore, etc."
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
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  Short phrase that describes you
                </p>
                <p
                  className={`text-xs ${
                    formData.tagline.length > 45
                      ? "text-orange-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {formData.tagline.length}/50
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
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio" className="flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Bio
              </Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                placeholder="Tell other travelers about yourself, your interests, and travel style..."
                rows={4}
                maxLength={500}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  Share your travel story and interests
                </p>
                <p
                  className={`text-xs ${
                    formData.bio.length > 450
                      ? "text-orange-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {formData.bio.length}/500
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1"
              disabled={loading || avatarUploading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileModal;
