import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Shield, Star } from "lucide-react";
import ProfileHoverCard from "@/components/profile/ProfileHoverCard";
import { Profile } from "@/types/trip";

interface TripCreatorCardProps {
  creatorId: string;
  profile: Profile | null;
  isCreator: boolean;
  onContactOrganizer: () => void;
}

const TripCreatorCard = ({
  creatorId,
  profile,
  isCreator,
  onContactOrganizer,
}: TripCreatorCardProps) => {

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <h3 className="font-semibold mb-3">Trip Creator</h3>
        <div className="flex items-center space-x-3">
          <ProfileHoverCard
            userId={creatorId}
            userName={profile?.full_name ?? "Anonymous"}
            userAvatar={profile?.avatar_url ?? undefined}
          >
            <Avatar className="w-12 h-12 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all">
              {profile?.avatar_url ? (
                <AvatarImage src={profile.avatar_url} />
              ) : (
                <AvatarFallback>
                  {profile?.full_name?.charAt(0).toUpperCase() ?? "U"}
                </AvatarFallback>
              )}
            </Avatar>
          </ProfileHoverCard>

          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <p className="font-medium">{profile?.full_name ?? "Anonymous"}</p>
              <Shield className="w-4 h-4 text-blue-500" />
              {isCreator && (
                <Badge variant="outline" className="text-xs">
                  You
                </Badge>
              )}
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
              <span>Trip Creator</span>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={onContactOrganizer}>
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TripCreatorCard;
