import { useState } from "react";
import {
  MapPin,
  Mail,
  Instagram,
  Facebook,
  Twitter,
  Heart,
  Shield,
  Users,
  Globe,
  ArrowUp,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PostTripModal from "@/components/trip/PostTripModal";
import { useFooterStats } from "@/hooks/useFooterStats";

const currentYear = new Date().getFullYear();

const Footer = () => {
  const [showPostTrip, setShowPostTrip] = useState(false);
  const stats = useFooterStats();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Helper function to format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K+`;
    }
    return `${num}+`;
  };

  return (
    <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-3 md:px-4 py-4 md:py-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mb-4 md:mb-6">
          {/* Brand Section */}
          <div className="space-y-2 md:space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 md:w-6 md:h-6 bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Globe className="w-3 h-3 md:w-4 md:h-4 text-white" />
              </div>
              <h3 className="text-base md:text-lg font-bold">SafarSquad</h3>
            </div>
            <p className="text-gray-300 text-xs md:text-sm leading-snug">
              Connect with fellow travelers and create unforgettable memories
              together.
            </p>
            <div className="flex space-x-2">
              <Badge
                variant="outline"
                className="text-xs border-green-400 text-green-400 px-1.5 py-0.5"
              >
                <Shield className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1" />
                Safe
              </Badge>
              <Badge
                variant="outline"
                className="text-xs border-blue-400 text-blue-400 px-1.5 py-0.5"
              >
                <Users className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1" />
                {stats.loading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  formatNumber(stats.totalTravelers)
                )}
              </Badge>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 md:gap-x-4 md:gap-y-2">
            <button
              type="button"
              className="text-gray-300 hover:text-orange-400 transition-colors text-xs md:text-sm text-left bg-transparent border-none cursor-pointer"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
                window.history.pushState({}, "", "/");
              }}
            >
              Browse Trips
            </button>
            <a
              href="/community"
              className="text-gray-300 hover:text-orange-400 transition-colors text-xs md:text-sm"
            >
              Communities
            </a>
            <button
              type="button"
              className="text-gray-300 hover:text-orange-400 transition-colors text-xs md:text-sm text-left bg-transparent border-none cursor-pointer"
              onClick={() => setShowPostTrip(true)}
            >
              Create Trip
            </button>
            <a
              href="/Safety"
              className="text-gray-300 hover:text-orange-400 transition-colors text-xs md:text-sm"
            >
              Safety
            </a>
            <a
              href="/contact"
              className="text-gray-300 hover:text-orange-400 transition-colors text-xs md:text-sm"
            >
              Contact
            </a>
            <a
              href="https://forms.gle/XajfXmSAiTLjYtLy7"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-orange-400 transition-colors text-xs md:text-sm"
            >
              Feedback
            </a>
            <a
              href="/terms"
              className="text-gray-300 hover:text-orange-400 transition-colors text-xs md:text-sm"
            >
              Terms & Conditions
            </a>
            <a
              href="/privacy"
              className="text-gray-300 hover:text-orange-400 transition-colors text-xs md:text-sm"
            >
              Privacy Policy
            </a>
          </div>

          {/* Connect & Social */}
          <div className="space-y-2 md:space-y-3">
            <h4 className="text-sm md:text-base font-semibold text-white">
              Connect
            </h4>
            <div className="space-y-1.5 md:space-y-2">
              <div className="flex items-center space-x-2 text-xs md:text-sm text-gray-300">
                <Mail className="w-3 h-3 text-orange-400 flex-shrink-0" />
                <span className="truncate">safarsquad.india@gmail.com</span>
              </div>
              <div className="flex items-center space-x-2 text-xs md:text-sm text-gray-300">
                <MapPin className="w-3 h-3 text-orange-400 flex-shrink-0" />
                <span>New Delhi, India</span>
              </div>
            </div>
            <div className="flex space-x-2 md:space-x-3">
              <a
                href="https://www.instagram.com/safar.squad?utm_source=qr&igsh=M3UzcDZncHd3YWtv"
                className="w-6 h-6 md:w-7 md:h-7 bg-gradient-to-r from-pink-500 to-orange-500 rounded-md flex items-center justify-center hover:scale-110 transition-transform"
                aria-label="Instagram"
              >
                <Instagram className="w-3 h-3 text-white" />
              </a>
              <a
                href="https://www.facebook.com/share/1EJbGFkhxj/"
                className="w-6 h-6 md:w-7 md:h-7 bg-blue-600 rounded-md flex items-center justify-center hover:scale-110 transition-transform"
                aria-label="Facebook"
              >
                <Facebook className="w-3 h-3 text-white" />
              </a>
              <a
                href="https://x.com/safar_squad?t=uOFezk2oJ0nGDqA30eO-5w&s=08"
                className="w-6 h-6 md:w-7 md:h-7 bg-blue-400 rounded-md flex items-center justify-center hover:scale-110 transition-transform"
                aria-label="Twitter"
              >
                <Twitter className="w-3 h-3 text-white" />
              </a>
            </div>
          </div>
        </div>

        {/* Stats Row - Now with Real-Time Data */}
        <div className="grid grid-cols-4 gap-2 md:gap-4 py-3 md:py-4 border-t border-gray-700 border-b">
          <div className="text-center">
            <div className="text-sm md:text-lg font-bold text-orange-400">
              {stats.loading ? (
                <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin mx-auto" />
              ) : (
                formatNumber(stats.totalTravelers)
              )}
            </div>
            <div className="text-[10px] md:text-xs text-gray-400">
              Travelers
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm md:text-lg font-bold text-green-400">
              {stats.loading ? (
                <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin mx-auto" />
              ) : (
                formatNumber(stats.uniqueDestinations)
              )}
            </div>
            <div className="text-[10px] md:text-xs text-gray-400">
              Destinations
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm md:text-lg font-bold text-blue-400">
              {stats.loading ? (
                <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin mx-auto" />
              ) : (
                formatNumber(stats.totalTrips)
              )}
            </div>
            <div className="text-[10px] md:text-xs text-gray-400">Trips</div>
          </div>
          <div className="text-center">
            <div className="text-sm md:text-lg font-bold text-purple-400">
              {stats.loading ? (
                <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin mx-auto" />
              ) : (
                `${stats.averageRating}★`
              )}
            </div>
            <div className="text-[10px] md:text-xs text-gray-400">Rating</div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-3 md:pt-4 space-y-2 md:space-y-0">
          <div className="flex flex-col md:flex-row items-center md:space-x-4 text-[10px] md:text-xs text-gray-400 text-center md:text-left space-y-1 md:space-y-0">
            <span>© {currentYear} SafarSquad</span>
            <span className="hidden md:flex items-center space-x-1">
              <span>Made with</span>
              <Heart className="w-3 h-3 text-red-400 fill-red-400" />
              <span>in India</span>
            </span>
          </div>
          <div className="flex items-center space-x-3 md:space-x-4 text-[10px] md:text-xs">
            <a
              href="/about-us"
              className="text-gray-400 hover:text-orange-400 transition-colors"
            >
              About
            </a>
            <Button
              onClick={scrollToTop}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-orange-400 p-1 h-6 md:h-auto"
            >
              <ArrowUp className="w-3 h-3 mr-1" />
              Top
            </Button>
          </div>
        </div>
      </div>
      <PostTripModal
        open={showPostTrip}
        onClose={() => setShowPostTrip(false)}
        mode="create"
      />
    </footer>
  );
};

export default Footer;
