// src/components/discover/MapFilters.tsx
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { MapPin, Navigation, Globe, Target } from "lucide-react";

interface MapFiltersProps {
  searchRadius: number; // ✅ Controlled from parent
  onRadiusChange: (radius: number) => void;
  onLocationFilter: (location: string) => void;
  onNearbySearch: () => void;
  currentLocation?: { lat: number; lng: number } | null;
}

const MapFilters = ({
  searchRadius, // ✅ Use this prop, don't create local state
  onRadiusChange,
  onLocationFilter,
  onNearbySearch,
  currentLocation,
}: MapFiltersProps) => {
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
            Search Radius: {searchRadius === 0 ? "All" : `${searchRadius}km`}
          </Label>

          <Slider
            value={[searchRadius]} // ✅ Use prop value
            onValueChange={(value) => {
              onRadiusChange(value[0]); // ✅ Only call parent handler
            }}
            max={500} // ✅ Changed from 200 to 500 to match your requirements
            min={0} // ✅ Changed from 10 to 0 to allow "show all"
            step={10}
            className="w-full"
          />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0km (All)</span>
            <span>500km</span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Reset to view all
              onLocationFilter("");
              onRadiusChange(0); // ✅ Reset to 0, not 50
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
