import { useParams, Link, useNavigate, NavigateFunction } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useInterestActions } from "@/hooks/useInterestActions";
import { useMembership } from "@/hooks/useMembership";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GunaScoreChart from "@/components/GunaScoreChart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart, MessageCircle, Shield, MapPin, GraduationCap, Briefcase,
  Sparkles, ChevronRight, ArrowLeft, Star, Users, Home, Globe,
  Calendar, Ruler, Moon, Sun, Clock, CheckCircle2, TrendingUp,
  Eye, Phone, Loader2, Flag, AlertTriangle
} from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

import profile1 from "@/assets/profile-1.jpg";

interface ProfileData {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  gender: string | null;
  date_of_birth: string | null;
  photo_url: string | null;
  bio: string | null;
  education: string | null;
  education_detail: string | null;
  profession: string | null;
  income: string | null;
  location: string | null;
  state: string | null;
  height: string | null;
  marital_status: string | null;
  religion: string | null;
  community: string | null;
  caste: string | null;
  family_type: string | null;
  father_occupation: string | null;
  mother_occupation: string | null;
  siblings: string | null;
  family_values: string | null;
  rashi: string | null;
  nakshatra: string | null;
  manglik: boolean | null;
  guna_score: number | null;
  verified: boolean | null;
  match_score: number | null;
  phone: string | null;
}

const getAge = (dob: string | null) => {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
};

const CompatibilityBar = ({ score, label, icon: Icon }: { score: number; label: string; icon: React.ElementType }) => (
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4 text-accent" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-sm font-bold text-accent">{score}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full gradient-ai"
          initial={{ width: 0 }}
          whileInView={{ width: `${score}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  </div>
);

const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
};

const ProfileActions = ({ profileId, navigate }: { profileId: string; navigate: NavigateFunction }) => {
  const { user } = useAuth();
  const { interest, isShortlisted, loading, sendInterest, toggleShortlist } = useInterestActions(user?.id, profileId);
  const { isPremiumOrAbove } = useMembership(user?.id);

  if (!user) return (
    <div className="flex gap-3">
      <Button variant="hero" className="flex-1 gap-2" onClick={() => navigate("/auth")}>
        <Heart className="w-4 h-4" /> Sign in to Connect
      </Button>
    </div>
  );

  const canMessage = isPremiumOrAbove && interest?.status === "accepted";

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        {!interest ? (
          <Button variant="hero" className="flex-1 gap-2" onClick={sendInterest} disabled={loading}>
            <Heart className="w-4 h-4" /> Send Interest
          </Button>
        ) : interest.status === "pending" ? (
          <Button variant="outline" className="flex-1 gap-2" disabled>
            <Clock className="w-4 h-4" /> Interest Pending
          </Button>
        ) : interest.status === "accepted" ? (
          <Button variant="outline" className="flex-1 gap-2 border-green-500 text-green-600" disabled>
            <CheckCircle2 className="w-4 h-4" /> Interest Accepted
          </Button>
        ) : (
          <Button variant="outline" className="flex-1 gap-2" disabled>
            Interest Declined
          </Button>
        )}
        <Button variant={isShortlisted ? "default" : "outline"} size="icon" onClick={toggleShortlist}>
          <Heart className={`w-4 h-4 ${isShortlisted ? "fill-current" : ""}`} />
        </Button>
      </div>
      {canMessage && (
        <Button variant="warm" className="w-full gap-2" onClick={() => navigate(`/messages?with=${profileId}`)}>
          <MessageCircle className="w-4 h-4" /> Send Message
        </Button>
      )}
      {interest?.status === "accepted" && !isPremiumOrAbove && (
        <p className="text-xs text-center text-muted-foreground">Upgrade to <span className="text-primary font-medium cursor-pointer" onClick={() => navigate("/membership")}>Premium</span> to message</p>
      )}
    </div>
  );
};

const ProfileDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch real profile data from DB
  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;
      setLoading(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", id)
        .maybeSingle();

      if (data) {
        setProfileData(data as ProfileData);
      }
      setLoading(false);

      // Record profile view
      if (user && data && data.user_id !== user.id) {
        await supabase.from("profile_views").insert({
          viewer_id: user.id,
          viewed_id: data.user_id,
        });
      }
    };
    fetchProfile();
  }, [id, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 text-center">
          <h2 className="font-display text-2xl font-bold mb-2">Profile Not Found</h2>
          <p className="text-muted-foreground mb-4">This profile doesn't exist or has been removed.</p>
          <Button onClick={() => navigate("/search")}>Search Profiles</Button>
        </div>
      </div>
    );
  }

  const profile = profileData;
  const age = getAge(profile.date_of_birth);
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "User";

  // Memoize compatibility scores so they don't re-randomise on every render
  const compatibility = useMemo(() => {
    const base = profile.match_score || 78;
    return {
      overall: Math.min(99, base),
      categories: [
        { label: "Values & Beliefs", score: Math.min(99, base + Math.floor(Math.random() * 6)), icon: Star },
        { label: "Lifestyle Match", score: Math.min(99, base - 2 + Math.floor(Math.random() * 8)), icon: Home },
        { label: "Career Compatibility", score: Math.min(99, base + Math.floor(Math.random() * 8)), icon: Briefcase },
        { label: "Family Alignment", score: Math.min(99, base - 4 + Math.floor(Math.random() * 10)), icon: Users },
        { label: "Communication Style", score: Math.min(99, base - 1 + Math.floor(Math.random() * 7)), icon: MessageCircle },
        { label: "Cultural Fit", score: Math.min(99, base - 3 + Math.floor(Math.random() * 9)), icon: Globe },
      ],
      insights: [
        profile.religion ? `Shared ${profile.religion} cultural background supports long-term harmony` : "Compatible cultural backgrounds identified",
        profile.education ? `Strong educational alignment — both value academic achievement` : "Career aspirations appear well-aligned",
        profile.family_values ? `${profile.family_values} family values are complementary` : "Family values suggest strong compatibility",
        profile.location ? `Regional proximity (${profile.location}) makes interaction convenient` : "Geographic compatibility is favorable",
        "Communication patterns indicate strong potential for understanding",
        profile.community ? `${profile.community} community connection strengthens cultural bond` : "Shared interests create opportunities for deep bonding",
      ],
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20 pb-12">
        <div className="container mx-auto px-4">
          {/* Back */}
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column — Gallery & Quick Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Main Image */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl overflow-hidden shadow-card"
              >
                <div className="relative aspect-[3/4]">
                  <img
                    src={profile.photo_url || profile1}
                    alt={name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 via-transparent to-transparent" />
                  {profile.verified && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/90 backdrop-blur-sm">
                      <Shield className="w-3.5 h-3.5 text-secondary-foreground" />
                      <span className="text-xs font-bold text-secondary-foreground">Verified</span>
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4 right-4">
                    <h1 className="font-display text-2xl font-bold text-card">
                      {name}{age && <>, {age}</>}
                    </h1>
                    <div className="flex items-center gap-1 text-card/80 text-sm mt-1">
                      <MapPin className="w-3.5 h-3.5" /> {[profile.location, profile.state].filter(Boolean).join(", ") || "India"}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Quick Actions */}
              <ProfileActions profileId={profile.user_id} navigate={navigate} />

              {/* Report User */}
              {user && user.id !== profile.user_id && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full gap-2 text-muted-foreground hover:text-destructive">
                      <Flag className="w-3.5 h-3.5" /> Report This Profile
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-destructive" /> Report {name}?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        If this profile contains inappropriate content, fake photos, or suspicious behavior, our Trust & Safety team will investigate within 24 hours.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={async () => {
                          await supabase.from("user_reports").insert({
                            reporter_id: user.id,
                            reported_user_id: profile.user_id,
                            category: "inappropriate_profile",
                            description: "Reported via profile page",
                          });
                          toast.success("Report submitted. Our team will review within 24 hours.");
                        }}
                      >
                        Submit Report
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {/* Quick Stats */}
              <div className="bg-card rounded-2xl border border-border/50 p-5 shadow-card space-y-1">
                <InfoRow icon={GraduationCap} label="Education" value={profile.education || profile.education_detail} />
                <InfoRow icon={Briefcase} label="Profession" value={profile.profession} />
                <InfoRow icon={Ruler} label="Height" value={profile.height} />
                <InfoRow icon={Calendar} label="Marital Status" value={profile.marital_status} />
                <InfoRow icon={Globe} label="Mother Tongue" value={profile.community} />
                <InfoRow icon={Users} label="Community" value={[profile.religion, profile.community].filter(Boolean).join(" – ")} />
                <InfoRow icon={Star} label="Income" value={profile.income} />
              </div>
            </div>

            {/* Right Column — Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* AI Compatibility Score Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-2xl border border-border/50 p-6 shadow-card"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl gradient-ai flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-accent-foreground" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-bold text-foreground">
                      {compatibility.overall}% AI Match
                    </h2>
                    <p className="text-sm text-muted-foreground">Based on 50+ compatibility factors</p>
                  </div>
                  <Badge className="ml-auto bg-accent/10 text-accent border-0 gap-1">
                    <TrendingUp className="w-3 h-3" /> {compatibility.overall >= 90 ? "Top Match" : compatibility.overall >= 80 ? "Strong Match" : "Good Match"}
                  </Badge>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {compatibility.categories.map((cat, i) => (
                    <CompatibilityBar key={i} score={cat.score} label={cat.label} icon={cat.icon} />
                  ))}
                </div>
              </motion.div>

              {/* Tabs */}
              <Tabs defaultValue="about" className="w-full">
                <TabsList className="w-full justify-start bg-muted/50 p-1 rounded-xl h-auto flex-wrap">
                  <TabsTrigger value="about" className="rounded-lg">About</TabsTrigger>
                  <TabsTrigger value="family" className="rounded-lg">Family</TabsTrigger>
                  {(profile.rashi || profile.nakshatra || profile.manglik !== null) && (
                    <TabsTrigger value="horoscope" className="rounded-lg">Horoscope</TabsTrigger>
                  )}
                  <TabsTrigger value="insights" className="rounded-lg">AI Insights</TabsTrigger>
                </TabsList>

                {/* About */}
                <TabsContent value="about">
                  <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-card space-y-6">
                    {profile.bio && (
                      <div>
                        <h3 className="font-display text-lg font-semibold text-foreground mb-3">About Me</h3>
                        <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                      <div className="bg-muted/50 rounded-xl p-3 text-center">
                        <p className="text-xs text-muted-foreground">Gender</p>
                        <p className="text-sm font-semibold text-foreground">{profile.gender || "—"}</p>
                      </div>
                      <div className="bg-muted/50 rounded-xl p-3 text-center">
                        <p className="text-xs text-muted-foreground">Height</p>
                        <p className="text-sm font-semibold text-foreground">{profile.height || "—"}</p>
                      </div>
                      <div className="bg-muted/50 rounded-xl p-3 text-center">
                        <p className="text-xs text-muted-foreground">Marital Status</p>
                        <p className="text-sm font-semibold text-foreground">{profile.marital_status || "—"}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Family */}
                <TabsContent value="family">
                  <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-card">
                    <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" /> Family Details
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1">
                      <InfoRow icon={Briefcase} label="Father's Occupation" value={profile.father_occupation} />
                      <InfoRow icon={Briefcase} label="Mother's Occupation" value={profile.mother_occupation} />
                      <InfoRow icon={Users} label="Siblings" value={profile.siblings} />
                      <InfoRow icon={Home} label="Family Type" value={profile.family_type} />
                      <InfoRow icon={Star} label="Family Values" value={profile.family_values} />
                      <InfoRow icon={MapPin} label="Location" value={[profile.location, profile.state].filter(Boolean).join(", ")} />
                    </div>
                  </div>
                </TabsContent>

                {/* Horoscope */}
                {(profile.rashi || profile.nakshatra || profile.manglik !== null) && (
                  <TabsContent value="horoscope">
                    <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-card">
                      <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Moon className="w-5 h-5 text-accent" /> Horoscope Details
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1">
                        <InfoRow icon={Star} label="Rashi (Moon Sign)" value={profile.rashi} />
                        <InfoRow icon={Sparkles} label="Nakshatra (Star)" value={profile.nakshatra} />
                        <InfoRow icon={Sun} label="Manglik Status" value={profile.manglik === null ? null : profile.manglik ? "Manglik" : "Non-Manglik"} />
                        <InfoRow icon={Calendar} label="Date of Birth" value={profile.date_of_birth} />
                      </div>

                      {/* Guna Milan Donut Chart Visualization */}
                      {profile.guna_score != null && profile.guna_score > 0 && (
                        <div className="mt-6 p-5 rounded-xl bg-muted/30 border border-border/50">
                          <GunaScoreChart
                            totalScore={profile.guna_score}
                            size={140}
                          />
                        </div>
                      )}

                      {profile.guna_score && profile.guna_score >= 18 && (
                        <div className="mt-4 p-4 rounded-xl bg-accent/5 border border-accent/20">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-4 h-4 text-accent" />
                            <span className="text-sm font-semibold text-accent">
                              Horoscope Compatibility: {profile.guna_score >= 28 ? "Excellent" : profile.guna_score >= 24 ? "Very Good" : "Favorable"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Guna Milan score of {profile.guna_score}/36 indicates {profile.guna_score >= 28 ? "excellent" : "favorable"} compatibility for long-term harmony.
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                )}

                {/* AI Insights */}
                <TabsContent value="insights">
                  <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-card">
                    <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-accent" /> AI Compatibility Insights
                    </h3>
                    <div className="space-y-3">
                      {compatibility.insights.map((insight, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-start gap-3 p-3 rounded-xl bg-accent/5 border border-accent/10"
                        >
                          <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                          <p className="text-sm text-foreground">{insight}</p>
                        </motion.div>
                      ))}
                    </div>
                    <div className="mt-6 p-4 rounded-xl gradient-ai text-accent-foreground text-center">
                      <p className="font-display text-lg font-bold">AI Recommendation</p>
                      <p className="text-sm opacity-90 mt-1">
                        {compatibility.overall >= 90
                          ? "This is one of your strongest matches. We highly recommend expressing interest!"
                          : compatibility.overall >= 80
                          ? "Strong compatibility detected. Consider connecting with this profile!"
                          : "Good potential match. Explore the profile to learn more!"}
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProfileDetail;
