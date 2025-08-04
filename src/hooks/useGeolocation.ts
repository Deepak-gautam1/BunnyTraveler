// src/hooks/useGeolocation.ts
import { useState, useEffect, useRef } from "react";

interface LocationData {
  city: string | null;
  state: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface GeolocationState {
  location: LocationData;
  loading: boolean;
  error: string | null;
  hasPermission: boolean | null;
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    location: {
      city: null,
      state: null,
      country: null,
      latitude: null,
      longitude: null,
    },
    loading: false,
    error: null,
    hasPermission: null,
  });

  // ✅ Prevent multiple simultaneous requests
  const requestInProgress = useRef(false);

  // ✨ Enhanced timezone-based fallback (NO API CALLS)
  const getTimezoneBasedLocation = (): LocationData => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Comprehensive timezone mapping
      const timezoneMap: Record<string, LocationData> = {
        // India
        "Asia/Kolkata": {
          city: "Mumbai",
          state: "Maharashtra",
          country: "India",
          latitude: 19.076,
          longitude: 72.8777,
        },
        "Asia/Calcutta": {
          city: "Kolkata",
          state: "West Bengal",
          country: "India",
          latitude: 22.5726,
          longitude: 88.3639,
        },

        // USA
        "America/New_York": {
          city: "New York",
          state: "New York",
          country: "United States",
          latitude: 40.7128,
          longitude: -74.006,
        },
        "America/Los_Angeles": {
          city: "Los Angeles",
          state: "California",
          country: "United States",
          latitude: 34.0522,
          longitude: -118.2437,
        },
        "America/Chicago": {
          city: "Chicago",
          state: "Illinois",
          country: "United States",
          latitude: 41.8781,
          longitude: -87.6298,
        },

        // Europe
        "Europe/London": {
          city: "London",
          state: "England",
          country: "United Kingdom",
          latitude: 51.5074,
          longitude: -0.1278,
        },
        "Europe/Paris": {
          city: "Paris",
          state: "Île-de-France",
          country: "France",
          latitude: 48.8566,
          longitude: 2.3522,
        },
        "Europe/Berlin": {
          city: "Berlin",
          state: "Berlin",
          country: "Germany",
          latitude: 52.52,
          longitude: 13.405,
        },
        "Europe/Rome": {
          city: "Rome",
          state: "Lazio",
          country: "Italy",
          latitude: 41.9028,
          longitude: 12.4964,
        },

        // Asia Pacific
        "Asia/Tokyo": {
          city: "Tokyo",
          state: "Tokyo",
          country: "Japan",
          latitude: 35.6762,
          longitude: 139.6503,
        },
        "Asia/Shanghai": {
          city: "Shanghai",
          state: "Shanghai",
          country: "China",
          latitude: 31.2304,
          longitude: 121.4737,
        },
        "Australia/Sydney": {
          city: "Sydney",
          state: "New South Wales",
          country: "Australia",
          latitude: -33.8688,
          longitude: 151.2093,
        },

        // Default fallback
        default: {
          city: null,
          state: null,
          country: "India",
          latitude: null,
          longitude: null,
        },
      };

      return timezoneMap[timezone] || timezoneMap.default;
    } catch (error) {
      console.log("Timezone detection failed, using default");
      return {
        city: null,
        state: null,
        country: "India",
        latitude: null,
        longitude: null,
      };
    }
  };

  // ✨ CORS-free reverse geocoding (using browser's built-in timezone)
  const reverseGeocodeFromCoordinates = async (
    lat: number,
    lng: number
  ): Promise<LocationData> => {
    // Instead of API calls, use coordinate-based region detection
    const getRegionFromCoordinates = (
      latitude: number,
      longitude: number
    ): LocationData => {
      // India regions
      if (
        latitude >= 6.0 &&
        latitude <= 37.0 &&
        longitude >= 68.0 &&
        longitude <= 97.0
      ) {
        if (
          latitude >= 18.0 &&
          latitude <= 21.0 &&
          longitude >= 72.0 &&
          longitude <= 78.0
        ) {
          return {
            city: "Mumbai",
            state: "Maharashtra",
            country: "India",
            latitude,
            longitude,
          };
        } else if (
          latitude >= 28.0 &&
          latitude <= 29.0 &&
          longitude >= 76.0 &&
          longitude <= 78.0
        ) {
          return {
            city: "Delhi",
            state: "Delhi",
            country: "India",
            latitude,
            longitude,
          };
        } else if (
          latitude >= 12.0 &&
          latitude <= 13.0 &&
          longitude >= 77.0 &&
          longitude <= 78.0
        ) {
          return {
            city: "Bangalore",
            state: "Karnataka",
            country: "India",
            latitude,
            longitude,
          };
        }
        return {
          city: null,
          state: null,
          country: "India",
          latitude,
          longitude,
        };
      }

      // USA regions
      if (
        latitude >= 25.0 &&
        latitude <= 49.0 &&
        longitude >= -125.0 &&
        longitude <= -66.0
      ) {
        return {
          city: null,
          state: null,
          country: "United States",
          latitude,
          longitude,
        };
      }

      // Europe regions
      if (
        latitude >= 35.0 &&
        latitude <= 71.0 &&
        longitude >= -10.0 &&
        longitude <= 40.0
      ) {
        if (
          latitude >= 51.0 &&
          latitude <= 52.0 &&
          longitude >= -1.0 &&
          longitude <= 1.0
        ) {
          return {
            city: "London",
            state: "England",
            country: "United Kingdom",
            latitude,
            longitude,
          };
        }
        return {
          city: null,
          state: null,
          country: "Europe",
          latitude,
          longitude,
        };
      }

      // Default to timezone-based location
      const timezoneLocation = getTimezoneBasedLocation();
      return { ...timezoneLocation, latitude, longitude };
    };

    return getRegionFromCoordinates(lat, lng);
  };

  const getCurrentLocation = async () => {
    // Prevent multiple simultaneous requests
    if (requestInProgress.current) {
      console.log("Location request already in progress");
      return;
    }

    if (!navigator.geolocation) {
      const fallbackLocation = getTimezoneBasedLocation();
      setState({
        location: fallbackLocation,
        loading: false,
        error: "Geolocation is not supported by this browser.",
        hasPermission: false,
      });
      return;
    }

    requestInProgress.current = true;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // ✅ Single geolocation request with short timeout
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error("Location request timed out"));
          }, 5000); // 5 second timeout

          navigator.geolocation.getCurrentPosition(
            (pos) => {
              clearTimeout(timeoutId);
              resolve(pos);
            },
            (error) => {
              clearTimeout(timeoutId);
              reject(error);
            },
            {
              enableHighAccuracy: false, // Faster, less battery
              timeout: 5000,
              maximumAge: 600000, // 10 minutes cache
            }
          );
        }
      );

      const { latitude, longitude } = position.coords;

      // ✅ Use coordinate-based region detection (NO API CALLS)
      const locationData = await reverseGeocodeFromCoordinates(
        latitude,
        longitude
      );

      setState({
        location: locationData,
        loading: false,
        error: null,
        hasPermission: true,
      });
    } catch (error: any) {
      let errorMessage = "Unable to retrieve your location";
      let hasPermission = null;

      if (error.code) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied";
            hasPermission = false;
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location unavailable";
            hasPermission = true;
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            hasPermission = true;
            break;
        }
      }

      // ✅ Use timezone-based fallback (NO API CALLS)
      const fallbackLocation = getTimezoneBasedLocation();

      setState({
        location: fallbackLocation,
        loading: false,
        error: errorMessage,
        hasPermission,
      });
    } finally {
      requestInProgress.current = false;
    }
  };

  // ✅ Auto-load on mount (single request only)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      getCurrentLocation();
    }, 1000); // Delay initial request

    return () => {
      clearTimeout(timeoutId);
      requestInProgress.current = false;
    };
  }, []);

  const retryLocation = () => {
    if (!requestInProgress.current) {
      getCurrentLocation();
    }
  };

  return {
    ...state,
    getCurrentLocation,
    retryLocation,
    // Helper getters
    isLocationAvailable:
      !!state.location.latitude && !!state.location.longitude,
    hasCity: !!state.location.city,
    hasState: !!state.location.state,
    hasCountry: !!state.location.country,
    displayLocation: state.location.city
      ? `${state.location.city}${
          state.location.state ? `, ${state.location.state}` : ""
        }`
      : state.location.state
      ? state.location.state
      : state.location.country || "Unknown",
  };
};

export default useGeolocation;
