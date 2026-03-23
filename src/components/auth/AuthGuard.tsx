
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Chrome, Mail, Users, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthGuardProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  actionType: "join" | "create" | "chat";
}

const AuthGuard = ({ isOpen, onClose, user, actionType }: AuthGuardProps) => {
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}`,
        },
      });

      if (error) throw error;
    } catch {
      toast({
        title: "Error",
        description: "Failed to sign in with Google",
        variant: "destructive",
      });
    }
  };

  const getActionText = () => {
    switch (actionType) {
      case "join":
        return "join trips";
      case "create":
        return "create trips";
      case "chat":
        return "chat with travelers";
      default:
        return "continue";
    }
  };

  if (user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Hey traveler! 🚀</DialogTitle>
        </DialogHeader>
        <Card className="border-0 shadow-none">
          <CardContent className="pt-0 space-y-4">
            <div className="text-center space-y-2">
              <p className="text-gray-600">
                You need an account to {getActionText()}.
              </p>
              <p className="text-sm text-gray-500">Sign in to get started!</p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleGoogleSignIn}
                className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                variant="outline"
              >
                <Chrome className="w-5 h-5 mr-3" />
                Continue with Google
              </Button>

              <Button
                onClick={() => {
                  // Navigate to email signup (you can implement this)
                  toast({
                    title: "Email Signup",
                    description: "Email signup coming soon!",
                  });
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Mail className="w-5 h-5 mr-3" />
                Sign up with Email
              </Button>
            </div>

            <div className="text-center pt-2">
              <div className="flex justify-center space-x-4 text-xs text-gray-400">
                <span className="flex items-center">
                  <Users className="w-3 h-3 mr-1" />
                  2,000+ travelers
                </span>
                <span className="flex items-center">
                  <MapPin className="w-3 h-3 mr-1" />
                  Safe & verified
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default AuthGuard;
