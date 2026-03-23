// src/components/discover/CustomMarkerIcons.tsx
import L from "leaflet";

// Create sophisticated custom markers
export const createAdvancedTripMarker = (
  tripType: string,
  status: "available" | "filling" | "full" = "available",
  size: "small" | "medium" | "large" = "medium"
) => {
  const colors = {
    adventure: "#EF4444",
    cultural: "#8B5CF6",
    relaxation: "#10B981",
    luxury: "#F59E0B",
    foodie: "#F97316",
    spiritual: "#6366F1",
    default: "#3B82F6",
  };

  const statusColors = {
    available: colors[tripType as keyof typeof colors] || colors.default,
    filling: "#F59E0B",
    full: "#9CA3AF",
  };

  const sizes = {
    small: { width: 32, height: 40, fontSize: "14px" },
    medium: { width: 42, height: 52, fontSize: "16px" },
    large: { width: 52, height: 64, fontSize: "18px" },
  };

  const { width, height, fontSize } = sizes[size];
  const color = statusColors[status];

  // Create SVG-based marker for crisp rendering
  const svgMarker = `
    <svg width="${width}" height="${height}" viewBox="0 0 42 52" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow-${tripType}" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.3)"/>
        </filter>
        <linearGradient id="gradient-${tripType}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color};stop-opacity:0.8" />
        </linearGradient>
      </defs>
      
      <!-- Main marker shape -->
      <path d="M21 2C11.6 2 4 9.6 4 19c0 14 17 31 17 31s17-17 17-31c0-9.4-7.6-17-17-17z" 
            fill="url(#gradient-${tripType})" 
            stroke="white" 
            stroke-width="2" 
            filter="url(#shadow-${tripType})"/>
      
      <!-- Inner icon area -->
      <circle cx="21" cy="19" r="10" fill="white" opacity="0.9"/>
      
      <!-- Trip type indicator -->
      <text x="21" y="24" text-anchor="middle" 
            font-family="Arial, sans-serif" 
            font-size="${fontSize}" 
            font-weight="bold" 
            fill="${color}">
        ${getTripIconChar(tripType)}
      </text>
      
      <!-- Status indicator -->
      ${
        status !== "available"
          ? `
        <circle cx="32" cy="10" r="6" fill="${
          status === "filling" ? "#F59E0B" : "#DC2626"
        }"/>
        <text x="32" y="14" text-anchor="middle" font-size="10" fill="white" font-weight="bold">
          ${status === "filling" ? "!" : "✕"}
        </text>
      `
          : ""
      }
    </svg>
  `;

  return L.divIcon({
    html: svgMarker,
    className: "custom-trip-marker",
    iconSize: [width, height],
    iconAnchor: [width / 2, height],
    popupAnchor: [0, -height + 10],
  });
};

const getTripIconChar = (tripType: string): string => {
  const icons: Record<string, string> = {
    adventure: "⛰",
    cultural: "🏛",
    relaxation: "🌴",
    luxury: "✨",
    foodie: "🍽",
    spiritual: "🕉",
    photography: "📸",
    backpacking: "🎒",
    wellness: "🧘",
    default: "📍",
  };
  return icons[tripType] ?? icons.default;
};
