import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plane,
  Users,
  MessageCircle,
  Heart,
  ArrowRight,
  User as UserIcon,
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
  user,
  isNewUser = false,
}: WelcomeModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // ✅ ADD: Check if modal should be shown based on localStorage
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Only show if user hasn't seen it before
    const hasSeenWelcome = localStorage.getItem("welcomeModalSeen");

    if (!hasSeenWelcome && isOpen) {
      setShouldShow(true);
    } else {
      setShouldShow(false);
    }
  }, [isOpen]);

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
        </div>
      ),
    },
    {
      title: "How SafarSquad Works",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 text-center">
              <Plane className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <h4 className="font-medium">Discover Trips</h4>
              <p className="text-xs text-muted-foreground">
                Browse amazing destinations
              </p>
            </Card>
            <Card className="p-4 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <h4 className="font-medium">Join Groups</h4>
              <p className="text-xs text-muted-foreground">
                Connect with travelers
              </p>
            </Card>
            <Card className="p-4 text-center">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <h4 className="font-medium">Chat & Plan</h4>
              <p className="text-xs text-muted-foreground">
                Coordinate your journey
              </p>
            </Card>
            <Card className="p-4 text-center">
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
      title: "Complete Your Profile",
      content: (
        <div className="text-center space-y-4">
          <UserIcon className="w-16 h-16 mx-auto text-blue-600" />
          <h3 className="text-lg font-bold">Let others know about you!</h3>
          <p className="text-muted-foreground">
            Add your bio, location, and interests to help other travelers
            connect with you.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-700">
              ✨ Complete profiles get 3x more trip invitations!
            </p>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Last step - mark as seen and open profile editor
      localStorage.setItem("welcomeModalSeen", "true"); // ✅ ADD
      setIsEditProfileOpen(true);
    }
  };

  const handleSkip = () => {
    // ✅ ADD: Mark as seen when skipped
    localStorage.setItem("welcomeModalSeen", "true");
    setShouldShow(false);
    onClose();
  };

  const handleProfileComplete = () => {
    setIsEditProfileOpen(false);
    setShouldShow(false); // ✅ ADD
    onClose();
  };

  // ✅ ADD: Custom close handler to mark as seen
  const handleClose = () => {
    localStorage.setItem("welcomeModalSeen", "true");
    setShouldShow(false);
    onClose();
  };

  return (
    <>
      {/* ✅ CHANGE: Use shouldShow instead of isOpen */}
      <Dialog open={shouldShow} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              {steps[currentStep].title}
            </DialogTitle>
          </DialogHeader>

          <div className="py-6">{steps[currentStep].content}</div>

          {/* Progress Dots */}
          <div className="flex justify-center space-x-2 mb-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep ? "bg-blue-600" : "bg-gray-300"
                }`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleSkip} className="flex-1">
              {currentStep === steps.length - 1 ? "Skip for Now" : "Skip"}
            </Button>
            <Button onClick={handleNext} className="flex-1">
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
        user={user}
        onProfileUpdated={handleProfileComplete}
      />
    </>
  );
};

export default WelcomeModal;
