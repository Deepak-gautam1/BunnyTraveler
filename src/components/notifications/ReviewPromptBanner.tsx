// src/components/notifications/ReviewPromptBanner.tsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReviewPromptBannerProps {
  tripTitle: string;
  onOpenReview: () => void;
  onDismiss: () => void;
}

const ReviewPromptBanner = ({
  tripTitle,
  onOpenReview,
  onDismiss,
}: ReviewPromptBannerProps) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        className="fixed top-4 left-4 right-4 z-50"
      >
        <div className="bg-gradient-to-r from-accent to-primary text-white p-4 rounded-lg shadow-lg max-w-md mx-auto">
          <div className="flex items-start gap-3">
            <Camera className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-sm">
                Share your memories from the {tripTitle} trip! 📸
              </h4>
              <p className="text-xs opacity-90 mt-1">
                How was your adventure? Upload photos and rate your experience!
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onOpenReview}
                  className="text-xs"
                >
                  Share Now
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsVisible(false);
                    onDismiss();
                  }}
                  className="text-xs text-white hover:bg-white/20"
                >
                  Later
                </Button>
              </div>
            </div>
            <button
              onClick={() => {
                setIsVisible(false);
                onDismiss();
              }}
              className="text-white/70 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReviewPromptBanner;
