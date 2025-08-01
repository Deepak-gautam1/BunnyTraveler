import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User as UserType } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import EditProfileModal from "@/components/profile/EditProfileModal";
import {
  ArrowLeft,
  MapPin,
  Tag,
  Link,
  Mail,
  Calendar,
  Edit,
  User,
  Camera,
  Globe,
  Plus,
} from "lucide-react";

interface ProfileData {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  home_city: string | null;
  tagline: string | null;
  website: string | null;
  bio: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface ProfilePageProps {
  currentUser: UserType | null;
}

const ProfilePage = ({ currentUser }: ProfilePageProps) => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tripStats, setTripStats] = useState({
    created: 0,
    joined: 0,
    total: 0,
  });

  // Check if viewing own profile
  const isOwnProfile = currentUser?.id === userId || (!userId && currentUser);
  const profileUserId = userId || currentUser?.id;

  useEffect(() => {
    if (!profileUserId) {
      navigate("/");
      return;
    }
    fetchProfile();
    fetchTripStats();
  }, [profileUserId]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profileUserId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive",
        });
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTripStats = async () => {
    try {
      const [{ count: createdCount }, { count: joinedCount }] =
        await Promise.all([
          supabase
            .from("trips")
            .select("*", { count: "exact", head: true })
            .eq("creator_id", profileUserId),
          supabase
            .from("trip_participants")
            .select("*", { count: "exact", head: true })
            .eq("user_id", profileUserId),
        ]);

      setTripStats({
        created: createdCount || 0,
        joined: joinedCount || 0,
        total: (createdCount || 0) + (joinedCount || 0),
      });
    } catch (error) {
      console.error("Error fetching trip stats:", error);
    }
  };

  const handleProfileUpdate = (updatedProfile: ProfileData) => {
    setProfile(updatedProfile);
    toast({
      title: "Profile Updated! 🎉",
      description: "Your changes have been saved successfully",
    });
  };

  const getCompletionPercentage = () => {
    if (!profile) return 0;

    const fields = [
      profile.full_name,
      profile.email,
      profile.home_city,
      profile.tagline,
      profile.avatar_url,
      profile.bio,
    ];

    const completedFields = fields.filter(
      (field) => field && field.trim()
    ).length;
    return Math.round((completedFields / fields.length) * 100);
  };

  const getMissingFields = () => {
    if (!profile) return [];

    const missing = [];
    if (!profile.full_name?.trim()) missing.push("Full Name");
    if (!profile.home_city?.trim()) missing.push("Home City");
    if (!profile.tagline?.trim()) missing.push("Tagline");
    if (!profile.bio?.trim()) missing.push("Bio");
    if (!profile.avatar_url?.trim()) missing.push("Profile Photo");
    if (!profile.website?.trim()) missing.push("Website/Social");

    return missing;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="text-center py-8">
            <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Profile Not Found</h3>
            <p className="text-muted-foreground mb-4">
              This profile doesn't exist or you don't have permission to view
              it.
            </p>
            <Button onClick={() => navigate("/")} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completionPercentage = getCompletionPercentage();
  const missingFields = getMissingFields();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-20">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Button>

            {isOwnProfile && (
              <Button
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Profile</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Profile Header Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-6">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="w-24 h-24 md:w-32 md:h-32">
                  {profile.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt="Profile" />
                  ) : (
                    <AvatarFallback className="bg-earth-sand text-earth-terracotta text-2xl">
                      {profile.full_name?.charAt(0)?.toUpperCase() ||
                        profile.email?.charAt(0)?.toUpperCase() ||
                        "U"}
                    </AvatarFallback>
                  )}
                </Avatar>
                {isOwnProfile && !profile.avatar_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditModalOpen(true)}
                    className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Basic Info */}
              <div className="flex-1 space-y-2">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    {profile.full_name || "Unnamed Traveler"}
                  </h1>
                  {profile.tagline ? (
                    <p className="text-lg text-blue-600 font-medium">
                      {profile.tagline}
                    </p>
                  ) : isOwnProfile ? (
                    <Button
                      variant="link"
                      onClick={() => setIsEditModalOpen(true)}
                      className="text-muted-foreground p-0 h-auto"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add tagline
                    </Button>
                  ) : (
                    <p className="text-muted-foreground italic">
                      No tagline added
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {profile.email && (
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      {profile.email}
                    </div>
                  )}

                  {profile.home_city ? (
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {profile.home_city}
                    </div>
                  ) : (
                    isOwnProfile && (
                      <Button
                        variant="link"
                        onClick={() => setIsEditModalOpen(true)}
                        className="text-muted-foreground p-0 h-auto text-sm"
                      >
                        <MapPin className="w-4 h-4 mr-1" />
                        Add location
                      </Button>
                    )
                  )}

                  {profile.created_at && (
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Joined {new Date(profile.created_at).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {profile.website && (
                  <div className="flex items-center">
                    <Globe className="w-4 h-4 mr-2 text-muted-foreground" />
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {profile.website}
                    </a>
                  </div>
                )}
              </div>

              {/* Trip Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {tripStats.created}
                  </div>
                  <div className="text-xs text-muted-foreground">Created</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {tripStats.joined}
                  </div>
                  <div className="text-xs text-muted-foreground">Joined</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {tripStats.total}
                  </div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Completion Card (only for own profile) */}
        {isOwnProfile && completionPercentage < 100 && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Tag className="w-5 h-5 text-orange-600" />
                <span>Complete Your Profile</span>
                <Badge variant="outline" className="ml-auto">
                  {completionPercentage}% Complete
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>

                {missingFields.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Complete your profile to attract more travel companions:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {missingFields.map((field) => (
                        <Badge
                          key={field}
                          variant="secondary"
                          className="text-xs"
                        >
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => setIsEditModalOpen(true)}
                  className="w-full md:w-auto"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Complete Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bio Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            {profile.bio ? (
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {profile.bio}
              </p>
            ) : isOwnProfile ? (
              <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
                <User className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  Tell other travelers about yourself!
                </p>
                <Button
                  onClick={() => setIsEditModalOpen(true)}
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Bio
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground italic">
                  This traveler hasn't shared their story yet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Travel Badges */}
        <Card>
          <CardHeader>
            <CardTitle>Travel Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {tripStats.created > 0 && (
                <Badge
                  variant="outline"
                  className="border-green-400 text-green-600"
                >
                  Trip Creator
                </Badge>
              )}
              {tripStats.joined > 5 && (
                <Badge
                  variant="outline"
                  className="border-blue-400 text-blue-600"
                >
                  Explorer
                </Badge>
              )}
              {tripStats.total > 10 && (
                <Badge
                  variant="outline"
                  className="border-purple-400 text-purple-600"
                >
                  Adventure Seeker
                </Badge>
              )}
              {tripStats.total === 0 && (
                <Badge
                  variant="outline"
                  className="border-orange-400 text-orange-600"
                >
                  New Traveler
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Profile Modal */}
      {isOwnProfile && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          profile={profile}
          onProfileUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
};

export default ProfilePage;
