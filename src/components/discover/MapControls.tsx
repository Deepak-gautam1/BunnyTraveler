// src/components/discover/MapControls.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ZoomIn,
  ZoomOut,
  Locate,
  Home,
  Layers,
  Filter,
  Search,
  RotateCcw,
  MapPin,
  Grid3X3,
} from "lucide-react";

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onCurrentLocation: () => void;
  onResetView: () => void;
  onToggleLayers: () => void;
  onToggleFilters: () => void;
  currentZoom?: number;
  isLocating?: boolean;
  filtersActive?: boolean;
}

const MapControls = ({
  onZoomIn,
  onZoomOut,
  onCurrentLocation,
  onResetView,
  onToggleLayers,
  onToggleFilters,
  currentZoom = 10,
  isLocating = false,
  filtersActive = false,
}: MapControlsProps) => {
  return (
    <TooltipProvider>
      <div className="absolute top-4 right-4 z-[1000] space-y-3">
        {/* Search Control */}
        <Card className="p-2 shadow-lg bg-white/95 backdrop-blur-sm border-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-10 h-10 p-0 hover:bg-accent/10"
              >
                <Search className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Search locations</TooltipContent>
          </Tooltip>
        </Card>

        {/* Main Controls */}
        <Card className="shadow-lg bg-white/95 backdrop-blur-sm border-0">
          <div className="flex flex-col">
            {/* Zoom Controls */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onZoomIn}
                  disabled={currentZoom >= 18}
                  className="w-12 h-10 rounded-none rounded-t-lg border-b hover:bg-accent/10"
                >
                  <ZoomIn className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Zoom in</TooltipContent>
            </Tooltip>

            <div className="px-3 py-1 text-xs text-center font-mono bg-muted/50 border-b">
              {currentZoom}x
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onZoomOut}
                  disabled={currentZoom <= 2}
                  className="w-12 h-10 rounded-none border-b hover:bg-accent/10"
                >
                  <ZoomOut className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Zoom out</TooltipContent>
            </Tooltip>

            {/* Location Control */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCurrentLocation}
                  disabled={isLocating}
                  className={`w-12 h-10 rounded-none border-b hover:bg-accent/10 ${
                    isLocating ? "animate-pulse" : ""
                  }`}
                >
                  <Locate
                    className={`w-5 h-5 ${isLocating ? "animate-spin" : ""}`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Find my location</TooltipContent>
            </Tooltip>

            {/* Reset View */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onResetView}
                  className="w-12 h-10 rounded-none border-b hover:bg-accent/10"
                >
                  <Home className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Reset to India view</TooltipContent>
            </Tooltip>

            {/* Layers Control */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleLayers}
                  className="w-12 h-10 rounded-none border-b hover:bg-accent/10"
                >
                  <Layers className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Toggle map layers</TooltipContent>
            </Tooltip>

            {/* Filters Control */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={filtersActive ? "default" : "ghost"}
                  size="sm"
                  onClick={onToggleFilters}
                  className="w-12 h-10 rounded-none rounded-b-lg hover:bg-accent/10 relative"
                >
                  <Filter className="w-5 h-5" />
                  {filtersActive && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full border-2 border-white"></div>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                {filtersActive ? "Clear filters" : "Show filters"}
              </TooltipContent>
            </Tooltip>
          </div>
        </Card>

        {/* Mini Legend */}
        <Card className="p-3 shadow-lg bg-white/95 backdrop-blur-sm border-0 max-w-[200px]">
          <div className="text-xs font-medium mb-2 text-muted-foreground">
            Trip Types
          </div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Adventure</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Relaxation</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span>Cultural</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Luxury</span>
            </div>
          </div>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default MapControls;
