import { useState } from "react";
import { User } from "@supabase/supabase-js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Plane,
  Users,
  MessageCircle,
  Heart,
  ArrowRight,
  User as UserIcon,
  Gift,
  Share2,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import EditProfileModal from "@/components/profile/EditProfileModal";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  isNewUser?: boolean;
}

const WelcomeModal = ({
  isOpen,
  onClose,
}: WelcomeModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // ✅ SIMPLIFIED: Just use isOpen directly


  const steps = [
    {
      title: "Welcome to SafarSquad! 🎉",
      content: (
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">✈️</div>
          <h3 className="text-xl font-bold">Ready for your next adventure?</h3>
          <p className="text-muted-foreground">
            Connect with fellow travelers, join exciting trips, and create
            unforgettable memories together!
          </p>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-4 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
              ✨ New: Earn rewards by inviting friends!
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "How SafarSquad Works",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 text-center hover:shadow-md transition-shadow">
              <Plane className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <h4 className="font-medium">Discover Trips</h4>
              <p className="text-xs text-muted-foreground">
                Browse amazing destinations
              </p>
            </Card>
            <Card className="p-4 text-center hover:shadow-md transition-shadow">
              <Users className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <h4 className="font-medium">Join Groups</h4>
              <p className="text-xs text-muted-foreground">
                Connect with travelers
              </p>
            </Card>
            <Card className="p-4 text-center hover:shadow-md transition-shadow">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <h4 className="font-medium">Chat & Plan</h4>
              <p className="text-xs text-muted-foreground">
                Coordinate your journey
              </p>
            </Card>
            <Card className="p-4 text-center hover:shadow-md transition-shadow">
              <Heart className="w-8 h-8 mx-auto mb-2 text-red-600" />
              <h4 className="font-medium">Create Memories</h4>
              <p className="text-xs text-muted-foreground">
                Share your experiences
              </p>
            </Card>
          </div>
        </div>
      ),
    },
    {
      title: "🎁 Earn Rewards by Referring Friends!",
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 p-6 rounded-lg border-2 border-orange-200">
            <Gift className="w-12 h-12 mx-auto mb-3 text-orange-600" />
            <h3 className="text-lg font-bold text-center mb-2">
              Referral Rewards Program
            </h3>
            <p className="text-sm text-center text-muted-foreground mb-4">
              Share your trip with friends and earn exclusive rewards!
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-white dark:bg-gray-800 p-3 rounded-lg">
                <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                  <Share2 className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">1. Share Your Code</p>
                  <p className="text-xs text-muted-foreground">
                    Get a unique referral code for each trip you create
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white dark:bg-gray-800 p-3 rounded-lg">
                <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full">
                  <Users className="w-4 h-4 text-green-600 dark:text-green-300" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">2. Friends Join</p>
                  <p className="text-xs text-muted-foreground">
                    They enter your code when requesting to join
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white dark:bg-gray-800 p-3 rounded-lg">
                <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-full">
                  <Gift className="w-4 h-4 text-purple-600 dark:text-purple-300" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">3. Earn Rewards</p>
                  <p className="text-xs text-muted-foreground">
                    Get 3+ referrals to unlock exclusive coupons!
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white p-3 rounded-lg text-center">
              <Sparkles className="w-5 h-5 inline-block mr-2" />
              <span className="font-semibold">
                Rewards update in real-time!
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Complete Your Profile",
      content: (
        <div className="text-center space-y-4">
          <UserIcon className="w-16 h-16 mx-auto text-blue-600" />
          <h3 className="text-lg font-bold">Let others know about you!</h3>
          <p className="text-muted-foreground">
            Add your bio, location, and interests to help other travelers
            connect with you.
          </p>
          <div className="space-y-2">
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <CheckCircle className="w-5 h-5 inline-block mr-2 text-blue-600" />
              <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                Complete profiles get 3x more trip invitations!
              </span>
            </div>
            <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg">
              <Gift className="w-5 h-5 inline-block mr-2 text-orange-600" />
              <span className="text-sm text-orange-700 dark:text-orange-300 font-medium">
                Share trips to unlock referral rewards!
              </span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem("welcomeModalSeen", "true");
      setIsEditProfileOpen(true);
    }
  };

  const handleSkip = () => {
    localStorage.setItem("welcomeModalSeen", "true");
    setCurrentStep(0); // Reset for next time
    onClose();
  };

  const handleProfileComplete = () => {
    setIsEditProfileOpen(false);
    setCurrentStep(0);
    onClose();
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      localStorage.setItem("welcomeModalSeen", "true");
      setCurrentStep(0);
      onClose();
    }
  };

  return (
    <>
      {/* ✅ FIXED: Use isOpen directly, not shouldShow */}
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">
              {steps[currentStep].title}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">{steps[currentStep].content}</div>

          {/* Progress Dots */}
          <div className="flex justify-center space-x-2 mb-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep ? "w-8 bg-blue-600" : "w-2 bg-gray-300"
                }`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleSkip} className="flex-1">
              {currentStep === steps.length - 1 ? "Skip for Now" : "Skip"}
            </Button>
            <Button
              onClick={handleNext}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <UserIcon className="w-4 h-4 mr-2" />
                  Setup Profile
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Edit Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        onProfileUpdate={handleProfileComplete}
      />
    </>
  );
};

export default WelcomeModal;
