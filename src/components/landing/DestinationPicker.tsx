// src/components/landing/DestinationPicker.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Plane, Compass } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";

interface Destination {
  id: string;
  name: string;
  state: string;
  hero: string;
  price: string;
  rating: number;
}

const ALL_DESTINATIONS: Destination[] = [
  {
    id: "goa",
    name: "Goa Beaches",
    state: "Goa",
    hero: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&h=300&fit=crop",
    price: "₹12,000",
    rating: 4.8,
  },
  {
    id: "hampi",
    name: "Hampi Ruins",
    state: "Karnataka",
    hero: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400&h=300&fit=crop",
    price: "₹8,500",
    rating: 4.6,
  },
  {
    id: "manali",
    name: "Manali Trek",
    state: "Himachal Pradesh",
    hero: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
    price: "₹15,000",
    rating: 4.9,
  },
  {
    id: "udaipur",
    name: "Udaipur Lakes",
    state: "Rajasthan",
    hero: "https://images.unsplash.com/photo-1599661046827-dacde6976549?w=400&h=300&fit=crop",
    price: "₹10,500",
    rating: 4.7,
  },
  {
    id: "munnar",
    name: "Munnar Tea Hills",
    state: "Kerala",
    hero: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400&h=300&fit=crop",
    price: "₹9,000",
    rating: 4.5,
  },
  {
    id: "rishikesh",
    name: "Rishikesh Rapids",
    state: "Uttarakhand",
    hero: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&h=300&fit=crop",
    price: "₹7,500",
    rating: 4.4,
  },
];

export default function DestinationPicker() {
  const { location } = useGeolocation();
  const [filter, setFilter] = useState<string | null>(null);

  const visible = filter
    ? ALL_DESTINATIONS.filter((d) => d.state === filter)
    : ALL_DESTINATIONS;

  const states = ["All", ...new Set(ALL_DESTINATIONS.map((d) => d.state))];

  return (
    <section className="py-16 bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 flex items-center justify-center gap-2">
            <Compass className="w-8 h-8 text-orange-400" />
            Pick Your Next Adventure
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto">
            Discover incredible destinations across India with fellow travelers.
            {location.state && ` Popular trips from ${location.state}`}
          </p>
        </motion.div>

        {/* Filter chips */}
        <motion.div
          className="flex flex-wrap justify-center gap-2 mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          {states.map((state) => (
            <motion.button
              key={state}
              onClick={() => setFilter(state === "All" ? null : state)}
              className={`px-4 py-2 rounded-full text-sm border transition-all duration-200 ${
                filter === state || (!filter && state === "All")
                  ? "bg-orange-500 border-orange-400 text-white"
                  : "border-white/30 hover:bg-white/10 text-white/80"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {state}
            </motion.button>
          ))}
        </motion.div>

        {/* Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {visible.map((dest) => (
              <motion.div
                key={dest.id}
                layout
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                transition={{ duration: 0.4 }}
                className="relative bg-white/5 rounded-xl overflow-hidden shadow-lg border border-white/10 hover:border-orange-400/50 transition-all duration-300"
                whileHover={{ y: -5 }}
              >
                <div className="relative">
                  <img
                    src={dest.hero}
                    alt={dest.name}
                    className="h-48 w-full object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 text-xs text-white flex items-center gap-1">
                    ⭐ {dest.rating}
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg text-white">
                        {dest.name}
                      </h3>
                      <p className="text-xs text-white/60 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {dest.state}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-orange-400 font-bold">{dest.price}</p>
                      <p className="text-xs text-white/60">per person</p>
                    </div>
                  </div>

                  <motion.button
                    className="w-full mt-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Plane className="w-4 h-4" />
                    Explore Trip
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty state */}
        {!visible.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-10 text-center text-white/60 flex flex-col items-center gap-4"
          >
            <MapPin className="w-12 h-12 text-white/30" />
            <p>No trips for this region yet – be the first to create one!</p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
