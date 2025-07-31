import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  User as UserIcon,
  MapPin,
  MessageSquare,
  Link,
  Camera,
  CheckCircle,
  X,
} from "lucide-react";
import EditProfileModal from "@/components/profile/EditProfileModal";
import { checkProfileCompletion } from "@/lib/auth-helpers";

interface ProfileCompletionFlowProps {
  user: User | null;
  profile: any;
  onProfileUpdated: () => void;
  className?: string;
}

const ProfileCompletionFlow = ({
  user,
  profile,
  onProfileUpdated,
  className,
}: ProfileCompletionFlowProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const { isComplete, completionScore } = checkProfileCompletion(profile);

  // Don't show if profile is complete or user dismissed it
  if (!user || !profile || isComplete || isDismissed) {
    return null;
  }

  const missingFields = [
    { key: "bio", label: "Bio", icon: MessageSquare, filled: !!profile.bio },
    {
      key: "home_city",
      label: "Home City",
      icon: MapPin,
      filled: !!profile.home_city,
    },
    {
      key: "tagline",
      label: "Tagline",
      icon: UserIcon,
      filled: !!profile.tagline,
    },
    {
      key: "website",
      label: "Website/Social",
      icon: Link,
      filled: !!profile.website,
    },
  ];

  const filledCount = missingFields.filter((field) => field.filled).length;
  const totalCount = missingFields.length;

  return (
    <Card
      className={`border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 ${className}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <UserIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-blue-900">
                Complete Your Travel Profile
              </CardTitle>
              <p className="text-sm text-blue-700 mt-1">
                Help other travelers connect with you!
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDismissed(true)}
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-700 font-medium">
              Profile Completion
            </span>
            <Badge
              variant="outline"
              className="bg-white border-blue-300 text-blue-700"
            >
              {completionScore}%
            </Badge>
          </div>
          <Progress value={completionScore} className="h-2 bg-blue-100" />
          <p className="text-xs text-blue-600">
            {filledCount} of {totalCount} sections completed
          </p>
        </div>

        {/* Missing Fields */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-blue-800 mb-3">
            Add these details to enhance your profile:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {missingFields.map((field) => (
              <div
                key={field.key}
                className={`flex items-center space-x-2 p-2 rounded-lg text-xs ${
                  field.filled
                    ? "bg-green-100 text-green-700"
                    : "bg-white text-blue-600 border border-blue-200"
                }`}
              >
                {field.filled ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <field.icon className="w-3 h-3" />
                )}
                <span>{field.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <Button
            onClick={() => setIsEditModalOpen(true)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            <UserIcon className="w-4 h-4 mr-2" />
            Complete Profile
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsDismissed(true)}
            size="sm"
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            Later
          </Button>
        </div>

        {/* Benefits */}
        <div className="bg-white/70 p-3 rounded-lg">
          <p className="text-xs text-blue-600 mb-2 font-medium">
            🌟 Complete profiles help you:
          </p>
          <ul className="text-xs text-blue-600 space-y-1">
            <li>• Connect with like-minded travelers</li>
            <li>• Build trust with trip organizers</li>
            <li>• Get more trip invitations</li>
          </ul>
        </div>
      </CardContent>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={user}
        onProfileUpdated={() => {
          onProfileUpdated();
          setIsDismissed(true); // Hide the banner after successful update
        }}
      />
    </Card>
  );
};

export default ProfileCompletionFlow;
