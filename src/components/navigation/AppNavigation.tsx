import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Link, useLocation } from "react-router-dom";
import PostTripModal from "@/components/trip/PostTripModal";
import { setCookie, COOKIE_KEYS } from "@/lib/cookies";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import NotificationsDropdown from "@/components/notifications/NotificationsDropdown";
import {
  Home,
  PlusCircle,
  Search,
  MessageCircle,
  User as UserIcon,
  Settings,
  LogOut,
  MapPin,
  Calendar,
  Users,
  // For Discover icon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

interface AppNavigationProps {
  user: User | null;
}

const AppNavigation = ({ user }: AppNavigationProps) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const { unreadCount } = useUnreadMessages(user);

  useEffect(() => {
    if (location.pathname !== "/auth" && location.pathname !== "/404") {
      setCookie(COOKIE_KEYS.LAST_PAGE, location.pathname, 7);
    }
  }, [location.pathname]);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Error signing out");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTrip = () => {
    if (!user) {
      toast.error("Please sign in to create a trip");
      return;
    }
    setIsPostModalOpen(true);
  };

  const isActive = (path: string) => location.pathname === path;

  // Mobile Bottom Nav Items
  const mobileNavItems = [
    {
      path: "/",
      icon: Home,
      label: "Home",
    },
    {
      path: "/discover",
      icon: Search,
      label: "Discover",
    },
    {
      path: null, // Special Create Button
      icon: PlusCircle,
      label: "Plan",
      onClick: handleCreateTrip,
      isSpecial: true,
    },
    {
      path: "/messages",
      icon: MessageCircle,
      label: "Inbox",
      badge: unreadCount,
    },
    {
      path: "/community",
      icon: Users,
      label: "Community",
    },
  ];

  return (
    <>
      {/* =======================================================
          TOP HEADER (Logo + Desktop Nav + User Profile)
          ======================================================= */}
      {/* Added overflow-x-hidden to prevent header items from causing scroll */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-x-hidden">
        <div className="container flex h-16 items-center justify-between">
          {/* 1. Logo (Visible on Desktop AND Mobile now) */}
          <Link
            to="/"
            className="flex items-center space-x-2 cursor-pointer z-50"
          >
            <img
              src="/SafarSquadLogo.svg"
              alt="SafarSquad Logo"
              className="h-10 w-auto object-contain select-none"
            />
            {/* Show Text Logo on Mobile too if you want, or just the icon */}
            <span className="text-xl font-bold bg-gradient-to-r from-accent to-accent/80 bg-clip-text text-transparent select-none">
              SafarSquad
            </span>
          </Link>

          {/* 2. Desktop Navigation (HIDDEN on Mobile) */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    to="/"
                    className={`group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                      isActive("/") ? "bg-accent text-accent-foreground" : ""
                    }`}
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Home
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger>
                  <MapPin className="mr-2 h-4 w-4" />
                  Trips
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-3 p-6 w-[400px]">
                    <div className="row-span-3">
                      <NavigationMenuLink asChild>
                        <Link
                          to="/discover"
                          className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                        >
                          <Search className="h-6 w-6" />
                          <div className="mb-2 mt-4 text-lg font-medium">
                            Discover Trips
                          </div>
                          <p className="text-sm leading-tight text-muted-foreground">
                            Explore amazing trips planned by fellow travelers
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </div>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/my-trips"
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="flex items-center text-sm font-medium leading-none">
                          <Calendar className="mr-2 h-4 w-4" />
                          My Trips
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          View and manage your joined trips
                        </p>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <button
                        onClick={handleCreateTrip}
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-left w-full"
                      >
                        <div className="flex items-center text-sm font-medium leading-none">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Create Trip
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Plan a new adventure
                        </p>
                      </button>
                    </NavigationMenuLink>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    to="/community"
                    className={`group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                      isActive("/community")
                        ? "bg-accent text-accent-foreground"
                        : ""
                    }`}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Community
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {user && (
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      to="/messages"
                      className={`group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                        isActive("/messages")
                          ? "bg-accent text-accent-foreground"
                          : ""
                      }`}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Messages
                      {unreadCount > 0 && (
                        <Badge
                          variant="destructive"
                          className="ml-2 animate-pulse"
                        >
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                      )}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>

          {/* 3. User Actions (Avatar/Sign In) */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <NotificationsDropdown user={user} />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={user.user_metadata?.avatar_url}
                          alt={user.user_metadata?.full_name || "User"}
                        />
                        <AvatarFallback>
                          {user.user_metadata?.full_name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">
                          {user.user_metadata?.full_name}
                        </p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile">
                        <UserIcon className="mr-2 h-4 w-4" /> Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/my-trips">
                        <Calendar className="mr-2 h-4 w-4" /> My Trips
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings">
                        <Settings className="mr-2 h-4 w-4" /> Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      disabled={isLoading}
                    >
                      <LogOut className="mr-2 h-4 w-4" /> Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth">Sign in</Link>
                </Button>
                <Button size="sm" asChild className="hidden sm:inline-flex">
                  <Link to="/auth">Get Started</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* =======================================================
    BOTTOM NAVIGATION (HIDDEN on Desktop, Visible on Mobile)
    ======================================================= */}
      {/* Changed fixed 'left-0 right-0' to 'left-0 w-full' to prevent horizontal overflow */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-lg safe-bottom">
        <div className="flex items-center justify-around h-16 px-2 relative">
          {mobileNavItems.map((item, index) => {
            const Icon = item.icon;
            const active = item.path ? isActive(item.path) : false;

            // Special Create Button (Center)
            if (item.isSpecial) {
              return (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="flex flex-col items-center justify-center -mt-8 transition-transform active:scale-95 z-10"
                >
                  {/* Gradient Circle Button */}
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#f97415] to-[#ff8c42] flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 ring-4 ring-white">
                    <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                  </div>
                  {/* Label */}
                  <span className="text-[10px] font-semibold text-[#f97415] mt-1.5">
                    {item.label}
                  </span>
                </button>
              );
            }

            // Regular Navigation Items
            return (
              <Link
                key={index}
                to={item.path!}
                className="flex flex-col items-center justify-center gap-1 py-2 flex-1 transition-all duration-200 active:scale-95"
              >
                {/* Icon Container with Badge */}
                <div className="relative">
                  {/* Icon Background (Active State) */}
                  <div
                    className={`p-2 rounded-xl transition-all duration-200 ${
                      active ? "bg-orange-50" : ""
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 transition-colors ${
                        active ? "text-[#f97415]" : "text-gray-600"
                      }`}
                      strokeWidth={active ? 2.5 : 2}
                    />
                  </div>

                  {/* Badge on Top Right */}
                  {item.badge !== undefined && item.badge > 0 && (
                    <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-md">
                      <span className="text-[10px] font-bold text-white px-1">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    </div>
                  )}
                </div>

                {/* Label */}
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    active ? "text-[#f97415] font-semibold" : "text-gray-600"
                  }`}
                >
                  {item.label}
                </span>

                {/* Active Indicator Dot */}
                {active && (
                  <div className="absolute bottom-1 w-1 h-1 bg-[#f97415] rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      <PostTripModal
        open={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
      />
    </>
  );
};

export default AppNavigation;
