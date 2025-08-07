// src/components/discover/TripMap.tsx
import { useEffect, useRef, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "@changey/react-leaflet-markercluster";
import "@changey/react-leaflet-markercluster/dist/styles.min.css";
import L from "leaflet";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar,
  MapPin,
  Users,
  IndianRupee,
  Navigation,
  Bookmark,
  Sparkles,
  Eye,
  MessageSquare,
} from "lucide-react";
import { useBookmarks } from "@/hooks/useBookmarks";
import BookmarkButton from "@/components/trip/BookmarkButton";

// ✅ Leaflet CSS and icon fixes
import "leaflet/dist/leaflet.css";

// ✅ Simplified icon fix for React Leaflet 4.2.1
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";

// ✅ Configure default icons
let DefaultIcon = L.icon({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

const createAdvancedTripMarker = (
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

  // Helper function to get trip icon
  const getTripIcon = (tripType: string): string => {
    const icons = {
      adventure: "⛰️",
      cultural: "🏛️",
      relaxation: "🌴",
      luxury: "✨",
      foodie: "🍽️",
      spiritual: "🕉️",
      photography: "📸",
      backpacking: "🎒",
      wellness: "🧘",
      default: "📍",
    };
    return icons[tripType as keyof typeof icons] || icons.default;
  };

  // Create SVG-based marker for crisp rendering
  const svgMarker = `
    <svg width="${width}" height="${height}" viewBox="0 0 42 52" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow-${tripType}-${Date.now()}" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.3)"/>
        </filter>
        <linearGradient id="gradient-${tripType}-${Date.now()}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color};stop-opacity:0.8" />
        </linearGradient>
      </defs>
      
      <!-- Main marker shape -->
      <path d="M21 2C11.6 2 4 9.6 4 19c0 14 17 31 17 31s17-17 17-31c0-9.4-7.6-17-17-17z" 
            fill="url(#gradient-${tripType}-${Date.now()})" 
            stroke="white" 
            stroke-width="2" 
            filter="url(#shadow-${tripType}-${Date.now()})"/>
      
      <!-- Inner icon area -->
      <circle cx="21" cy="19" r="10" fill="white" opacity="0.9"/>
      
      <!-- Trip type indicator -->
      <text x="21" y="24" text-anchor="middle" 
            font-family="Arial, sans-serif" 
            font-size="${fontSize}" 
            font-weight="bold" 
            fill="${color}">
        ${getTripIcon(tripType)}
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

// Trip interface matching your database
interface Trip {
  id: number;
  destination: string;
  start_city: string;
  start_date: string;
  end_date: string;
  description: string | null;
  budget_per_person: number | null;
  travel_style: string[] | null;
  max_participants: number;
  current_participants: number;
  profiles: {
    full_name: string;
    avatar_url: string;
  } | null;
}

interface TripMapProps {
  trips: Trip[];
  onTripSelect?: (trip: Trip) => void;
  onLocationSelect?: (location: {
    lat: number;
    lng: number;
    address: string;
  }) => void;
  selectedTrip?: Trip | null;
  user?: any;
  className?: string;
  height?: string;
}

// Custom map icons for different trip types
const createCustomIcon = (
  color: string,
  size: "small" | "medium" | "large" = "medium"
) => {
  const sizes = {
    small: [20, 20],
    medium: [30, 30],
    large: [40, 40],
  };

  const [width, height] = sizes[size];

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: ${color};
        width: ${width}px;
        height: ${height}px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${
          size === "large" ? "16px" : size === "medium" ? "14px" : "12px"
        };
        color: white;
        font-weight: bold;
      ">
        🗺️
      </div>
    `,
    iconSize: [width, height],
    iconAnchor: [width / 2, height / 2],
  });
};

// Map bounds adjuster component
const MapBoundsAdjuster = ({ trips }: { trips: Trip[] }) => {
  const map = useMap();

  useEffect(() => {
    if (trips.length === 0) return;

    // Create bounds from trip locations (using start cities for now)
    const bounds = L.latLngBounds([]);

    // Sample coordinates for major Indian cities (you'd get these from geocoding)
    const cityCoordinates: { [key: string]: [number, number] } = {
      Mumbai: [19.076, 72.8777],
      Delhi: [28.6139, 77.209],
      Bangalore: [12.9716, 77.5946],
      Chennai: [13.0827, 80.2707],
      Pune: [18.5204, 73.8567],
      Hyderabad: [17.385, 78.4867],
      Ahmedabad: [23.0225, 72.5714],
      Jaipur: [26.9124, 75.7873],
      Kolkata: [22.5726, 88.3639],
      Goa: [15.2993, 74.124],
      Chandigarh: [30.7333, 76.7794],
      Kochi: [9.9312, 76.2673],
    };

    trips.forEach((trip) => {
      // Try to find coordinates for the start city
      const cityName = trip.start_city.toLowerCase();
      const coords = Object.entries(cityCoordinates).find(([key]) =>
        cityName.includes(key.toLowerCase())
      );

      if (coords) {
        bounds.extend(coords[1]);
      }
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] });
    } else {
      // Default to India view
      map.setView([20.5937, 78.9629], 5);
    }
  }, [trips, map]);

  return null;
};

// Main TripMap component
const TripMap = ({
  trips,
  onTripSelect,
  onLocationSelect,
  selectedTrip,
  user,
  className = "",
  height = "500px",
}: TripMapProps) => {
  const { toggleBookmark, isBookmarked } = useBookmarks(user);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    20.5937, 78.9629,
  ]); // Center of India
  const [mapZoom, setMapZoom] = useState(5);
  const [hoveredTrip, setHoveredTrip] = useState<Trip | null>(null);

  // Sample coordinates for cities - in production, you'd use a geocoding service
  const getCityCoordinates = (cityName: string): [number, number] => {
    const cityCoordinates: { [key: string]: [number, number] } = {
      mumbai: [19.076, 72.8777],
      delhi: [28.6139, 77.209],
      bangalore: [12.9716, 77.5946],
      chennai: [13.0827, 80.2707],
      pune: [18.5204, 73.8567],
      hyderabad: [17.385, 78.4867],
      ahmedabad: [23.0225, 72.5714],
      jaipur: [26.9124, 75.7873],
      kolkata: [22.5726, 88.3639],
      goa: [15.2993, 74.124],
      chandigarh: [30.7333, 76.7794],
      kochi: [9.9312, 76.2673],
    };

    const cityKey = cityName.toLowerCase();
    const foundCity = Object.entries(cityCoordinates).find(
      ([key]) => cityKey.includes(key) || key.includes(cityKey)
    );

    return foundCity ? foundCity[1] : [20.5937, 78.9629]; // Default to center of India
  };

  // Create markers for trips
  const tripMarkers = useMemo(() => {
    return trips.map((trip) => {
      const coordinates = getCityCoordinates(trip.start_city);
      const isSelected = selectedTrip?.id === trip.id;
      const spotsLeft = trip.max_participants - trip.current_participants;

      let status: "available" | "filling" | "full" = "available";
      if (spotsLeft === 0) status = "full";
      else if (spotsLeft <= 2) status = "filling";

      const primaryStyle = trip.travel_style?.[0] || "default";
      const size = isSelected
        ? "large"
        : hoveredTrip?.id === trip.id
        ? "medium"
        : "small";

      return {
        trip,
        coordinates,
        icon: createAdvancedTripMarker(primaryStyle, status, size),
      };
    });
  }, [trips, selectedTrip, hoveredTrip]);

  // Format date range
  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startMonth = start.toLocaleDateString("en", { month: "short" });
    const endMonth = end.toLocaleDateString("en", { month: "short" });
    const startDay = start.getDate();
    const endDay = end.getDate();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} - ${endDay}`;
    }
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  };

  // Format budget
  const formatBudget = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount}`;
  };

  return (
    <div className={`trip-map-container ${className}`} style={{ height }}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: "100%", width: "100%" }}
        className="trip-map"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Auto-adjust map bounds */}
        <MapBoundsAdjuster trips={trips} />

        {/* Cluster markers for better UX when many trips */}
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={50}
          showCoverageOnHover={false}
          spiderfyOnMaxZoom={true}
          iconCreateFunction={(cluster) => {
            const count = cluster.getChildCount();
            let size = "cluster-small";
            if (count >= 10) size = "cluster-large";
            else if (count >= 5) size = "cluster-medium";

            return L.divIcon({
              html: `<div class="cluster-marker ${size}">${count}</div>`,
              className: "custom-cluster-icon",
              iconSize: L.point(40, 40),
            });
          }}
        >
          {tripMarkers.map(({ trip, coordinates, icon }) => (
            <Marker
              key={trip.id}
              position={coordinates}
              icon={icon}
              eventHandlers={{
                mouseover: () => setHoveredTrip(trip),
                mouseout: () => setHoveredTrip(null),
                click: () => {
                  onTripSelect?.(trip);
                  onLocationSelect?.({
                    lat: coordinates[0],
                    lng: coordinates[1],
                    address: trip.start_city,
                  });
                },
              }}
            >
              <Popup className="trip-popup" closeButton={false}>
                <Card className="w-80 border-0 shadow-none">
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-foreground line-clamp-2">
                          {trip.destination}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          From {trip.start_city}
                        </p>
                      </div>

                      {user && (
                        <BookmarkButton
                          tripId={trip.id}
                          isBookmarked={isBookmarked(trip.id)}
                          onToggle={toggleBookmark}
                          variant="bookmark"
                          size="sm"
                          className="ml-2"
                        />
                      )}
                    </div>

                    {/* Trip Details */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-accent" />
                          <span>
                            {formatDateRange(trip.start_date, trip.end_date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-accent" />
                          <span>
                            {trip.current_participants}/{trip.max_participants}
                          </span>
                        </div>
                      </div>

                      {trip.budget_per_person && (
                        <div className="flex items-center gap-1 text-sm">
                          <IndianRupee className="w-4 h-4 text-accent" />
                          <span className="font-medium text-accent">
                            {formatBudget(trip.budget_per_person)} per person
                          </span>
                        </div>
                      )}

                      {trip.travel_style && trip.travel_style.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {trip.travel_style.slice(0, 3).map((style, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs"
                            >
                              {style}
                            </Badge>
                          ))}
                          {trip.travel_style.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{trip.travel_style.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {trip.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {trip.description}
                      </p>
                    )}

                    {/* Creator */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={trip.profiles?.avatar_url} />
                          <AvatarFallback className="bg-accent/10 text-accent text-xs">
                            {trip.profiles?.full_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {trip.profiles?.full_name || "Anonymous"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Trip Creator
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          onClick={() => onTripSelect?.(trip)}
                          className="h-8 px-3"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Custom CSS for clusters */}
      <style jsx global>{`
        .custom-cluster-icon {
          background: transparent !important;
          border: none !important;
        }

        .cluster-marker {
          background-color: #3b82f6;
          color: white;
          border-radius: 50%;
          text-align: center;
          font-weight: bold;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cluster-small {
          width: 30px;
          height: 30px;
          font-size: 12px;
        }
        .cluster-medium {
          width: 40px;
          height: 40px;
          font-size: 14px;
        }
        .cluster-large {
          width: 50px;
          height: 50px;
          font-size: 16px;
        }

        .trip-popup .leaflet-popup-content-wrapper {
          padding: 0;
          border-radius: 12px;
        }

        .trip-popup .leaflet-popup-content {
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default TripMap;
