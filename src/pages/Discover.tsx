import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMembership } from "@/hooks/useMembership";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart, X, Sparkles, MapPin, GraduationCap, Briefcase, Loader2,
  RotateCcw, Star, Shield, ChevronUp, Eye, Bookmark,
} from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { toast } from "sonner";

import profile1 from "@/assets/profile-1.jpg";

interface SwipeProfile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
  gender: string | null;
  date_of_birth: string | null;
  location: string | null;
  state: string | null;
  education: string | null;
  profession: string | null;
  income: string | null;
  religion: string | null;
  community: string | null;
  height: string | null;
  marital_status: string | null;
  bio: string | null;
  verified: boolean | null;
  compatibility?: number;
}

const getAge = (dob: string | null) => {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
};

const SWIPE_THRESHOLD = 120;

const SwipeCard = ({
  profile,
  onSwipeLeft,
  onSwipeRight,
  isTop,
}: {
  profile: SwipeProfile;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isTop: boolean;
}) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-18, 0, 18]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);
  const [showDetails, setShowDetails] = useState(false);
  const age = getAge(profile.date_of_birth);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      onSwipeRight();
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      onSwipeLeft();
    }
  };

  if (!isTop) {
    return (
      <motion.div
        className="absolute inset-0 rounded-3xl overflow-hidden bg-card border border-border shadow-card"
        style={{ scale: 0.95, y: 12 }}
      >
        <div className="w-full h-full bg-muted" />
      </motion.div>
    );
  }

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none"
      style={{ x, rotate, zIndex: 10 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ x: 300, opacity: 0, transition: { duration: 0.3 } }}
    >
      <div className="relative w-full h-full rounded-3xl overflow-hidden bg-card border border-border/50 shadow-xl">
        {/* Profile Image */}
        <div className="absolute inset-0">
          <img
            src={profile.photo_url || profile1}
            alt={profile.first_name || "Profile"}
            className="w-full h-full object-cover"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        </div>

        {/* LIKE overlay */}
        <motion.div
          className="absolute top-8 left-6 z-20 px-5 py-2 rounded-xl border-4 border-green-500 rotate-[-20deg]"
          style={{ opacity: likeOpacity }}
        >
          <span className="text-green-500 text-3xl font-black tracking-wider">LIKE</span>
        </motion.div>

        {/* NOPE overlay */}
        <motion.div
          className="absolute top-8 right-6 z-20 px-5 py-2 rounded-xl border-4 border-red-500 rotate-[20deg]"
          style={{ opacity: nopeOpacity }}
        >
          <span className="text-red-500 text-3xl font-black tracking-wider">NOPE</span>
        </motion.div>

        {/* Compatibility badge */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/90 backdrop-blur-sm">
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="text-sm font-bold text-foreground">{profile.compatibility || 85}%</span>
        </div>

        {/* Verified badge */}
        {profile.verified && (
          <div className="absolute top-4 right-4 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/90 backdrop-blur-sm">
            <Shield className="w-3.5 h-3.5 text-secondary-foreground" />
            <span className="text-[11px] font-bold text-secondary-foreground">Verified</span>
          </div>
        )}

        {/* Bottom info */}
        <div className="absolute bottom-0 inset-x-0 z-10 p-6">
          <button
            className="w-full text-left"
            onClick={() => setShowDetails(!showDetails)}
          >
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-white font-display text-2xl font-bold drop-shadow-lg">
                  {[profile.first_name, profile.last_name].filter(Boolean).join(" ")}
                  {age && <span className="font-normal">, {age}</span>}
                </h2>
                <div className="flex items-center gap-1.5 text-white/80 text-sm mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {profile.location || "India"}
                </div>
              </div>
              <ChevronUp className={`w-5 h-5 text-white/60 transition-transform ${showDetails ? "rotate-180" : ""}`} />
            </div>
          </button>

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 space-y-2 bg-black/30 backdrop-blur-md rounded-xl p-4">
                  {profile.education && (
                    <div className="flex items-center gap-2 text-white/80 text-sm">
                      <GraduationCap className="w-4 h-4 shrink-0" />
                      {profile.education}
                    </div>
                  )}
                  {profile.profession && (
                    <div className="flex items-center gap-2 text-white/80 text-sm">
                      <Briefcase className="w-4 h-4 shrink-0" />
                      {profile.profession}
                    </div>
                  )}
                  {profile.religion && (
                    <div className="flex items-center gap-2 text-white/80 text-sm">
                      <Star className="w-4 h-4 shrink-0" />
                      {[profile.religion, profile.community].filter(Boolean).join(" – ")}
                    </div>
                  )}
                  {profile.bio && (
                    <p className="text-white/70 text-xs mt-2 line-clamp-3">{profile.bio}</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

const Discover = () => {
  const { user } = useAuth();
  const { isPremiumOrAbove } = useMembership(user?.id);
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<SwipeProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({ liked: 0, skipped: 0 });

  const fetchProfiles = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: myProfile, error: profileError } = await supabase
      .from("profiles")
      .select("gender, religion, community, state, profile_complete")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError || !myProfile) {
      setLoading(false);
      return;
    }

    if (!myProfile.profile_complete) {
      setProfiles([]); 
      setLoading(false);
      return;
    }

    if (!myProfile?.gender) {
      setProfiles([]);
      setLoading(false);
      return;
    }

    const oppositeGender = myProfile.gender === "Male" ? "Female" : "Male";

    const { data: candidates } = await supabase
      .from("profiles")
      .select("user_id, first_name, last_name, photo_url, gender, date_of_birth, location, state, education, profession, income, religion, community, height, marital_status, bio, verified")
      .eq("profile_complete", true)
      .eq("gender", oppositeGender)
      .neq("user_id", user.id)
      .limit(30);

    if (candidates) {
      if (candidates.length === 0) {
        setProfiles([]);
      } else {
        // Simple compatibility scoring
        const scored = candidates.map((c) => {
          let score = 65;
          if (myProfile?.religion && c.religion === myProfile.religion) score += 12;
          if (myProfile?.community && c.community === myProfile.community) score += 8;
          if (myProfile?.state && c.state === myProfile.state) score += 8;
          if (c.verified) score += 5;
          if (c.photo_url) score += 2;
          return { ...c, compatibility: Math.min(99, score) };
        });
        scored.sort((a, b) => b.compatibility - a.compatibility);
        setProfiles(scored);
      }
    } else {
      setProfiles([]);
    }
    setCurrentIndex(0);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  const handleSwipeRight = async () => {
    const profile = profiles[currentIndex];
    if (!profile || !user) return;

    // Send interest
    const { error } = await supabase.from("interests").insert({
      sender_id: user.id,
      receiver_id: profile.user_id,
    });

    if (!error) {
      toast.success(`Interest sent to ${profile.first_name}! 💕`);
    } else if (error.message.includes("duplicate") || error.code === "23505") {
      toast(`Already sent interest to ${profile.first_name}`);
    } else {
      toast.error("Could not send interest");
    }

    setStats((s) => ({ ...s, liked: s.liked + 1 }));
    setCurrentIndex((i) => i + 1);
  };

  const handleSwipeLeft = () => {
    const profile = profiles[currentIndex];
    if (profile) {
      setSkippedIds((s) => new Set(s).add(profile.user_id));
    }
    setStats((s) => ({ ...s, skipped: s.skipped + 1 }));
    setCurrentIndex((i) => i + 1);
  };

  const handleUndo = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setStats((s) => ({ ...s, skipped: Math.max(0, s.skipped - 1) }));
    }
  };

  const currentProfile = profiles[currentIndex];
  const nextProfile = profiles[currentIndex + 1];
  const isFinished = currentIndex >= profiles.length;

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <Heart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold mb-2">Sign in to Discover</h2>
            <p className="text-muted-foreground mb-4">Create an account to start swiping</p>
            <Button variant="hero" onClick={() => navigate("/auth")}>Get Started</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-8 max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-accent" /> Discover
            </h1>
            <p className="text-sm text-muted-foreground">Swipe right to connect, left to skip</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="text-center">
              <p className="text-lg font-bold text-green-600">{stats.liked}</p>
              <p className="text-[10px] text-muted-foreground">Liked</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-red-400">{stats.skipped}</p>
              <p className="text-[10px] text-muted-foreground">Skipped</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground animate-pulse">Finding your perfect matches...</p>
          </div>
        ) : !profiles.length && currentIndex === 0 ? (
          <div className="text-center py-20 bg-card rounded-3xl border border-border shadow-card px-6">
            <Sparkles className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="font-display text-xl font-bold mb-2">Complete Your Profile</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
              Our AI needs your details to find compatible matches. Let's finish your profile first!
            </p>
            <Button variant="hero" onClick={() => navigate("/create-profile")} className="w-full gap-2">
              <Sparkles className="w-4 h-4" /> Complete Now
            </Button>
          </div>
        ) : isFinished ? (
          <div className="text-center py-20 bg-card rounded-3xl border border-border shadow-card">
            <Heart className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="font-display text-xl font-bold mb-2">You've seen everyone!</h3>
            <p className="text-muted-foreground text-sm mb-6">
              {stats.liked > 0 ? `You liked ${stats.liked} profiles today!` : "Check back later for new profiles."}
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={fetchProfiles} className="gap-2">
                <RotateCcw className="w-4 h-4" /> Start Over
              </Button>
              <Button variant="hero" onClick={() => navigate("/interests")} className="gap-2">
                <Heart className="w-4 h-4" /> View Interests
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Card Stack */}
            <div className="relative w-full aspect-[3/4] mb-6">
              <AnimatePresence>
                {nextProfile && (
                  <SwipeCard
                    key={nextProfile.user_id + "-bg"}
                    profile={nextProfile}
                    onSwipeLeft={() => {}}
                    onSwipeRight={() => {}}
                    isTop={false}
                  />
                )}
                {currentProfile && (
                  <SwipeCard
                    key={currentProfile.user_id}
                    profile={currentProfile}
                    onSwipeLeft={handleSwipeLeft}
                    onSwipeRight={handleSwipeRight}
                    isTop={true}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handleUndo}
                disabled={currentIndex === 0}
                className="w-12 h-12 rounded-full bg-card border-2 border-border flex items-center justify-center text-muted-foreground hover:border-yellow-400 hover:text-yellow-500 transition-all disabled:opacity-30 shadow-md"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button
                onClick={handleSwipeLeft}
                className="w-16 h-16 rounded-full bg-card border-2 border-border flex items-center justify-center text-red-400 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shadow-lg"
              >
                <X className="w-7 h-7" />
              </button>
              <button
                onClick={handleSwipeRight}
                className="w-16 h-16 rounded-full bg-card border-2 border-border flex items-center justify-center text-green-500 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all shadow-lg"
              >
                <Heart className="w-7 h-7" />
              </button>
              <button
                onClick={() => currentProfile && navigate(`/profile/${currentProfile.user_id}`)}
                className="w-12 h-12 rounded-full bg-card border-2 border-border flex items-center justify-center text-primary hover:border-primary transition-all shadow-md"
              >
                <Eye className="w-5 h-5" />
              </button>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-4">
              {profiles.length - currentIndex} profiles remaining
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Discover;
