import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart, X, Sparkles, Shield, MapPin, GraduationCap, Briefcase,
  SlidersHorizontal, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import profile1 from "@/assets/profile-1.jpg";
import profile2 from "@/assets/profile-2.jpg";
import profile3 from "@/assets/profile-3.jpg";
import profile4 from "@/assets/profile-4.jpg";
import profile5 from "@/assets/profile-5.jpg";
import profile6 from "@/assets/profile-6.jpg";

const profiles = [
  {
    id: 1, name: "Ananya Sharma", age: 27, location: "Mumbai", image: profile1,
    education: "MBA, IIM Bangalore", profession: "Product Manager",
    matchScore: 96, verified: true, community: "Hindu – Brahmin",
    insights: ["Both value career growth", "Similar lifestyle preferences", "Compatible horoscopes"],
  },
  {
    id: 2, name: "Arjun Menon", age: 29, location: "Bangalore", image: profile2,
    education: "B.Tech, IIT Madras", profession: "Software Engineer",
    matchScore: 91, verified: true, community: "Hindu – Nair",
    insights: ["Shared interest in travel", "Both are vegetarian", "Same age bracket preference"],
  },
  {
    id: 3, name: "Priya Iyer", age: 25, location: "Chennai", image: profile3,
    education: "MBBS, AIIMS", profession: "Doctor",
    matchScore: 89, verified: true, community: "Hindu – Iyengar",
    insights: ["Both enjoy reading", "Family-oriented values", "Similar education level"],
  },
  {
    id: 4, name: "Vikram Reddy", age: 31, location: "Hyderabad", image: profile4,
    education: "MS, Stanford", profession: "Data Scientist",
    matchScore: 87, verified: true, community: "Hindu – Reddy",
    insights: ["NRI compatibility match", "Both appreciate art", "Complementary personalities"],
  },
  {
    id: 5, name: "Meera Krishnan", age: 28, location: "Coimbatore", image: profile5,
    education: "CA, ICAI", profession: "Finance Manager",
    matchScore: 93, verified: true, community: "Hindu – Mudaliar",
    insights: ["Both value financial stability", "Tamil language match", "Shared family values"],
  },
  {
    id: 6, name: "Rahul Nair", age: 30, location: "Kochi", image: profile6,
    education: "MBA, ISB Hyderabad", profession: "Entrepreneur",
    matchScore: 85, verified: true, community: "Hindu – Nair",
    insights: ["Entrepreneurial mindset match", "Both enjoy cooking", "Compatible family backgrounds"],
  },
];

const DiscoveryFeed = () => {
  const [selectedProfile, setSelectedProfile] = useState<number | null>(null);

  return (
    <section id="discover" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Curated For You
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              Today's Top Matches
            </h2>
            <p className="text-muted-foreground mt-2 max-w-md">
              Our AI analyzes 50+ compatibility factors to find your most compatible matches daily.
            </p>
          </div>
          <Button variant="outline" className="gap-2 self-start">
            <SlidersHorizontal className="w-4 h-4" />
            Advanced Filters
          </Button>
        </div>

        {/* Profile Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile, i) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="group bg-card rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden border border-border/50 cursor-pointer"
              onClick={() => setSelectedProfile(selectedProfile === profile.id ? null : profile.id)}
            >
              {/* Image */}
              <div className="relative aspect-[4/5] overflow-hidden">
                <img
                  src={profile.image}
                  alt={profile.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />

                {/* Match Score */}
                <div className="absolute top-3 left-3">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card/90 backdrop-blur-sm">
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                    <span className="text-xs font-bold text-foreground">{profile.matchScore}% Match</span>
                  </div>
                </div>

                {/* Verified Badge */}
                {profile.verified && (
                  <div className="absolute top-3 right-3">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary/90 backdrop-blur-sm">
                      <Shield className="w-3 h-3 text-secondary-foreground" />
                      <span className="text-[10px] font-bold text-secondary-foreground">Verified</span>
                    </div>
                  </div>
                )}

                {/* Bottom Info */}
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="font-display text-xl font-bold text-card">
                    {profile.name}, {profile.age}
                  </h3>
                  <div className="flex items-center gap-1 text-card/80 text-sm mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {profile.location}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="p-4">
                <div className="flex flex-col gap-2 mb-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{profile.education}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Briefcase className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{profile.profession}</span>
                  </div>
                </div>

                <Badge variant="secondary" className="text-[10px] font-medium bg-muted text-muted-foreground">
                  {profile.community}
                </Badge>

                {/* AI Insights */}
                <AnimatePresence>
                  {selectedProfile === profile.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs font-semibold text-accent flex items-center gap-1 mb-2">
                          <Sparkles className="w-3 h-3" /> Why You Match
                        </p>
                        {profile.insights.map((insight, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground mb-1">
                            <ChevronRight className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                            {insight}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1 gap-1">
                    <X className="w-3.5 h-3.5" /> Skip
                  </Button>
                  <Button variant="hero" size="sm" className="flex-1 gap-1" asChild>
                    <Link to={`/profile/${profile.id}`}>
                      <Heart className="w-3.5 h-3.5" /> View Profile
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Button variant="outline" size="lg" className="gap-2">
            View More Matches
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default DiscoveryFeed;
