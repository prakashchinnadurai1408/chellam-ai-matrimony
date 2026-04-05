import { useParams, Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Heart, Search, MapPin, Sparkles, Shield, Users, GraduationCap,
  Briefcase, ArrowRight, Globe, Star, Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import profile1 from "@/assets/profile-1.jpg";

const communities = {
  tamil: {
    name: "Tamil Matrimony",
    title: "Find Your Tamil Life Partner",
    description: "AI-powered matchmaking for the Tamil community. Horoscope compatibility, cultural alignment, and verified profiles.",
    color: "from-orange-600 to-red-600",
    filterField: "community",
    filterValues: ["Mudaliar", "Iyengar", "Iyer"],
    stateFilter: "Tamil Nadu",
    stats: { profiles: "25,000+", marriages: "5,000+", rating: "4.8" },
    features: ["Horoscope Matching", "Guna Milan Score", "Tamil Culture Priority", "Regional Language Support"],
  },
  telugu: {
    name: "Telugu Matrimony",
    title: "Find Your Telugu Life Partner",
    description: "Connect with verified Telugu-speaking profiles. AI-driven matchmaking for Andhra Pradesh & Telangana communities.",
    color: "from-blue-600 to-indigo-600",
    filterField: "community",
    filterValues: ["Reddy", "Naidu", "Kamma"],
    stateFilter: "Telangana",
    stats: { profiles: "20,000+", marriages: "4,000+", rating: "4.7" },
    features: ["Telugu Community Focus", "Regional Preferences", "Verified Profiles", "AI Compatibility"],
  },
  brahmin: {
    name: "Brahmin Matrimony",
    title: "Find Your Brahmin Life Partner",
    description: "Exclusive matchmaking for the Brahmin community across India. Deep horoscope analysis and cultural compatibility.",
    color: "from-amber-600 to-orange-600",
    filterField: "community",
    filterValues: ["Brahmin", "Iyer", "Iyengar"],
    stateFilter: "",
    stats: { profiles: "30,000+", marriages: "6,000+", rating: "4.9" },
    features: ["Gothra Matching", "Vedic Horoscope", "Pan-India Brahmins", "Family Background Priority"],
  },
  nri: {
    name: "NRI Matrimony",
    title: "Find Your NRI Life Partner",
    description: "Global matchmaking for Non-Resident Indians. Verified profiles from USA, Canada, UK, Australia and more.",
    color: "from-emerald-600 to-teal-600",
    filterField: "location",
    filterValues: [],
    stateFilter: "",
    stats: { profiles: "15,000+", marriages: "3,000+", rating: "4.8" },
    features: ["Global Search", "Income Verified", "Cultural Compatibility", "Video Profiles"],
  },
  muslim: {
    name: "Muslim Matrimony",
    title: "Find Your Muslim Life Partner",
    description: "AI-powered matchmaking for the Muslim community. Nikah-ready profiles with verified backgrounds.",
    color: "from-green-600 to-emerald-600",
    filterField: "religion",
    filterValues: ["Muslim"],
    stateFilter: "",
    stats: { profiles: "18,000+", marriages: "3,500+", rating: "4.7" },
    features: ["Sect Preferences", "Family Values Focus", "Verified Profiles", "Cultural Matching"],
  },
  christian: {
    name: "Christian Matrimony",
    title: "Find Your Christian Life Partner",
    description: "Connect with verified Christian profiles. Denomination-aware matchmaking with family-first values.",
    color: "from-purple-600 to-violet-600",
    filterField: "religion",
    filterValues: ["Christian"],
    stateFilter: "",
    stats: { profiles: "12,000+", marriages: "2,500+", rating: "4.6" },
    features: ["Denomination Filter", "Church Community", "Family-Centric", "Value-Based Matching"],
  },
};

type CommunitySlug = keyof typeof communities;

const CommunityPortal = () => {
  const { slug } = useParams<{ slug: string }>();
  const community = communities[(slug || "tamil") as CommunitySlug] || communities.tamil;
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      let query = supabase
        .from("profiles")
        .select("user_id, first_name, last_name, photo_url, location, profession, education, date_of_birth, verified, community, religion")
        .eq("profile_complete", true)
        .limit(12);

      if (community.filterField === "religion" && community.filterValues.length > 0) {
        query = query.eq("religion", community.filterValues[0]);
      } else if (community.filterValues.length > 0) {
        query = query.in("community", community.filterValues);
      }

      if (community.stateFilter) {
        query = query.eq("state", community.stateFilter);
      }

      const { data } = await query;
      setProfiles(data || []);
      setLoading(false);
    };
    fetchProfiles();
  }, [slug]);

  const getAge = (dob: string | null) => {
    if (!dob) return null;
    return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  };

  const filteredProfiles = useMemo(() => {
    if (!searchQuery) return profiles;
    const q = searchQuery.toLowerCase();
    return profiles.filter((p) => {
      const name = [p.first_name, p.last_name].filter(Boolean).join(" ").toLowerCase();
      return name.includes(q) || (p.location || "").toLowerCase().includes(q) || (p.profession || "").toLowerCase().includes(q);
    });
  }, [profiles, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className={`pt-24 pb-20 bg-gradient-to-br ${community.color} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Badge className="bg-white/20 text-white border-0 mb-4 backdrop-blur-sm text-sm">
              <Users className="w-3.5 h-3.5 mr-1.5" /> {community.name}
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
              {community.title}
            </h1>
            <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
              {community.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <Button size="lg" className="bg-white text-foreground hover:bg-white/90 gap-2 flex-1" asChild>
                <Link to="/auth">
                  <Sparkles className="w-4 h-4" /> Register Free
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 gap-2 flex-1" asChild>
                <Link to="/search">
                  <Search className="w-4 h-4" /> Search Profiles
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary font-display">{community.stats.profiles}</p>
              <p className="text-xs text-muted-foreground mt-1">Verified Profiles</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary font-display">{community.stats.marriages}</p>
              <p className="text-xs text-muted-foreground mt-1">Marriages</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary font-display">{community.stats.rating} ★</p>
              <p className="text-xs text-muted-foreground mt-1">User Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-2xl font-bold text-foreground text-center mb-8">
            Why Choose {community.name}?
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {community.features.map((feature, i) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-xl border border-border p-4 text-center"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  {[Shield, Star, Globe, Heart][i % 4] && (() => {
                    const Icon = [Shield, Star, Globe, Heart][i % 4];
                    return <Icon className="w-5 h-5 text-primary" />;
                  })()}
                </div>
                <p className="text-sm font-medium text-foreground">{feature}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Profiles */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-2xl font-bold text-foreground">
              Featured {community.name.replace(" Matrimony", "")} Profiles
            </h2>
            <div className="relative w-64 hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search profiles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border">
              <Users className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
              <h3 className="font-display text-lg font-semibold mb-2">No profiles found</h3>
              <p className="text-sm text-muted-foreground mb-4">Be the first to register in this community!</p>
              <Button variant="hero" asChild>
                <Link to="/auth">Register Now</Link>
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredProfiles.map((p, i) => {
                const age = getAge(p.date_of_birth);
                return (
                  <motion.div
                    key={p.user_id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link to={`/profile/${p.user_id}`}>
                      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-card hover:shadow-card-hover transition-all group">
                        <div className="relative aspect-[3/4] overflow-hidden">
                          <img
                            src={p.photo_url || profile1}
                            alt={p.first_name || "Profile"}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                          {p.verified && (
                            <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/90 backdrop-blur-sm">
                              <Shield className="w-3 h-3 text-secondary-foreground" />
                              <span className="text-[10px] font-bold text-secondary-foreground">Verified</span>
                            </div>
                          )}
                          <div className="absolute bottom-3 left-3">
                            <h3 className="text-white font-display text-sm font-bold">
                              {[p.first_name, p.last_name].filter(Boolean).join(" ")}
                              {age && <span className="font-normal">, {age}</span>}
                            </h3>
                            <p className="text-white/70 text-xs flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {p.location || "India"}
                            </p>
                          </div>
                        </div>
                        <div className="p-3">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                            <Briefcase className="w-3 h-3" /> {p.profession || "Not specified"}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <GraduationCap className="w-3 h-3" /> {p.education || "Not specified"}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}

          <div className="text-center mt-8">
            <Button variant="outline" className="gap-2" asChild>
              <Link to="/search">
                View All Profiles <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={`py-16 bg-gradient-to-br ${community.color} relative`}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-4">
            Join {community.name} Today
          </h2>
          <p className="text-white/80 max-w-xl mx-auto mb-8">
            Free registration. AI-powered matching. Verified profiles. Your perfect match is waiting.
          </p>
          <Button size="lg" className="bg-white text-foreground hover:bg-white/90 gap-2" asChild>
            <Link to="/auth">
              <Heart className="w-4 h-4" /> Register Free <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CommunityPortal;
