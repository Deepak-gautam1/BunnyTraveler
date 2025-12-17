// src/components/discover/PopularDestinations.tsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, TrendingUp, ChevronRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getDestinationImage, generateFallbackImage } from "@/lib/images"; // ✅ Import
import { imageCacheManager } from "@/lib/imageCache";
interface Destination {
  name: string;
  image: string;
  state: string;
  emoji: string;
  keywords: string[];
}

interface DestinationWithCount extends Destination {
  activePlans: number;
}

interface PopularDestinationsProps {
  onDestinationClick: (destination: string) => void;
}

// ✅ Updated to use Supabase Storage
const POPULAR_DESTINATIONS: Destination[] = [
  {
    name: "Manali",
    image: getDestinationImage("manali"),
    state: "Himachal Pradesh",
    emoji: "🏔️",
    keywords: ["manali", "solang", "rohtang"],
  },
  {
    name: "Goa",
    image: getDestinationImage("goa"),
    state: "Goa",
    emoji: "🏖️",
    keywords: ["goa", "baga", "anjuna", "calangute", "panjim"],
  },
  {
    name: "Rishikesh",
    image: getDestinationImage("rishikesh"),
    state: "Uttarakhand",
    emoji: "🧘",
    keywords: ["rishikesh", "haridwar"],
  },
  {
    name: "Jaipur",
    image: getDestinationImage("jaipur"),
    state: "Rajasthan",
    emoji: "🏛️",
    keywords: ["jaipur", "amer", "hawa mahal"],
  },
  {
    name: "Shimla",
    image: getDestinationImage("shimla"),
    state: "Himachal Pradesh",
    emoji: "⛰️",
    keywords: ["shimla", "kufri"],
  },
  {
    name: "Udaipur",
    image: getDestinationImage("udaipur"),
    state: "Rajasthan",
    emoji: "🏰",
    keywords: ["udaipur", "lake pichola"],
  },
  {
    name: "Kerala",
    image: getDestinationImage("kerala"),
    state: "Kerala",
    emoji: "🌴",
    keywords: ["kerala", "munnar", "alleppey", "kochi", "wayanad"],
  },
  {
    name: "Leh-Ladakh",
    image: getDestinationImage("leh-ladakh"),
    state: "Ladakh",
    emoji: "🏔️",
    keywords: ["leh", "ladakh", "nubra", "pangong"],
  },
  {
    name: "Varanasi",
    image: getDestinationImage("varanasi"),
    state: "Uttar Pradesh",
    emoji: "🕉️",
    keywords: ["varanasi", "banaras", "kashi"],
  },
  {
    name: "Darjeeling",
    image: getDestinationImage("darjeeling"),
    state: "West Bengal",
    emoji: "☕",
    keywords: ["darjeeling", "sikkim"],
  },
  {
    name: "Ooty",
    image: getDestinationImage("ooty"),
    state: "Tamil Nadu",
    emoji: "🌺",
    keywords: ["ooty", "nilgiris"],
  },
  {
    name: "Andaman",
    image: getDestinationImage("andaman"),
    state: "Andaman & Nicobar",
    emoji: "🏝️",
    keywords: ["andaman", "havelock", "neil island", "port blair"],
  },
  {
    name: "Agra",
    image: getDestinationImage("agra"),
    state: "Uttar Pradesh",
    emoji: "🕌",
    keywords: ["agra", "taj mahal"],
  },
  {
    name: "Amritsar",
    image: getDestinationImage("amristar"), // ✅ Matches your filename
    state: "Punjab",
    emoji: "🙏",
    keywords: ["amritsar", "golden temple"],
  },
  {
    name: "Mysore",
    image: getDestinationImage("mysore"),
    state: "Karnataka",
    emoji: "🏰",
    keywords: ["mysore", "mysuru"],
  },
  {
    name: "Pondicherry",
    image: getDestinationImage("pondicherry"),
    state: "Puducherry",
    emoji: "🏖️",
    keywords: ["pondicherry", "puducherry"],
  },
  {
    name: "Coorg",
    image: getDestinationImage("coorg"),
    state: "Karnataka",
    emoji: "☕",
    keywords: ["coorg", "kodagu"],
  },
  {
    name: "Nainital",
    image: getDestinationImage("nainital"),
    state: "Uttarakhand",
    emoji: "🏞️",
    keywords: ["nainital", "bhimtal"],
  },
  {
    name: "Ranthambore",
    image: getDestinationImage("ranthambore"),
    state: "Rajasthan",
    emoji: "🐅",
    keywords: ["ranthambore", "sawai madhopur"],
  },
  {
    name: "Kasol",
    image: getDestinationImage("kasol"),
    state: "Himachal Pradesh",
    emoji: "🏕️",
    keywords: ["kasol", "parvati valley", "tosh"],
  },
];

const PopularDestinations = ({
  onDestinationClick,
}: PopularDestinationsProps) => {
  const [destinations, setDestinations] = useState<DestinationWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<string | null>(
    null
  );
  const [imagesLoading, setImagesLoading] = useState(true);

  // ✅ Preload and cache images on component mount

  // In PopularDestinations.tsx

  useEffect(() => {
    const cacheImages = async () => {
      // ✅ Check if images were cached recently (within last 5 minutes)
      const stats = imageCacheManager.getCacheStats();
      const cacheAge = Date.now() - (stats.lastCheck || 0);
      const fiveMinutes = 5 * 60 * 1000;

      if (stats.count === 20 && cacheAge < fiveMinutes) {
        console.log(
          "✅ Images recently cached, skipping PopularDestinations preload"
        );
        setImagesLoading(false);
        return;
      }

      const imageData = POPULAR_DESTINATIONS.map((dest) => ({
        name: dest.name,
        url: dest.image,
      }));

      try {
        await imageCacheManager.preloadImages(imageData);
        console.log("📊 Cache stats:", imageCacheManager.getCacheStats());
      } catch (error) {
        console.error("Failed to cache images:", error);
      } finally {
        setImagesLoading(false);
      }
    };

    cacheImages();
  }, []);

  useEffect(() => {
    const fetchDestinationCounts = async () => {
      setLoading(true);
      try {
        const { data: trips, error } = await supabase
          .from("trips")
          .select("destination, start_city")
          .eq("status", "active");

        if (error) throw error;

        const destinationsWithCounts = POPULAR_DESTINATIONS.map((dest) => {
          const count =
            trips?.filter((trip) => {
              const tripDest = trip.destination.toLowerCase();
              const tripCity = trip.start_city.toLowerCase();

              return dest.keywords.some(
                (keyword) =>
                  tripDest.includes(keyword) || tripCity.includes(keyword)
              );
            }).length || 0;

          return { ...dest, activePlans: count };
        });

        destinationsWithCounts.sort((a, b) => b.activePlans - a.activePlans);
        setDestinations(destinationsWithCounts);
      } catch (error) {
        console.error("Error fetching destination counts:", error);
        setDestinations(
          POPULAR_DESTINATIONS.map((dest) => ({ ...dest, activePlans: 0 }))
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDestinationCounts();
  }, []);

  const visibleDestinations = showAll ? destinations : destinations.slice(0, 8);

  const handleClick = (destination: DestinationWithCount) => {
    setSelectedDestination(destination.name);
    onDestinationClick(destination.name);
    setTimeout(() => setSelectedDestination(null), 2000);
  };

  if (loading) {
    return (
      <Card className="p-6 bg-white border border-gray-200 shadow-lg rounded-2xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <span className="ml-3 text-gray-600">Loading destinations...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 md:p-6 bg-white border border-gray-200 shadow-lg rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2 text-gray-900">
            <TrendingUp className="w-6 h-6 text-orange-500" />
            Popular Destinations
            {/* ✅ Show caching indicator */}
            {imagesLoading && (
              <span className="text-xs text-gray-400 font-normal ml-2">
                (Caching images...)
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Discover trending travel spots with active trip plans
          </p>
        </div>
      </div>

      {/* Destinations Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {visibleDestinations.map((destination) => (
          <motion.div
            key={destination.name}
            onClick={() => handleClick(destination)}
            className="group cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Card
              className={`overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 bg-white ${
                selectedDestination === destination.name
                  ? "ring-4 ring-orange-500 border-orange-500"
                  : "border-gray-200 border"
              }`}
            >
              {/* Image */}
              <div className="relative h-32 md:h-40 overflow-hidden">
                <img
                  src={destination.image}
                  alt={destination.name}
                  loading="lazy"
                  srcSet={`
    ${destination.image}?width=400 400w,
    ${destination.image}?width=800 800w,
    ${destination.image}?width=1200 1200w
  `}
                  sizes="(max-width: 768px) 400px, (max-width: 1024px) 800px, 1200px"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.src = generateFallbackImage(
                      destination.name,
                      destination.emoji
                    );
                  }}
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

                {/* Emoji Badge */}
                <div className="absolute top-2 right-2 bg-white rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-lg md:text-xl shadow-lg border-2 border-white">
                  {destination.emoji}
                </div>

                {/* Destination Name */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="text-white font-bold text-sm md:text-base drop-shadow-lg">
                    {destination.name}
                  </h3>
                  <p className="text-white/90 text-xs drop-shadow-md">
                    {destination.state}
                  </p>
                </div>
              </div>

              {/* Active Plans Count */}
              <div className="p-2 md:p-3 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <MapPin
                      className={`w-3 h-3 md:w-4 md:h-4 transition-colors ${
                        selectedDestination === destination.name
                          ? "text-orange-600"
                          : "text-orange-500"
                      }`}
                    />
                    <span className="text-xs md:text-sm font-medium text-gray-700">
                      {destination.activePlans}{" "}
                      {destination.activePlans === 1 ? "plan" : "plans"}
                    </span>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 transition-all ${
                      selectedDestination === destination.name
                        ? "text-orange-600 translate-x-2"
                        : "text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1"
                    }`}
                  />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Load More Button */}
      {destinations.length > 8 && (
        <div className="mt-6 text-center">
          <Button
            variant="outline"
            onClick={() => setShowAll(!showAll)}
            className="px-6 border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300 transition-all"
          >
            {showAll ? (
              <>
                Show Less
                <ChevronRight className="w-4 h-4 ml-2 rotate-90" />
              </>
            ) : (
              <>
                Load More Destinations ({destinations.length - 8} more)
                <ChevronRight className="w-4 h-4 ml-2 -rotate-90" />
              </>
            )}
          </Button>
        </div>
      )}

      {/* Empty State */}
      {destinations.every((d) => d.activePlans === 0) && (
        <div className="text-center py-12 bg-gradient-to-br from-orange-50 to-pink-50 rounded-2xl border-2 border-dashed border-orange-200">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
            <MapPin className="w-8 h-8 text-orange-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No active trip plans yet
          </h3>
          <p className="text-sm text-gray-600">
            Be the first to create an adventure to these destinations!
          </p>
        </div>
      )}
    </Card>
  );
};

export default PopularDestinations;
