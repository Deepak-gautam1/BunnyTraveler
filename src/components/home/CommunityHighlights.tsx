import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Quote, Star, Verified } from "lucide-react";

const testimonials = [
  {
    id: 1,
    content:
      "Met my adventure squad through WanderTribe! That Spiti trip changed my life ✨",
    author: "Priya K.",
    avatar: "",
    rating: 5,
    tripDestination: "Spiti Valley",
    verified: true,
  },
  {
    id: 2,
    content:
      "Found the most genuine travel companions. We're planning our 5th trip together!",
    author: "Arjun M.",
    avatar: "",
    rating: 5,
    tripDestination: "Goa",
    verified: true,
  },
  {
    id: 3,
    content:
      "Female-safe travels made easy. The host verification system gives me confidence.",
    author: "Ananya S.",
    avatar: "",
    rating: 5,
    tripDestination: "Rishikesh",
    verified: true,
  },
];

const trendingCommunities = [
  { name: "Solo Female Travelers", members: 2847, growth: "+23%", emoji: "👩‍🦱" },
  { name: "Weekend Warriors", members: 1923, growth: "+18%", emoji: "⚡" },
  { name: "Photography Nomads", members: 1456, growth: "+31%", emoji: "📸" },
  { name: "Spiritual Seekers", members: 987, growth: "+15%", emoji: "🕉️" },
];

const partnerSpotlight = {
  brand: "Mountain Trails Co.",
  offer: "20% off guided treks",
  description: "Premium guided experiences in the Himalayas",
  badge: "Verified Partner",
  ctaText: "Explore Deals",
};

const CommunityHighlights = () => {
  return (
    <div className="space-y-6">
      {/* Success Stories */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <Heart className="w-5 h-5 text-red-500" />
            <span>Success Stories</span>
          </h3>
          <Badge variant="outline" className="text-xs">
            New stories daily
          </Badge>
        </div>

        <div className="space-y-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="border-l-4 border-l-accent">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Quote className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm italic">"{testimonial.content}"</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs bg-earth-sand text-earth-terracotta">
                            {testimonial.author.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs font-medium">
                            {testimonial.author}
                          </span>
                          {testimonial.verified && (
                            <Verified className="w-3 h-3 text-accent" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: testimonial.rating }).map(
                          (_, i) => (
                            <Star
                              key={i}
                              className="w-3 h-3 fill-yellow-400 text-yellow-400"
                            />
                          )
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs w-fit">
                      {testimonial.tripDestination} trip
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Trending Communities */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center space-x-2">
          <span className="text-accent">🔥</span>
          <span>Trending Communities</span>
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {trendingCommunities.map((community, index) => (
            <Card key={index} className="cursor-pointer hover-scale">
              <CardContent className="p-3">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{community.emoji}</span>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium leading-tight">
                        {community.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {community.members.toLocaleString()} members
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-xs bg-green-50 text-green-700 border-green-200"
                  >
                    {community.growth} this month
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Partner Spotlight */}
      <Card className="bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/20">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge className="bg-accent text-accent-foreground">
                {partnerSpotlight.badge}
              </Badge>
              <span className="text-sm font-bold text-accent">
                {partnerSpotlight.offer}
              </span>
            </div>
            <div>
              <h4 className="font-semibold">{partnerSpotlight.brand}</h4>
              <p className="text-sm text-muted-foreground">
                {partnerSpotlight.description}
              </p>
            </div>
            <button className="w-full bg-accent text-accent-foreground py-2 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">
              {partnerSpotlight.ctaText}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommunityHighlights;
