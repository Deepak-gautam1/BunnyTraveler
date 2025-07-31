import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin } from "lucide-react";

// Mock trip data with locations
const tripLocations = [
  {
    id: 1,
    destination: "Triund",
    lat: 32.2396,
    lng: 76.32,
    city: "Chandigarh",
    tripCount: 3,
  },
  {
    id: 2,
    destination: "Goa",
    lat: 15.2993,
    lng: 74.124,
    city: "Mumbai",
    tripCount: 8,
  },
  {
    id: 3,
    destination: "Rishikesh",
    lat: 30.0869,
    lng: 78.2676,
    city: "Delhi",
    tripCount: 5,
  },
  {
    id: 4,
    destination: "Manali",
    lat: 32.2432,
    lng: 77.1892,
    city: "Delhi",
    tripCount: 2,
  },
  {
    id: 5,
    destination: "Udaipur",
    lat: 24.5854,
    lng: 73.7125,
    city: "Jaipur",
    tripCount: 4,
  },
];

interface TripMapProps {
  onLocationSelect?: (location: any) => void;
}

const TripMap = ({ onLocationSelect }: TripMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState("");
  const [showTokenInput, setShowTokenInput] = useState(true);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    // Initialize map
    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [77.1025, 28.7041], // Delhi coordinates
      zoom: 5,
      pitch: 0,
    });

    // Add custom markers for each trip location
    tripLocations.forEach((location) => {
      // Create custom marker element
      const markerElement = document.createElement("div");
      markerElement.className = "custom-marker";
      markerElement.innerHTML = `
        <div class="relative">
          <div class="w-8 h-8 bg-accent rounded-full flex items-center justify-center shadow-lg animate-pulse">
            <div class="w-3 h-3 bg-white rounded-full"></div>
          </div>
          <div class="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            ${location.tripCount}
          </div>
        </div>
      `;

      // Add marker to map
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([location.lng, location.lat])
        .addTo(map.current!);

      // Add click event
      markerElement.addEventListener("click", () => {
        onLocationSelect?.(location);
      });

      // Add popup on hover
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        anchor: "bottom",
      }).setHTML(`
        <div class="text-center p-2">
          <h3 class="font-semibold text-sm">${location.destination}</h3>
          <p class="text-xs text-muted-foreground">${location.tripCount} active trips</p>
        </div>
      `);

      marker.getElement().addEventListener("mouseenter", () => {
        popup.setLngLat([location.lng, location.lat]).addTo(map.current!);
      });

      marker.getElement().addEventListener("mouseleave", () => {
        popup.remove();
      });
    });

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, onLocationSelect]);

  if (showTokenInput) {
    return (
      <div className="h-64 bg-muted rounded-2xl flex flex-col items-center justify-center p-6 space-y-4">
        <MapPin className="w-12 h-12 text-muted-foreground" />
        <div className="text-center space-y-2">
          <h3 className="font-semibold">Interactive Trip Map</h3>
          <p className="text-sm text-muted-foreground">
            Enter your Mapbox token to see active trips on the map
          </p>
        </div>
        <div className="w-full max-w-sm space-y-2">
          <input
            type="text"
            placeholder="Paste your Mapbox public token here"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm"
            onChange={(e) => setMapboxToken(e.target.value)}
          />
          <button
            onClick={() => {
              if (mapboxToken) {
                setShowTokenInput(false);
              }
            }}
            className="w-full bg-accent text-accent-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            Load Map
          </button>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Get your free token at{" "}
          <a
            href="https://mapbox.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            mapbox.com
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-64 bg-muted rounded-2xl overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-sm font-medium shadow-sm">
        🗺️ {tripLocations.reduce((sum, loc) => sum + loc.tripCount, 0)} Active
        Trips
      </div>
    </div>
  );
};

export default TripMap;
