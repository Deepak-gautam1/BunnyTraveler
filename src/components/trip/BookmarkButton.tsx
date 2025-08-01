// src/components/trip/BookmarkButton.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Heart, BookmarkPlus, BookmarkCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookmarkButtonProps {
  tripId: number;
  isBookmarked: boolean;
  onToggle: (tripId: number) => Promise<boolean>;
  variant?: "heart" | "bookmark";
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
  disabled?: boolean;
}

const BookmarkButton = ({
  tripId,
  isBookmarked,
  onToggle,
  variant = "bookmark",
  size = "md",
  showText = false,
  className,
  disabled = false,
}: BookmarkButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent onClick events

    if (disabled || isLoading) return;

    setIsLoading(true);
    try {
      await onToggle(tripId);
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = () => {
    if (variant === "heart") {
      return (
        <Heart
          className={cn(
            "transition-all duration-200",
            size === "sm" && "w-4 h-4",
            size === "md" && "w-5 h-5",
            size === "lg" && "w-6 h-6",
            isBookmarked && "fill-red-500 text-red-500 scale-110",
            !isBookmarked && "text-muted-foreground hover:text-red-500"
          )}
        />
      );
    }

    return isBookmarked ? (
      <BookmarkCheck
        className={cn(
          "transition-all duration-200 text-accent fill-accent",
          size === "sm" && "w-4 h-4",
          size === "md" && "w-5 h-5",
          size === "lg" && "w-6 h-6"
        )}
      />
    ) : (
      <BookmarkPlus
        className={cn(
          "transition-all duration-200 text-muted-foreground",
          size === "sm" && "w-4 h-4",
          size === "md" && "w-5 h-5",
          size === "lg" && "w-6 h-6"
        )}
      />
    );
  };

  const getButtonSize = () => {
    if (size === "sm") return "sm";
    if (size === "lg") return "lg";
    return "default";
  };

  const tooltipText = isBookmarked
    ? "Remove from saved trips"
    : "Save trip for later";

  const buttonContent = (
    <Button
      variant={isBookmarked ? "default" : "ghost"}
      size={showText ? getButtonSize() : "icon"}
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={cn(
        "transition-all duration-200 hover:scale-105",
        isBookmarked &&
          variant === "bookmark" &&
          "bg-accent/10 hover:bg-accent/20 border-accent/30",
        isBookmarked &&
          variant === "heart" &&
          "bg-red-50 hover:bg-red-100 border-red-200",
        isLoading && "animate-pulse",
        className
      )}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {getIcon()}
          {showText && (
            <span className="ml-2">{isBookmarked ? "Saved" : "Save"}</span>
          )}
        </>
      )}
    </Button>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default BookmarkButton;
