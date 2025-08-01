// src/components/discover/MapFilters.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { MapPin, Navigation, Crosshair, Globe, Target } from "lucide-react";

interface MapFiltersProps {
  onRadiusChange: (radius: number) => void;
  onLocationFilter: (location: string) => void;
  onNearbySearch: () => void;
  currentLocation?: { lat: number; lng: number } | null;
}

const MapFilters = ({
  onRadiusChange,
  onLocationFilter,
  onNearbySearch,
  currentLocation,
}: MapFiltersProps) => {
  const [searchRadius, setSearchRadius] = useState(50); // km

  const popularDestinations = [
    "Mumbai",
    "Delhi",
    "Bangalore",
    "Chennai",
    "Pune",
    "Goa",
    "Jaipur",
    "Hyderabad",
    "Kolkata",
    "Chandigarh",
  ];

  return (
    <Card className="p-4 bg-white border-0 shadow-soft">
      <div className="space-y-4">
        {/* Location-based filters */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 font-medium">
            <MapPin className="w-4 h-4 text-accent" />
            Location Filters
          </Label>

          <div className="flex flex-wrap gap-2">
            {/* Current Location Search */}
            {currentLocation && (
              <Button
                variant="outline"
                size="sm"
                onClick={onNearbySearch}
                className="h-9"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Near Me
              </Button>
            )}

            {/* Popular destinations */}
            {popularDestinations.map((city) => (
              <Badge
                key={city}
                variant="outline"
                className="cursor-pointer hover:bg-accent/10 transition-colors"
                onClick={() => onLocationFilter(city)}
              >
                {city}
              </Badge>
            ))}
          </div>
        </div>

        {/* Search radius */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 font-medium">
            <Target className="w-4 h-4 text-accent" />
            Search Radius: {searchRadius}km
          </Label>

          <Slider
            value={[searchRadius]}
            onValueChange={(value) => {
              setSearchRadius(value[0]);
              onRadiusChange(value[0]);
            }}
            max={200}
            min={10}
            step={10}
            className="w-full"
          />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>10km</span>
            <span>200km</span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Reset to India view
              onLocationFilter("");
              setSearchRadius(50);
              onRadiusChange(50);
            }}
          >
            <Globe className="w-4 h-4 mr-1" />
            View All
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default MapFilters;
