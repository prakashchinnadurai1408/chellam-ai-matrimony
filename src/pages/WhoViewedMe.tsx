import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMembership } from "@/hooks/useMembership";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Lock, Crown, Loader2, UserX } from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface Viewer {
  id: string;
  viewer_id: string;
  viewed_at: string;
  profile?: {
    first_name: string | null;
    last_name: string | null;
    photo_url: string | null;
    location: string | null;
    profession: string | null;
    date_of_birth: string | null;
  };
}

const WhoViewedMe = () => {
  const { user, loading: authLoading } = useAuth();
  const { isPremiumOrAbove } = useMembership(user?.id);
  const navigate = useNavigate();
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }

    const fetchViewers = async () => {
      const { data } = await supabase
        .from("profile_views")
        .select("*")
        .eq("viewed_id", user.id)
        .order("viewed_at", { ascending: false })
        .limit(50);

      if (!data) { setLoading(false); return; }

      const enriched: Viewer[] = [];
      for (const v of data) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name, photo_url, location, profession, date_of_birth")
          .eq("user_id", v.viewer_id)
          .single();
        enriched.push({ ...v, profile: profile || undefined });
      }
      setViewers(enriched);
      setLoading(false);
    };
    fetchViewers();
  }, [user, authLoading, navigate]);

  const getAge = (dob: string | null) => {
    if (!dob) return null;
    return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Eye className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Who Viewed Me</h1>
            <p className="text-sm text-muted-foreground">
              {isPremiumOrAbove ? `${viewers.length} people viewed your profile` : "Upgrade to see who viewed you"}
            </p>
          </div>
        </div>

        {!isPremiumOrAbove && (
          <Card className="mb-6 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
            <CardContent className="py-6 text-center space-y-3">
              <Lock className="w-8 h-8 text-primary mx-auto" />
              <h3 className="font-display text-lg font-semibold text-foreground">Premium Feature</h3>
              <p className="text-sm text-muted-foreground">
                Upgrade to Premium to see who viewed your profile, when they viewed, and connect with them.
              </p>
              <Button variant="hero" className="gap-2" onClick={() => navigate("/membership")}>
                <Crown className="w-4 h-4" /> Upgrade to Premium
              </Button>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : viewers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <UserX className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No one has viewed your profile yet. Complete your profile to get more visibility!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {viewers.map((v, i) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className={`hover:shadow-md transition-all ${isPremiumOrAbove ? "cursor-pointer" : ""}`}
                  onClick={() => isPremiumOrAbove && navigate(`/profile/${v.viewer_id}`)}
                >
                  <CardContent className="py-3 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-muted overflow-hidden shrink-0">
                      {isPremiumOrAbove && v.profile?.photo_url ? (
                        <img src={v.profile.photo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center text-muted-foreground font-semibold ${!isPremiumOrAbove ? "blur-sm" : ""}`}>
                          {v.profile?.first_name?.[0] || "?"}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {isPremiumOrAbove ? (
                        <>
                          <p className="text-sm font-semibold text-foreground truncate">
                            {[v.profile?.first_name, v.profile?.last_name].filter(Boolean).join(" ") || "User"}
                            {v.profile?.date_of_birth && <span className="text-muted-foreground font-normal">, {getAge(v.profile.date_of_birth)}</span>}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {[v.profile?.profession, v.profile?.location].filter(Boolean).join(" · ") || "No details"}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-foreground blur-sm">Hidden Name</p>
                          <p className="text-xs text-muted-foreground blur-sm">Hidden details</p>
                        </>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(v.viewed_at), { addSuffix: true })}
                      </p>
                      {!isPremiumOrAbove && <Lock className="w-3.5 h-3.5 text-muted-foreground ml-auto mt-1" />}
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

export default WhoViewedMe;
