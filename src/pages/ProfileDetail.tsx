import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate, NavigateFunction } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useInterestActions } from "@/hooks/useInterestActions";
import { useMembership } from "@/hooks/useMembership";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BlockButton, ReportDialog } from "@/components/BlockReportDialog";
import profile1 from "@/assets/profile-1.jpg";
import {
  Heart, MessageCircle, Shield, MapPin, GraduationCap, Briefcase,
  Sparkles, ArrowLeft, Star, Users, Home, Globe, Calendar, Ruler,
  Moon, Sun, Clock, CheckCircle2, TrendingUp, Eye, Phone,
} from "lucide-react";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type PreferenceRow = Database["public"]["Tables"]["partner_preferences"]["Row"];

const formatText = (text?: string | null) => text || "—";
const formatBoolean = (value?: boolean | null) => value === true ? "Yes" : value === false ? "No" : "—";

const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
  <div className="flex items-start gap-3 py-2">
    <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  </div>
);

const ProfileActions = ({ profile, navigate }: { profile: ProfileRow; navigate: NavigateFunction }) => {
  const { user } = useAuth();
  const { interest, isShortlisted, loading, sendInterest, toggleShortlist } = useInterestActions(user?.id, profile.user_id);
  const { isPremiumOrAbove } = useMembership(user?.id);

  if (!user) return (
    <div className="flex gap-3">
      <Button variant="hero" className="flex-1 gap-2" onClick={() => navigate("/auth")}> 
        <Heart className="w-4 h-4" /> Sign in to Connect
      </Button>
    </div>
  );

  if (user.id === profile.user_id) {
    return (
      <div className="rounded-3xl border border-border/70 bg-card p-5 text-sm text-muted-foreground">
        This is your own profile. Use the search page to discover other matches.
      </div>
    );
  }

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
        <Button variant="warm" className="w-full gap-2" onClick={() => navigate(`/messages?with=${profile.user_id}`)}>
          <MessageCircle className="w-4 h-4" /> Send Message
        </Button>
      )}
      {interest?.status === "accepted" && !isPremiumOrAbove && (
        <p className="text-xs text-center text-muted-foreground">Upgrade to <span className="text-primary font-medium cursor-pointer" onClick={() => navigate("/membership")}>Premium</span> to message.</p>
      )}
      <div className="flex gap-2 pt-1">
        <BlockButton targetUserId={profile.user_id} />
        <ReportDialog targetUserId={profile.user_id} />
      </div>
    </div>
  );
};

const ProfileDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremiumOrAbove } = useMembership(user?.id);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [preferences, setPreferences] = useState<PreferenceRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      setLoading(true);
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (profileError) {
        console.error(profileError);
        setNotFound(true);
        setLoading(false);
        return;
      }

      if (!profileData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile(profileData);

      const { data: prefData } = await supabase
        .from("partner_preferences")
        .select("*")
        .eq("user_id", profileData.user_id)
        .maybeSingle();
      setPreferences(prefData ?? null);

      if (user && user.id !== profileData.user_id) {
        await supabase.from("profile_views").insert({ viewer_id: user.id, viewed_id: profileData.id });
      }
      setLoading(false);
    };

    loadProfile();
  }, [id, user]);

  const age = useMemo(() => {
    if (!profile?.date_of_birth) return "—";
    const diff = Date.now() - new Date(profile.date_of_birth).getTime();
    const years = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
    return years > 0 ? `${years}` : "—";
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-sm text-muted-foreground">
        Loading profile…
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-xl w-full rounded-3xl border border-border/60 bg-card p-10 text-center shadow-card">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Profile not found</p>
          <h1 className="mt-4 text-3xl font-bold text-foreground">We couldn’t find that profile.</h1>
          <p className="mt-3 text-sm text-muted-foreground">It may have been removed or the link is invalid.</p>
          <div className="mt-8 flex justify-center">
            <Button variant="hero" onClick={() => navigate("/search")}>Back to Search</Button>
          </div>
        </div>
      </div>
    );
  }

  const imageUrl = profile.photo_url || profile1;
  const locationText = [profile.location, profile.state].filter(Boolean).join(", ") || "—";
  const verified = profile.verified ?? false;
  const score = profile.match_score ?? 0;
  const phoneValue = !user
    ? "Sign in to view"
    : isPremiumOrAbove
      ? formatText(profile.phone)
      : "Upgrade to Premium to view";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-12">
        <div className="container mx-auto px-4">
          <Link to="/search" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Search
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl overflow-hidden shadow-card">
                <div className="relative aspect-[3/4] bg-muted">
                  <img src={imageUrl} alt={formatText(profile.first_name)} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 via-transparent to-transparent" />
                  {verified && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/90 backdrop-blur-sm">
                      <Shield className="w-3.5 h-3.5 text-secondary-foreground" />
                      <span className="text-xs font-bold text-secondary-foreground">Verified</span>
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4 right-4">
                    <h1 className="font-display text-2xl font-bold text-card">{`${formatText(profile.first_name)} ${formatText(profile.last_name)}`}</h1>
                    <div className="flex flex-wrap items-center gap-2 text-card/80 text-sm mt-2">
                      <span>{age} yrs</span>
                      <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{locationText}</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              <ProfileActions profile={profile} navigate={navigate} />

              <div className="bg-card rounded-2xl border border-border/50 p-5 shadow-card space-y-1">
                <InfoRow icon={GraduationCap} label="Education" value={formatText(profile.education)} />
                <InfoRow icon={Briefcase} label="Profession" value={formatText(profile.profession)} />
                <InfoRow icon={Ruler} label="Height" value={formatText(profile.height)} />
                <InfoRow icon={Calendar} label="Marital Status" value={formatText(profile.marital_status)} />
                <InfoRow icon={Globe} label="Community" value={formatText(profile.community)} />
                <InfoRow icon={MapPin} label="Location" value={locationText} />
                <InfoRow icon={Phone} label="Phone" value={phoneValue} />
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-2xl border border-border/50 p-6 shadow-card">
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl gradient-ai flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-accent-foreground" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-bold text-foreground">{score}% Match Score</h2>
                    <p className="text-sm text-muted-foreground">Based on profile completeness and preferences</p>
                  </div>
                  <Badge className="ml-auto bg-accent/10 text-accent border-0 gap-1">
                    <TrendingUp className="w-3 h-3" /> {verified ? "Trusted" : "Member"}
                  </Badge>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-muted/50 p-4">
                    <p className="text-xs text-muted-foreground">Verified Profile</p>
                    <p className="text-lg font-semibold text-foreground">{verified ? "Yes" : "Pending"}</p>
                  </div>
                  <div className="rounded-2xl bg-muted/50 p-4">
                    <p className="text-xs text-muted-foreground">Ready for Matches</p>
                    <p className="text-lg font-semibold text-foreground">{profile.profile_complete ? "Yes" : "No"}</p>
                  </div>
                </div>
              </motion.div>

              <Tabs defaultValue="about" className="w-full">
                <TabsList className="w-full justify-start bg-muted/50 p-1 rounded-xl h-auto flex-wrap">
                  <TabsTrigger value="about" className="rounded-lg">About</TabsTrigger>
                  <TabsTrigger value="family" className="rounded-lg">Family</TabsTrigger>
                  <TabsTrigger value="horoscope" className="rounded-lg">Horoscope</TabsTrigger>
                  <TabsTrigger value="preferences" className="rounded-lg">Partner Preferences</TabsTrigger>
                </TabsList>

                <TabsContent value="about">
                  <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-card space-y-6">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground mb-3">About Me</h3>
                      <p className="text-muted-foreground leading-relaxed">{formatText(profile.bio)}</p>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <InfoRow icon={GraduationCap} label="Education" value={formatText(profile.education_detail || profile.education)} />
                      <InfoRow icon={Briefcase} label="Profession" value={formatText(profile.profession)} />
                      <InfoRow icon={Ruler} label="Height" value={formatText(profile.height)} />
                      <InfoRow icon={Calendar} label="Marital Status" value={formatText(profile.marital_status)} />
                      <InfoRow icon={Globe} label="Religion" value={formatText(profile.religion)} />
                      <InfoRow icon={Users} label="Community" value={formatText(profile.community)} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="family">
                  <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-card">
                    <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" /> Family Details
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1">
                      <InfoRow icon={Briefcase} label="Father's Occupation" value={formatText(profile.father_occupation)} />
                      <InfoRow icon={Briefcase} label="Mother's Occupation" value={formatText(profile.mother_occupation)} />
                      <InfoRow icon={Users} label="Siblings" value={formatText(profile.siblings)} />
                      <InfoRow icon={Home} label="Family Type" value={formatText(profile.family_type)} />
                      <InfoRow icon={Star} label="Family Values" value={formatText(profile.family_values)} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="horoscope">
                  <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-card">
                    <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Moon className="w-5 h-5 text-accent" /> Horoscope Details
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1">
                      <InfoRow icon={Star} label="Rashi" value={formatText(profile.rashi)} />
                      <InfoRow icon={Sparkles} label="Nakshatra" value={formatText(profile.nakshatra)} />
                      <InfoRow icon={Sun} label="Manglik" value={formatBoolean(profile.manglik)} />
                      <InfoRow icon={Shield} label="Guna Score" value={profile.guna_score !== null ? `${profile.guna_score}` : "—"} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="preferences">
                  <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-card space-y-4">
                    <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Eye className="w-5 h-5 text-primary" /> Partner Preferences
                    </h3>
                    {preferences ? (
                      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1">
                        <InfoRow icon={Calendar} label="Age Range" value={`${preferences.min_age ?? "Any"} - ${preferences.max_age ?? "Any"}`} />
                        <InfoRow icon={Ruler} label="Height Range" value={`${formatText(preferences.min_height)} - ${formatText(preferences.max_height)}`} />
                        <InfoRow icon={GraduationCap} label="Education" value={(preferences.preferred_education ?? []).join(", ") || "Any"} />
                        <InfoRow icon={Briefcase} label="Location" value={(preferences.preferred_locations ?? []).join(", ") || "Any"} />
                        <InfoRow icon={Users} label="Community" value={(preferences.preferred_communities ?? []).join(", ") || "Any"} />
                        <InfoRow icon={Star} label="Marital Status" value={formatText(preferences.preferred_marital_status)} />
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">This member has not shared partner preferences yet.</p>
                    )}
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
