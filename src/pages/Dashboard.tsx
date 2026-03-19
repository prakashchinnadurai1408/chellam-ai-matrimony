import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMembership } from "@/hooks/useMembership";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw, Crown, Heart, Eye, MessageCircle, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const { user } = useAuth();
  const { membership, isPremiumOrAbove } = useMembership(user?.id);
  const navigate = useNavigate();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ interests: 0, shortlisted: 0, views: 0 });

  const fetchMatches = useCallback(async () => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("daily_matches")
      .select("*")
      .eq("user_id", user.id)
      .eq("match_date", today)
      .order("compatibility_score", { ascending: false });

    if (!data || data.length === 0) {
      // Generate matches
      await generateMatches();
      return;
    }

    // Enrich with profiles
    const enriched = [];
    for (const m of data) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, photo_url, location, profession, education, date_of_birth, community, religion, user_id")
        .eq("user_id", m.match_user_id)
        .single();
      if (profile) enriched.push({ ...m, profile });
    }
    setMatches(enriched);
    setLoading(false);
  }, [user]);

  const generateMatches = async () => {
    if (!user) return;
    setRefreshing(true);

    // Get user's profile and preferences
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const { data: myPrefs } = await supabase
      .from("partner_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Get potential matches (opposite gender, exclude self)
    const oppositeGender = myProfile?.gender === "Male" ? "Female" : "Male";
    const { data: candidates } = await supabase
      .from("profiles")
      .select("*")
      .eq("gender", oppositeGender)
      .eq("profile_complete", true)
      .neq("user_id", user.id)
      .limit(50);

    if (!candidates || candidates.length === 0) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    // Score each candidate
    const scored = candidates.map((c) => {
      let score = 50; // base
      const reasons: string[] = [];

      // Age match
      if (c.date_of_birth && myPrefs) {
        const age = Math.floor((Date.now() - new Date(c.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        if ((!myPrefs.min_age || age >= myPrefs.min_age) && (!myPrefs.max_age || age <= myPrefs.max_age)) {
          score += 15;
          reasons.push("Age match");
        }
      }

      // Religion match
      if (myPrefs?.preferred_religion && c.religion === myPrefs.preferred_religion) {
        score += 15;
        reasons.push("Same religion");
      }

      // Community match
      if (myPrefs?.preferred_communities?.includes(c.community)) {
        score += 10;
        reasons.push("Community match");
      }

      // Education match
      if (myPrefs?.preferred_education?.includes(c.education)) {
        score += 10;
        reasons.push("Education match");
      }

      // Location match
      if (myPrefs?.preferred_locations?.includes(c.location) || myProfile?.state === c.state) {
        score += 10;
        reasons.push("Location match");
      }

      // Profile completeness bonus
      if (c.photo_url) { score += 5; reasons.push("Has photo"); }
      if (c.verified) { score += 5; reasons.push("Verified"); }

      return { candidate: c, score: Math.min(score, 99), reasons };
    });

    // Sort and take top 10
    scored.sort((a, b) => b.score - a.score);
    const top10 = scored.slice(0, 10);

    // Delete old matches for today and insert new
    const today = new Date().toISOString().split("T")[0];
    await supabase.from("daily_matches").delete().eq("user_id", user.id).eq("match_date", today);

    for (const m of top10) {
      await supabase.from("daily_matches").insert({
        user_id: user.id,
        match_user_id: m.candidate.user_id,
        compatibility_score: m.score,
        match_reasons: m.reasons,
        match_date: today,
      });
    }

    setRefreshing(false);
    fetchMatches();
  };

  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const { count: interestCount } = await supabase
        .from("interests")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("status", "pending");
      const { count: shortCount } = await supabase
        .from("shortlists")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      const { count: viewCount } = await supabase
        .from("profile_views")
        .select("*", { count: "exact", head: true })
        .eq("viewed_id", user.id);
      setStats({ interests: interestCount || 0, shortlisted: shortCount || 0, views: viewCount || 0 });
    };
    fetchStats();
  }, [user]);

  const getAge = (dob: string) => {
    if (!dob) return null;
    return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-4xl">
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/interests")}>
            <CardContent className="py-4 text-center">
              <Heart className="w-5 h-5 mx-auto text-primary mb-1" />
              <p className="text-2xl font-bold text-foreground">{stats.interests}</p>
              <p className="text-xs text-muted-foreground">Pending Interests</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/interests")}>
            <CardContent className="py-4 text-center">
              <Heart className="w-5 h-5 mx-auto text-secondary mb-1" />
              <p className="text-2xl font-bold text-foreground">{stats.shortlisted}</p>
              <p className="text-xs text-muted-foreground">Shortlisted</p>
            </CardContent>
          </Card>
          <Card className={`${!isPremiumOrAbove ? "opacity-60" : "cursor-pointer hover:shadow-md"} transition-shadow`}>
            <CardContent className="py-4 text-center">
              <Eye className="w-5 h-5 mx-auto text-accent mb-1" />
              <p className="text-2xl font-bold text-foreground">{isPremiumOrAbove ? stats.views : <Lock className="w-4 h-4 inline" />}</p>
              <p className="text-xs text-muted-foreground">Profile Views</p>
              {!isPremiumOrAbove && <p className="text-[10px] text-primary mt-0.5">Premium only</p>}
            </CardContent>
          </Card>
        </div>

        {/* Membership banner */}
        {membership.tier === "free" && (
          <Card className="mb-6 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
            <CardContent className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="w-6 h-6 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Upgrade to Premium</p>
                  <p className="text-xs text-muted-foreground">Unlock contact details, messaging & AI scores</p>
                </div>
              </div>
              <Button size="sm" onClick={() => navigate("/membership")}>Upgrade</Button>
            </CardContent>
          </Card>
        )}

        {/* Daily Matches */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            <h2 className="font-display text-xl font-bold text-foreground">Today's Top Matches</h2>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={generateMatches} disabled={refreshing}>
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {loading || refreshing ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : matches.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Sparkles className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No matches found yet. Complete your profile and preferences to get AI-curated matches!</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate("/preferences")}>Set Preferences</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {matches.map((m, i) => (
              <Card key={m.id} className="hover:shadow-md transition-all cursor-pointer" onClick={() => navigate(`/profile/${m.profile.user_id}`)}>
                <CardContent className="py-4 flex items-center gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-muted overflow-hidden shrink-0">
                      {m.profile.photo_url ? (
                        <img src={m.profile.photo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground font-semibold">
                          {m.profile.first_name?.[0] || "?"}
                        </div>
                      )}
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-card border-2 border-border flex items-center justify-center text-[10px] font-bold text-foreground">
                      #{i + 1}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {[m.profile.first_name, m.profile.last_name].filter(Boolean).join(" ")}
                      {m.profile.date_of_birth && <span className="text-muted-foreground font-normal">, {getAge(m.profile.date_of_birth)}</span>}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {[m.profile.profession, m.profile.location].filter(Boolean).join(" · ")}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(isPremiumOrAbove ? (m.match_reasons as string[] || []) : (m.match_reasons as string[] || []).slice(0, 2)).map((r: string) => (
                        <Badge key={r} variant="secondary" className="text-[9px] px-1.5 py-0">{r}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="text-center shrink-0">
                    {isPremiumOrAbove ? (
                      <>
                        <div className="text-xl font-bold text-primary">{m.compatibility_score}%</div>
                        <p className="text-[10px] text-muted-foreground">Match</p>
                      </>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Lock className="w-4 h-4 text-muted-foreground" />
                        <p className="text-[10px] text-muted-foreground mt-0.5">Premium</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
