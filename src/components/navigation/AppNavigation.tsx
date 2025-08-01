import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { Link, useLocation } from "react-router-dom";
import PostTripModal from "@/components/trip/PostTripModal"; // ✅ ADD THIS IMPORT
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
  Compass,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AppNavigationProps {
  user: User | null;
}

const AppNavigation = ({ user }: AppNavigationProps) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false); // ✅ ADD THIS STATE

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

  // ✅ ADD: Handle create trip modal
  const handleCreateTrip = () => {
    if (!user) {
      toast.error("Please sign in to create a trip");
      return;
    }
    setIsPostModalOpen(true);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Compass className="h-4 w-4" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              WanderTribe
            </span>
          </Link>

          {/* Main Navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    to="/"
                    className={`group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 ${
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

                    {/* ✅ UPDATED: Use button to trigger modal instead of Link */}
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
                          Plan a new adventure and invite others
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
                    className={`group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 ${
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
                      className={`group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 ${
                        isActive("/messages")
                          ? "bg-accent text-accent-foreground"
                          : ""
                      }`}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Messages
                      <Badge variant="secondary" className="ml-2">
                        3
                      </Badge>
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>

          {/* User Actions */}
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
                          {user.user_metadata?.full_name?.[0] ||
                            user.email?.[0]?.toUpperCase() ||
                            "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        {user.user_metadata?.full_name && (
                          <p className="font-medium">
                            {user.user_metadata.full_name}
                          </p>
                        )}
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile">
                        <UserIcon className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/my-trips">
                        <Calendar className="mr-2 h-4 w-4" />
                        My Trips
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      disabled={isLoading}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth">Sign in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/auth">Get Started</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ✅ ADD: PostTripModal - Same UI as floating + button */}
      <PostTripModal
        open={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
      />
    </>
  );
};

export default AppNavigation;
