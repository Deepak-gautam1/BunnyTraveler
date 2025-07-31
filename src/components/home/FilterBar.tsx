import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarDays, MapPin, Sparkles, Users } from "lucide-react";

const vibeFilters = [
  { id: "adventure", label: "Adventure", emoji: "🏔️" },
  { id: "chill", label: "Chill", emoji: "🏖️" },
  { id: "cultural", label: "Cultural", emoji: "🏛️" },
  { id: "spiritual", label: "Spiritual", emoji: "🕉️" },
  { id: "foodie", label: "Foodie", emoji: "🍛" },
  { id: "photography", label: "Photography", emoji: "📸" },
];

const cityFilters = [
  "Delhi",
  "Mumbai",
  "Bangalore",
  "Chennai",
  "Pune",
  "Hyderabad",
  "Ahmedabad",
  "Jaipur",
];

const groupSizeFilters = [
  { id: "solo", label: "Solo Friendly", icon: "👤" },
  { id: "small", label: "2-4 People", icon: "👥" },
  { id: "medium", label: "5-8 People", icon: "👨‍👩‍👧‍👦" },
  { id: "large", label: "9+ People", icon: "🎉" },
];

const dateFilters = [
  { id: "today", label: "Today", days: 0 },
  { id: "tomorrow", label: "Tomorrow", days: 1 },
  { id: "weekend", label: "This Weekend", days: 7 },
  { id: "next-week", label: "Next Week", days: 14 },
];

interface FilterBarProps {
  onFiltersChange?: (filters: any) => void;
}

const FilterBar = ({ onFiltersChange }: FilterBarProps) => {
  const [activeFilters, setActiveFilters] = useState({
    vibe: [] as string[],
    city: "",
    groupSize: "",
    date: "",
  });

  const toggleVibeFilter = (vibeId: string) => {
    const newVibes = activeFilters.vibe.includes(vibeId)
      ? activeFilters.vibe.filter((id) => id !== vibeId)
      : [...activeFilters.vibe, vibeId];

    const newFilters = { ...activeFilters, vibe: newVibes };
    setActiveFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const updateFilter = (type: string, value: string) => {
    const newFilters = {
      ...activeFilters,
      [type]:
        activeFilters[type as keyof typeof activeFilters] === value
          ? ""
          : value,
    };
    setActiveFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters = { vibe: [], city: "", groupSize: "", date: "" };
    setActiveFilters(clearedFilters);
    onFiltersChange?.(clearedFilters);
  };

  const hasActiveFilters =
    activeFilters.vibe.length > 0 ||
    activeFilters.city ||
    activeFilters.groupSize ||
    activeFilters.date;

  return (
    <div className="space-y-4">
      {/* Filter Categories */}
      <div className="space-y-3">
        {/* Vibe Filters */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium">Vibe</span>
          </div>
          <ScrollArea className="w-full">
            <div className="flex space-x-2 pb-2">
              {vibeFilters.map((vibe) => (
                <Badge
                  key={vibe.id}
                  variant={
                    activeFilters.vibe.includes(vibe.id) ? "default" : "outline"
                  }
                  className="cursor-pointer whitespace-nowrap hover-scale"
                  onClick={() => toggleVibeFilter(vibe.id)}
                >
                  <span className="mr-1">{vibe.emoji}</span>
                  {vibe.label}
                </Badge>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Date Filters */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <CalendarDays className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium">When</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {dateFilters.map((date) => (
              <Badge
                key={date.id}
                variant={activeFilters.date === date.id ? "default" : "outline"}
                className="cursor-pointer hover-scale"
                onClick={() => updateFilter("date", date.id)}
              >
                {date.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* City & Group Size Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* City Filter */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">From City</span>
            </div>
            <ScrollArea className="w-full">
              <div className="flex flex-col space-y-1">
                {cityFilters.slice(0, 4).map((city) => (
                  <Badge
                    key={city}
                    variant={
                      activeFilters.city === city ? "default" : "outline"
                    }
                    className="cursor-pointer justify-start text-xs hover-scale"
                    onClick={() => updateFilter("city", city)}
                  >
                    {city}
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Group Size Filter */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">Group Size</span>
            </div>
            <div className="flex flex-col space-y-1">
              {groupSizeFilters.map((size) => (
                <Badge
                  key={size.id}
                  variant={
                    activeFilters.groupSize === size.id ? "default" : "outline"
                  }
                  className="cursor-pointer justify-start text-xs hover-scale"
                  onClick={() => updateFilter("groupSize", size.id)}
                >
                  <span className="mr-1">{size.icon}</span>
                  {size.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
