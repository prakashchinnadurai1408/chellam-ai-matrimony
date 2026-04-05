import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMembership } from "@/hooks/useMembership";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Lock, Crown, Loader2, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface ProfileView {
  id: string;
  viewer_id: string;
  viewed_at: string;
  viewer_profile?: {
    first_name: string | null;
    last_name: string | null;
    photo_url: string | null;
    profession: string | null;
    location: string | null;
    user_id: string;
  };
}

const ProfileViews = () => {
  const { user } = useAuth();
  const { isPremiumOrAbove } = useMembership(user?.id);
  const navigate = useNavigate();
  const [views, setViews] = useState<ProfileView[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchViews = async () => {
      const { count } = await supabase
        .from("profile_views")
        .select("*", { count: "exact", head: true })
        .eq("viewed_id", user.id);
      setTotalCount(count || 0);

      if (isPremiumOrAbove) {
        const { data } = await supabase
          .from("profile_views")
          .select("*")
          .eq("viewed_id", user.id)
          .order("viewed_at", { ascending: false })
          .limit(50);

        if (data) {
          const enriched: ProfileView[] = [];
          for (const v of data) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("first_name, last_name, photo_url, profession, location, user_id")
              .eq("user_id", v.viewer_id)
              .single();
            enriched.push({ ...v, viewer_profile: profile || undefined });
          }
          setViews(enriched);
        }
      }
      setLoading(false);
    };
    fetchViews();
  }, [user, isPremiumOrAbove]);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return d.toLocaleDateString();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 text-center">
          <p className="text-muted-foreground">Sign in to see who viewed your profile</p>
          <Button className="mt-4" onClick={() => navigate("/auth")}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
              <Eye className="w-6 h-6 text-primary" /> Who Viewed You
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-semibold text-foreground">{totalCount}</span> people have viewed your profile
            </p>
          </div>
        </div>

        {!isPremiumOrAbove ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 border-primary/20">
              <CardContent className="py-12 text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <Lock className="w-10 h-10 text-primary" />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground mb-2">Premium Feature</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                  {totalCount > 0 
                    ? `${totalCount} people have viewed your profile! Upgrade to Premium to see who they are.`
                    : "Upgrade to Premium to see who views your profile and get more matches."
                  }
                </p>
                <Button variant="hero" className="gap-2" onClick={() => navigate("/membership")}>
                  <Crown className="w-4 h-4" /> Upgrade to Premium
                </Button>
              </CardContent>
            </Card>

            {/* Blurred preview */}
            <div className="mt-6 space-y-3 select-none">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="opacity-60 blur-sm pointer-events-none">
                  <CardContent className="py-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-muted rounded" />
                      <div className="h-3 w-48 bg-muted rounded" />
                    </div>
                    <div className="h-3 w-16 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        ) : loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : views.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Eye className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
              <h3 className="font-display text-lg font-semibold mb-2">No views yet</h3>
              <p className="text-sm text-muted-foreground">
                Complete your profile and add a photo to attract more views!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {views.map((v, i) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className="hover:shadow-md transition-all cursor-pointer"
                  onClick={() => v.viewer_profile && navigate(`/profile/${v.viewer_profile.user_id}`)}
                >
                  <CardContent className="py-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-muted overflow-hidden shrink-0">
                      {v.viewer_profile?.photo_url ? (
                        <img src={v.viewer_profile.photo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground font-semibold">
                          {v.viewer_profile?.first_name?.[0] || "?"}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {[v.viewer_profile?.first_name, v.viewer_profile?.last_name].filter(Boolean).join(" ") || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[v.viewer_profile?.profession, v.viewer_profile?.location].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                      <Clock className="w-3 h-3" />
                      {formatTime(v.viewed_at)}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileViews;
