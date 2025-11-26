import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Settings,
  Bell,
  Shield,
  User as UserIcon,
  Download,
  Trash2,
  Gift,
} from "lucide-react";
import { Link } from "react-router-dom";

interface SettingsPageProps {
  user: User | null;
}

interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  trip_updates: boolean;
  new_messages: boolean;
  marketing_emails: boolean;
}

const SettingsPage = ({ user }: SettingsPageProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [notifications, setNotifications] = useState<NotificationPreferences>({
    email_notifications: true,
    push_notifications: false,
    trip_updates: true,
    new_messages: true,
    marketing_emails: false,
  });

  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    showEmail: false,
    showPhone: false,
    indexProfile: true,
  });

  // Load user preferences on mount
  useEffect(() => {
    if (user) {
      loadUserPreferences();
    }
  }, [user]);

  const loadUserPreferences = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setNotifications({
          email_notifications: data.email_notifications ?? true,
          push_notifications: data.push_notifications ?? false,
          trip_updates: data.trip_updates ?? true,
          new_messages: data.new_messages ?? true,
          marketing_emails: data.marketing_emails ?? false,
        });
      } else {
        // Create default preferences if they don't exist
        await createDefaultPreferences();
      }
    } catch (error: any) {
      console.error("Error loading preferences:", error);
      toast({
        title: "Error",
        description: "Failed to load your preferences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createDefaultPreferences = async () => {
    try {
      const { error } = await supabase.from("user_preferences").insert({
        user_id: user!.id,
        email_notifications: true,
        push_notifications: false,
        trip_updates: true,
        new_messages: true,
        marketing_emails: false,
      });

      if (error) {
        console.error("Error creating default preferences:", error);
      }
    } catch (error: any) {
      console.error("Error creating preferences:", error);
    }
  };

  const handleNotificationChange = async (
    key: keyof NotificationPreferences,
    value: boolean
  ) => {
    // Store previous state for rollback
    const previousNotifications = { ...notifications };

    // Optimistically update UI
    const updatedPreferences = { ...notifications, [key]: value };
    setNotifications(updatedPreferences);

    try {
      setSaving(true);

      // Check if preferences exist
      const { data: existing, error: fetchError } = await supabase
        .from("user_preferences")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      const prefsData = {
        email_notifications: updatedPreferences.email_notifications,
        push_notifications: updatedPreferences.push_notifications,
        trip_updates: updatedPreferences.trip_updates,
        new_messages: updatedPreferences.new_messages,
        marketing_emails: updatedPreferences.marketing_emails,
      };

      if (existing) {
        // Update existing record
        const { error: updateError } = await supabase
          .from("user_preferences")
          .update(prefsData)
          .eq("user_id", user!.id);

        if (updateError) {
          console.error("Update error:", updateError);
          throw updateError;
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from("user_preferences")
          .insert({
            user_id: user!.id,
            ...prefsData,
          });

        if (insertError) {
          console.error("Insert error:", insertError);
          throw insertError;
        }
      }

      toast({
        title: "Settings updated",
        description: "Your notification preferences have been saved",
      });
    } catch (error: any) {
      console.error("Error saving preferences:", error);

      // Rollback to previous state
      setNotifications(previousNotifications);

      toast({
        title: "Error",
        description: error.message || "Failed to save your preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePrivacyChange = (key: string, value: boolean) => {
    setPrivacy((prev) => ({ ...prev, [key]: value }));
    toast({
      title: "Privacy settings updated",
      description: "Your privacy preferences have been saved",
    });
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Settings className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-3xl font-bold mb-4">Settings</h1>
          <p className="text-muted-foreground mb-6">
            Sign in to manage your account settings
          </p>
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and privacy settings
        </p>
      </div>

      <div className="space-y-6">
        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserIcon className="w-5 h-5" />
              <span>Account Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Profile Information</h3>
                <p className="text-sm text-muted-foreground">
                  Update your personal details and travel preferences
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link to="/profile">Edit Profile</Link>
              </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Change Password</h3>
                <p className="text-sm text-muted-foreground">
                  Update your account password for security
                </p>
              </div>
              <Button variant="outline">Change Password</Button>
            </div>
          </CardContent>
        </Card>

        {/* My Rewards */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Gift className="w-5 h-5 text-accent" />
              <span>My Rewards</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">View Your Coupons</h3>
                <p className="text-sm text-muted-foreground">
                  Host trips with 3+ confirmed attendees to earn exclusive
                  discount coupons from our partners!
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link to="/rewards">View Rewards</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">
                Loading preferences...
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={notifications.email_notifications}
                    onCheckedChange={(checked) =>
                      handleNotificationChange("email_notifications", checked)
                    }
                    disabled={saving}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push-notifications">
                      Push Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified on your device
                    </p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={notifications.push_notifications}
                    onCheckedChange={(checked) =>
                      handleNotificationChange("push_notifications", checked)
                    }
                    disabled={saving}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="trip-updates">Trip Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifications about your trips and new participants
                    </p>
                  </div>
                  <Switch
                    id="trip-updates"
                    checked={notifications.trip_updates}
                    onCheckedChange={(checked) =>
                      handleNotificationChange("trip_updates", checked)
                    }
                    disabled={saving}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="new-messages">New Messages</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when you receive new messages
                    </p>
                  </div>
                  <Switch
                    id="new-messages"
                    checked={notifications.new_messages}
                    onCheckedChange={(checked) =>
                      handleNotificationChange("new_messages", checked)
                    }
                    disabled={saving}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="marketing-emails">Marketing Emails</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates about new features and travel tips
                    </p>
                  </div>
                  <Switch
                    id="marketing-emails"
                    checked={notifications.marketing_emails}
                    onCheckedChange={(checked) =>
                      handleNotificationChange("marketing_emails", checked)
                    }
                    disabled={saving}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Privacy & Security</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="profile-visible">Public Profile</Label>
                <p className="text-sm text-muted-foreground">
                  Make your profile visible to other travelers
                </p>
              </div>
              <Switch
                id="profile-visible"
                checked={privacy.profileVisible}
                onCheckedChange={(checked) =>
                  handlePrivacyChange("profileVisible", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-email">Show Email Address</Label>
                <p className="text-sm text-muted-foreground">
                  Display your email on your public profile
                </p>
              </div>
              <Switch
                id="show-email"
                checked={privacy.showEmail}
                onCheckedChange={(checked) =>
                  handlePrivacyChange("showEmail", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="index-profile">Search Engine Indexing</Label>
                <p className="text-sm text-muted-foreground">
                  Allow search engines to index your profile
                </p>
              </div>
              <Switch
                id="index-profile"
                checked={privacy.indexProfile}
                onCheckedChange={(checked) =>
                  handlePrivacyChange("indexProfile", checked)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Data & Storage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Download className="w-5 h-5" />
              <span>Data & Storage</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Download Your Data</h3>
                <p className="text-sm text-muted-foreground">
                  Get a copy of your profile, trips, and messages
                </p>
              </div>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-red-600">Delete Account</h3>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <Button
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">SafarSquad v1.0.0</p>
              <div className="flex justify-center space-x-4 text-sm">
                <Link
                  to="/terms"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Terms of Service
                </Link>
                <Link
                  to="/privacy"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Privacy Policy
                </Link>
                <Link
                  to="/support"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Support
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
