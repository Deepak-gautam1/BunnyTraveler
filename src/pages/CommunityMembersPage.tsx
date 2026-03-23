import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Users,
  UserPlus,
  UserMinus,
  Loader2,
  MapPin,
  Calendar,
  Verified,
} from "lucide-react";
import { Link } from "react-router-dom";

interface Community {
  id: string;
  name: string;
  description: string | null;
  emoji: string;
  slug: string;
  created_at: string | null;
  member_count: number;
}

interface CommunityMember {
  id: string;
  joined_at: string | null;
  profiles: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    home_city: string | null;
  };
}

const CommunityMembersPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    fetchCommunityData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const fetchCommunityData = async () => {
    try {
      setLoading(true);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Fetch community details
      const { data: communityData, error: communityError } = await supabase
        .from("communities")
        .select("*")
        .eq("slug", slug!)
        .eq("is_active", true)
        .single();

      if (communityError) throw communityError;

      // Get member count
      const { count } = await supabase
        .from("community_members")
        .select("*", { count: "exact", head: true })
        .eq("community_id", communityData.id);

      setCommunity({
        ...communityData,
        created_at: communityData.created_at ?? null,
        member_count: count || 0,
      });

      // Fetch members with profiles
      const { data: membersData, error: membersError } = await supabase
        .from("community_members")
        .select(
          `
          id,
          joined_at,
          profiles!community_members_user_id_fkey (
            id,
            full_name,
            avatar_url,
            bio,
            home_city
          )
        `
        )
        .eq("community_id", communityData.id)
        .order("joined_at", { ascending: false });

      if (membersError) throw membersError;

      setMembers((membersData as CommunityMember[]) || []);

      // ✅ FIX: Check if current user is a member - with maybeSingle
      if (user) {
        const { data: membershipData, error: memberError } = await supabase
          .from("community_members")
          .select("id")
          .eq("community_id", communityData.id)
          .eq("user_id", user.id)
          .maybeSingle(); // ✅ Use maybeSingle instead of single

        // ✅ Handle error gracefully
        if (memberError && memberError.code !== "PGRST116") {
          // non-critical error, ignore
        }

        setIsJoined(!!membershipData);
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load community details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCommunity = async () => {
    if (!currentUser) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to join a community",
        variant: "destructive",
      });
      return;
    }

    if (!community) return;

    setJoinLoading(true);
    try {
      // ✅ Check if already a member first
      const { data: existingMember, error: checkError } = await supabase
        .from("community_members")
        .select("id")
        .eq("community_id", community.id)
        .eq("user_id", currentUser.id)
        .maybeSingle(); // ✅ Use maybeSingle

      if (checkError && checkError.code !== "PGRST116") {
        // non-critical error, ignore
      }

      if (existingMember) {
        toast({
          title: "Already a member",
          description: "You're already part of this community",
        });
        setJoinLoading(false);
        return;
      }

      // Insert new member
      const { error } = await supabase.from("community_members").insert({
        community_id: community.id,
        user_id: currentUser.id,
      });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already a member",
            description: "You're already part of this community",
          });
        } else {
          throw error;
        }
      } else {
        setIsJoined(true);
        toast({
          title: "Welcome! 🎉",
          description: `You've joined ${community.name}`,
        });
        fetchCommunityData(); // Refresh to show updated count
      }
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : 'An error occurred',
        variant: "destructive",
      });
    } finally {
      setJoinLoading(false);
    }
  };

  const handleLeaveCommunity = async () => {
    if (!currentUser || !community) return;

    setJoinLoading(true);
    try {
      const { error } = await supabase
        .from("community_members")
        .delete()
        .eq("community_id", community.id)
        .eq("user_id", currentUser.id);

      if (error) throw error;

      setIsJoined(false);
      toast({
        title: "Left community",
        description: `You've left ${community.name}`,
      });
      fetchCommunityData();
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : 'An error occurred',
        variant: "destructive",
      });
    } finally {
      setJoinLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-center py-20">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Loading community...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-center py-20">
            <p className="text-muted-foreground">Community not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-20">
        <div className="p-4">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto pb-20">
        {/* Community Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="text-5xl">{community.emoji}</div>
                <div>
                  <h1 className="text-2xl font-bold">{community.name}</h1>
                  {community.description && (
                    <p className="text-muted-foreground mt-1">
                      {community.description}
                    </p>
                  )}
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="outline">
                      <Users className="w-3 h-3 mr-1" />
                      {community.member_count} members
                    </Badge>
                    <Badge variant="secondary">
                      <Calendar className="w-3 h-3 mr-1" />
                      Since{" "}
                      {community.created_at ? new Date(community.created_at).toLocaleDateString() : ""}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Join/Leave Button */}
            {currentUser && (
              <div className="flex justify-end">
                {isJoined ? (
                  <Button
                    variant="outline"
                    onClick={handleLeaveCommunity}
                    disabled={joinLoading}
                  >
                    {joinLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <UserMinus className="w-4 h-4 mr-2" />
                    )}
                    Leave Community
                  </Button>
                ) : (
                  <Button
                    onClick={handleJoinCommunity}
                    disabled={joinLoading}
                    className="bg-accent hover:bg-accent/90"
                  >
                    {joinLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4 mr-2" />
                    )}
                    Join Community
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Members List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Members ({members.length})</span>
          </h2>

          {members.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No members yet. Be the first to join!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {members.map((member) => (
                <Card
                  key={member.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Avatar className="w-12 h-12">
                        {member.profiles.avatar_url ? (
                          <AvatarImage
                            src={member.profiles.avatar_url}
                            alt={member.profiles.full_name || "User"}
                          />
                        ) : (
                          <AvatarFallback className="bg-earth-sand text-earth-terracotta">
                            {member.profiles.full_name
                              ?.charAt(0)
                              .toUpperCase() || "U"}
                          </AvatarFallback>
                        )}
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1">
                          <h3 className="font-medium truncate">
                            {member.profiles.full_name || "Anonymous"}
                          </h3>
                          <Verified className="w-4 h-4 text-accent flex-shrink-0" />
                        </div>

                        {member.profiles.bio && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {member.profiles.bio}
                          </p>
                        )}

                        {member.profiles.home_city && (
                          <div className="flex items-center space-x-1 mt-2 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span>{member.profiles.home_city}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="outline" className="text-xs">
                            Joined{" "}
                            {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : ""}
                          </Badge>
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/profile/${member.profiles.id}`}>
                              View Profile
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CommunityMembersPage;
