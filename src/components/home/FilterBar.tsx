// src/components/discover/FilterBar.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import {
  Search,
  Filter,
  X,
  Calendar as CalendarIcon,
  MapPin,
  Users,
  IndianRupee,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format } from "date-fns";

export interface FilterOptions {
  search: string;
  budgetRange: [number, number];
  startDate: Date | null;
  endDate: Date | null;
  groupSize: [number, number];
  travelStyles: string[];
  cities: string[];
  sortBy: "newest" | "budget" | "popularity" | "date";
}

interface FilterBarProps {
  onFiltersChange: (filters: FilterOptions) => void;
  totalResults?: number;
}

const TRAVEL_STYLES = [
  { id: "adventure", label: "Adventure", emoji: "🏔️" },
  { id: "cultural", label: "Cultural", emoji: "🏛️" },
  { id: "relaxation", label: "Relaxation", emoji: "🌴" },
  { id: "foodie", label: "Foodie", emoji: "🍜" },
  { id: "nightlife", label: "Nightlife", emoji: "🌃" },
  { id: "budget", label: "Budget", emoji: "💰" },
  { id: "luxury", label: "Luxury", emoji: "✨" },
  { id: "solo-friendly", label: "Solo Friendly", emoji: "🎒" },
  { id: "photography", label: "Photography", emoji: "📸" },
  { id: "spiritual", label: "Spiritual", emoji: "🕉️" },
  { id: "backpacking", label: "Backpacking", emoji: "🏃‍♂️" },
  { id: "wellness", label: "Wellness", emoji: "🧘‍♀️" },
];

const POPULAR_CITIES = [
  "Delhi",
  "Mumbai",
  "Bangalore",
  "Chennai",
  "Pune",
  "Hyderabad",
  "Ahmedabad",
  "Jaipur",
  "Kolkata",
  "Kochi",
  "Goa",
  "Chandigarh",
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "budget", label: "Budget (Low to High)" },
  { value: "popularity", label: "Most Popular" },
  { value: "date", label: "Trip Date" },
];

const FilterBar = ({ onFiltersChange, totalResults = 0 }: FilterBarProps) => {
  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    budgetRange: [0, 10000],
    startDate: null,
    endDate: null,
    groupSize: [1, 20],
    travelStyles: [],
    cities: [],
    sortBy: "newest",
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [showAllTravelStyles, setShowAllTravelStyles] = useState(false);
  const [showAllCities, setShowAllCities] = useState(false);

  useEffect(() => {
    onFiltersChange(filters);
    updateActiveFiltersCount();
  }, [filters]);

  const updateActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.budgetRange[0] > 0 || filters.budgetRange[1] < 10000) count++;
    if (filters.startDate || filters.endDate) count++;
    if (filters.groupSize[0] > 1 || filters.groupSize[1] < 20) count++;
    if (filters.travelStyles.length > 0) count++;
    if (filters.cities.length > 0) count++;
    setActiveFiltersCount(count);
  };

  const updateFilters = (updates: Partial<FilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const clearAllFilters = () => {
    setFilters({
      search: "",
      budgetRange: [0, 10000],
      startDate: null,
      endDate: null,
      groupSize: [1, 20],
      travelStyles: [],
      cities: [],
      sortBy: "newest",
    });
  };

  const toggleTravelStyle = (styleId: string) => {
    const newStyles = filters.travelStyles.includes(styleId)
      ? filters.travelStyles.filter((id) => id !== styleId)
      : [...filters.travelStyles, styleId];
    updateFilters({ travelStyles: newStyles });
  };

  const toggleCity = (city: string) => {
    const newCities = filters.cities.includes(city)
      ? filters.cities.filter((c) => c !== city)
      : [...filters.cities, city];
    updateFilters({ cities: newCities });
  };

  const formatBudget = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount}`;
  };

  // Mobile: Show only 3 travel styles initially
  const visibleTravelStyles = showAllTravelStyles
    ? TRAVEL_STYLES
    : TRAVEL_STYLES.slice(0, 3);

  // Mobile: Show only 4 cities initially
  const visibleCities = showAllCities
    ? POPULAR_CITIES
    : POPULAR_CITIES.slice(0, 4);

  return (
    <Card className="p-3 md:p-6 space-y-3 md:space-y-6 bg-white border-0 shadow-soft">
      {/* ✅ DESKTOP: Search and Filters in ONE ROW | MOBILE: Stacked */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 md:items-center">
        {/* Search Input - Takes full width on mobile, flex-1 on desktop */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 md:w-5 md:h-5" />
          <Input
            placeholder="Search destinations, cities, or keywords..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="pl-10 md:pl-12 h-10 md:h-12 border-0 bg-muted/50 focus:bg-white transition-all duration-200 text-sm md:text-base"
          />
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          <Button
            variant={showAdvanced ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="relative h-10 md:h-12 px-4 md:px-6 flex-1 md:flex-none"
          >
            <SlidersHorizontal className="w-4 h-4 md:w-5 md:h-5 mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge className="ml-2 bg-accent text-accent-foreground px-1.5 md:px-2 py-0.5 md:py-1 text-xs min-w-[1.25rem] md:min-w-[1.5rem] h-5 md:h-6">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>

          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-muted-foreground hover:text-foreground h-10 md:h-12 px-3 md:px-4"
            >
              <X className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          )}
        </div>
      </div>

      {/* Results Count and Sort - Hidden on mobile to save space */}
      {totalResults >= 0 && (
        <div className="hidden md:flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {totalResults.toLocaleString()}{" "}
            {totalResults === 1 ? "trip" : "trips"} found
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground shrink-0">
              Sort:
            </span>
            {SORT_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={filters.sortBy === option.value ? "default" : "ghost"}
                size="sm"
                onClick={() =>
                  updateFilters({
                    sortBy: option.value as FilterOptions["sortBy"],
                  })
                }
                className={`h-8 px-3 whitespace-nowrap ${
                  filters.sortBy === option.value
                    ? "bg-accent hover:bg-accent/90 text-accent-foreground"
                    : ""
                }`}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Sort Dropdown */}
      <div className="md:hidden">
        <Label className="text-xs text-muted-foreground mb-1 block">
          Sort:
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {SORT_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={filters.sortBy === option.value ? "default" : "outline"}
              size="sm"
              onClick={() =>
                updateFilters({
                  sortBy: option.value as FilterOptions["sortBy"],
                })
              }
              className={`h-9 text-xs ${
                filters.sortBy === option.value
                  ? "bg-accent hover:bg-accent/90 text-accent-foreground"
                  : ""
              }`}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <div className="space-y-4 md:space-y-6 pt-3 md:pt-4 border-t">
          {/* Budget and Group Size Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Budget Range */}
            <div className="space-y-3 md:space-y-4">
              <Label className="flex items-center gap-2 font-medium text-sm md:text-base">
                <IndianRupee className="w-4 h-4 md:w-5 md:h-5 text-accent" />
                Budget Range
              </Label>
              <div className="px-2 md:px-3">
                <Slider
                  value={filters.budgetRange}
                  onValueChange={(value) =>
                    updateFilters({ budgetRange: value as [number, number] })
                  }
                  max={10000}
                  min={0}
                  step={100}
                  className="w-full"
                />
                <div className="flex justify-between text-xs md:text-sm text-muted-foreground mt-2 md:mt-3">
                  <span>{formatBudget(filters.budgetRange[0])}</span>
                  <span>
                    {filters.budgetRange[1] >= 10000
                      ? "₹10K+"
                      : formatBudget(filters.budgetRange[1])}
                  </span>
                </div>
              </div>
            </div>

            {/* Group Size */}
            <div className="space-y-3 md:space-y-4">
              <Label className="flex items-center gap-2 font-medium text-sm md:text-base">
                <Users className="w-4 h-4 md:w-5 md:h-5 text-accent" />
                Group Size
              </Label>
              <div className="px-2 md:px-3">
                <Slider
                  value={filters.groupSize}
                  onValueChange={(value) =>
                    updateFilters({ groupSize: value as [number, number] })
                  }
                  max={20}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs md:text-sm text-muted-foreground mt-2 md:mt-3">
                  <span>
                    {filters.groupSize[0]}{" "}
                    {filters.groupSize[0] === 1 ? "person" : "people"}
                  </span>
                  <span>
                    {filters.groupSize[1] >= 20
                      ? "20+ people"
                      : `${filters.groupSize[1]} people`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-3 md:space-y-4">
            <Label className="flex items-center gap-2 font-medium text-sm md:text-base">
              <CalendarIcon className="w-4 h-4 md:w-5 md:h-5 text-accent" />
              Travel Dates
            </Label>
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start text-left h-10 md:h-11 text-xs md:text-sm"
                  >
                    <CalendarIcon className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                    {filters.startDate
                      ? format(filters.startDate, "MMM dd")
                      : "Start"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.startDate || undefined}
                    onSelect={(date) =>
                      updateFilters({ startDate: date || null })
                    }
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start text-left h-10 md:h-11 text-xs md:text-sm"
                  >
                    <CalendarIcon className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                    {filters.endDate
                      ? format(filters.endDate, "MMM dd")
                      : "End"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.endDate || undefined}
                    onSelect={(date) =>
                      updateFilters({ endDate: date || null })
                    }
                    disabled={(date) =>
                      date < (filters.startDate || new Date())
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Separator className="my-3 md:my-4" />

          {/* Travel Styles */}
          <div className="space-y-3 md:space-y-4">
            <Label className="flex items-center gap-2 font-medium text-sm md:text-base">
              <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-accent" />
              Travel Styles
            </Label>
            <div className="flex flex-wrap gap-1.5 md:gap-2">
              {visibleTravelStyles.map((style) => (
                <Badge
                  key={style.id}
                  variant={
                    filters.travelStyles.includes(style.id)
                      ? "default"
                      : "outline"
                  }
                  className={`cursor-pointer transition-all hover:scale-105 text-xs md:text-sm px-2 md:px-3 py-1 md:py-2 ${
                    filters.travelStyles.includes(style.id)
                      ? "bg-accent hover:bg-accent/90 text-accent-foreground"
                      : "hover:bg-accent/10 border-accent/20"
                  }`}
                  onClick={() => toggleTravelStyle(style.id)}
                >
                  <span className="mr-1 md:mr-2">{style.emoji}</span>
                  {style.label}
                </Badge>
              ))}
              {TRAVEL_STYLES.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllTravelStyles(!showAllTravelStyles)}
                  className="h-7 md:h-8 px-2 md:px-3 text-xs text-accent"
                >
                  {showAllTravelStyles ? (
                    <>
                      <ChevronUp className="w-3 h-3 mr-1" />
                      Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3 mr-1" />
                      More
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Popular Cities */}
          <div className="space-y-3 md:space-y-4">
            <Label className="flex items-center gap-2 font-medium text-sm md:text-base">
              <MapPin className="w-4 h-4 md:w-5 md:h-5 text-accent" />
              Starting Cities
            </Label>
            <div className="flex flex-wrap gap-1.5 md:gap-2">
              {visibleCities.map((city) => (
                <Badge
                  key={city}
                  variant={
                    filters.cities.includes(city) ? "default" : "outline"
                  }
                  className={`cursor-pointer transition-all hover:scale-105 text-xs md:text-sm px-2 md:px-3 py-1 md:py-2 ${
                    filters.cities.includes(city)
                      ? "bg-accent hover:bg-accent/90 text-accent-foreground"
                      : "hover:bg-accent/10 border-accent/20"
                  }`}
                  onClick={() => toggleCity(city)}
                >
                  {city}
                </Badge>
              ))}
              {POPULAR_CITIES.length > 4 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllCities(!showAllCities)}
                  className="h-7 md:h-8 px-2 md:px-3 text-xs text-accent"
                >
                  {showAllCities ? (
                    <>
                      <ChevronUp className="w-3 h-3 mr-1" />
                      Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3 mr-1" />
                      More
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-1.5 md:gap-2 pt-3 md:pt-4 border-t">
          {filters.search && (
            <Badge
              variant="secondary"
              className="gap-1 px-2 md:px-3 py-1 text-xs"
            >
              Search: {filters.search}
              <X
                className="w-3 h-3 cursor-pointer hover:text-destructive"
                onClick={() => updateFilters({ search: "" })}
              />
            </Badge>
          )}

          {filters.travelStyles.map((styleId) => {
            const style = TRAVEL_STYLES.find((s) => s.id === styleId);
            return style ? (
              <Badge
                key={styleId}
                variant="secondary"
                className="gap-1 px-2 md:px-3 py-1 text-xs"
              >
                {style.emoji} {style.label}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-destructive"
                  onClick={() => toggleTravelStyle(styleId)}
                />
              </Badge>
            ) : null;
          })}

          {filters.cities.map((city) => (
            <Badge
              key={city}
              variant="secondary"
              className="gap-1 px-2 md:px-3 py-1 text-xs"
            >
              📍 {city}
              <X
                className="w-3 h-3 cursor-pointer hover:text-destructive"
                onClick={() => toggleCity(city)}
              />
            </Badge>
          ))}

          {(filters.budgetRange[0] > 0 || filters.budgetRange[1] < 10000) && (
            <Badge
              variant="secondary"
              className="gap-1 px-2 md:px-3 py-1 text-xs"
            >
              💰 {formatBudget(filters.budgetRange[0])} -{" "}
              {filters.budgetRange[1] >= 10000
                ? "₹10K+"
                : formatBudget(filters.budgetRange[1])}
              <X
                className="w-3 h-3 cursor-pointer hover:text-destructive"
                onClick={() => updateFilters({ budgetRange: [0, 10000] })}
              />
            </Badge>
          )}

          {(filters.startDate || filters.endDate) && (
            <Badge
              variant="secondary"
              className="gap-1 px-2 md:px-3 py-1 text-xs"
            >
              📅{" "}
              {filters.startDate ? format(filters.startDate, "MMM dd") : "Any"}{" "}
              - {filters.endDate ? format(filters.endDate, "MMM dd") : "Any"}
              <X
                className="w-3 h-3 cursor-pointer hover:text-destructive"
                onClick={() =>
                  updateFilters({ startDate: null, endDate: null })
                }
              />
            </Badge>
          )}
        </div>
      )}
    </Card>
  );
};

export default FilterBar;
