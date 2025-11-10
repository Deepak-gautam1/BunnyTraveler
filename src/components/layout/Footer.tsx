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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PostTripModal from "@/components/trip/PostTripModal"; // Adjust path if needed
import Safety from "@/pages/Safety";
import CommunityPage from "@/pages/CommunityPage";

const currentYear = new Date().getFullYear();

const Footer = () => {
  const [showPostTrip, setShowPostTrip] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          {/* Brand Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Globe className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold">SafarSquad</h3>
            </div>
            <p className="text-gray-300 text-sm">
              Connect with fellow travelers and create unforgettable memories
              together.
            </p>
            <div className="flex space-x-2">
              <Badge
                variant="outline"
                className="text-xs border-green-400 text-green-400"
              >
                <Shield className="w-3 h-3 mr-1" />
                Safe
              </Badge>
              <Badge
                variant="outline"
                className="text-xs border-blue-400 text-blue-400"
              >
                <Users className="w-3 h-3 mr-1" />
                2400+ Members
              </Badge>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-base font-semibold text-white">Quick Links</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <button
                type="button"
                className="text-gray-300 hover:text-orange-400 transition-colors text-sm text-left bg-transparent border-none cursor-pointer"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  window.history.pushState({}, "", "/");
                }}
              >
                Browse Trips
              </button>
              <a
                href="/community"
                className="text-gray-300 hover:text-orange-400 transition-colors text-sm"
              >
                Communities
              </a>

              <button
                type="button"
                className="text-gray-300 hover:text-orange-400 transition-colors text-sm text-left bg-transparent border-none cursor-pointer"
                onClick={() => setShowPostTrip(true)}
              >
                Create Trip
              </button>
              <a
                href="/Safety"
                className="text-gray-300 hover:text-orange-400 transition-colors text-sm"
              >
                Safety
              </a>

              <a
                href="/contact"
                className="text-gray-300 hover:text-orange-400 transition-colors text-sm"
              >
                Contact
              </a>
              <a
                href="https://forms.gle/XajfXmSAiTLjYtLy7"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-orange-400 transition-colors text-sm"
              >
                Feedback
              </a>
            </div>
          </div>

          {/* Connect & Social */}
          <div className="space-y-3">
            <h4 className="text-base font-semibold text-white">Connect</h4>
            {/* Contact Info */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <Mail className="w-3 h-3 text-orange-400" />
                <span>safarsquad.india@gmail.com</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <MapPin className="w-3 h-3 text-orange-400" />
                <span>New Delhi, India</span>
              </div>
            </div>
            {/* Social Media */}
            <div className="flex space-x-3">
              <a
                href="https://www.instagram.com/safar.squad?utm_source=qr&igsh=M3UzcDZncHd3YWtv"
                className="w-7 h-7 bg-gradient-to-r from-pink-500 to-orange-500 rounded-md flex items-center justify-center hover:scale-110 transition-transform"
                aria-label="Instagram"
              >
                <Instagram className="w-3 h-3 text-white" />
              </a>
              <a
                href="https://www.facebook.com/share/1EJbGFkhxj/"
                className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center hover:scale-110 transition-transform"
                aria-label="Facebook"
              >
                <Facebook className="w-3 h-3 text-white" />
              </a>
              <a
                href="https://x.com/safar_squad?t=uOFezk2oJ0nGDqA30eO-5w&s=08"
                className="w-7 h-7 bg-blue-400 rounded-md flex items-center justify-center hover:scale-110 transition-transform"
                aria-label="Twitter"
              >
                <Twitter className="w-3 h-3 text-white" />
              </a>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 py-4 border-t border-gray-700 border-b">
          <div className="text-center">
            <div className="text-lg font-bold text-orange-400">2.4K+</div>
            <div className="text-xs text-gray-400">Travelers</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-400">150+</div>
            <div className="text-xs text-gray-400">Destinations</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-400">500+</div>
            <div className="text-xs text-gray-400">Trips</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-400">4.8★</div>
            <div className="text-xs text-gray-400">Rating</div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-4 space-y-2 md:space-y-0">
          <div className="flex items-center space-x-4 text-xs text-gray-400">
            <span>© {currentYear} SafarSquad. All rights reserved.</span>
            <span className="flex items-center space-x-1">
              <span>Made with</span>
              <Heart className="w-3 h-3 text-red-400 fill-red-400" />
              <span>in India</span>
            </span>
          </div>
          <div className="flex items-center space-x-4 text-xs">
            {
              <a
                href="/about-us"
                className="text-gray-400 hover:text-orange-400 transition-colors"
              >
                About Us
              </a>

              /*
            <a
              href="/terms"
              className="text-gray-400 hover:text-orange-400 transition-colors"
            >
              Terms
            </a> */
            }
            <Button
              onClick={scrollToTop}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-orange-400 p-1"
            >
              <ArrowUp className="w-3 h-3 mr-1" />
              Top
            </Button>
          </div>
        </div>
      </div>
      {/* Trip Creation Modal */}
      <PostTripModal
        open={showPostTrip}
        onClose={() => setShowPostTrip(false)}
        mode="create"
      />
    </footer>
  );
};

export default Footer;
