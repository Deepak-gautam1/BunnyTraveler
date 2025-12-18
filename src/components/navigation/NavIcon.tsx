import { LucideIcon } from "lucide-react";

interface NavIconProps {
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  isMainAction?: boolean;
  badge?: number; // ✅ Added this to support unread counts
}

export const NavIcon = ({
  icon: Icon,
  label,
  isActive,
  onClick,
  isMainAction,
  badge,
}: NavIconProps) => {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center w-full h-full transition-colors outline-none
        ${isMainAction ? "-mt-8" : ""} 
      `}
    >
      <div
        className={`relative flex items-center justify-center rounded-full transition-all
          ${
            isMainAction
              ? "bg-primary text-primary-foreground w-14 h-14 shadow-lg mb-1 hover:scale-105 active:scale-95"
              : "w-8 h-8"
          }
          ${
            !isMainAction && isActive
              ? "text-primary scale-110"
              : "text-muted-foreground"
          }
        `}
      >
        <Icon
          size={isMainAction ? 28 : 24}
          strokeWidth={isMainAction ? 2.5 : 2}
          className={!isMainAction && isActive ? "fill-current" : ""}
        />

        {/* ✅ Badge Logic */}
        {!isMainAction && badge && badge > 0 ? (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-0.5 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground animate-in zoom-in font-bold border border-background">
            {badge > 99 ? "99+" : badge}
          </span>
        ) : null}
      </div>

      {!isMainAction && (
        <span
          className={`text-[10px] font-medium transition-colors ${
            isActive ? "text-primary" : "text-muted-foreground"
          }`}
        >
          {label}
        </span>
      )}
    </button>
  );
};
