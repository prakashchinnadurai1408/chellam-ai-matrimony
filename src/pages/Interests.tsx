import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, HeartOff, Check, X, Clock, Send, Inbox, Bookmark } from "lucide-react";
import { toast } from "sonner";

const Interests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sent, setSent] = useState<any[]>([]);
  const [received, setReceived] = useState<any[]>([]);
  const [shortlisted, setShortlisted] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);

    // Sent interests
    const { data: sentData } = await supabase
      .from("interests")
      .select("*")
      .eq("sender_id", user.id)
      .order("created_at", { ascending: false });

    // Received interests
    const { data: recvData } = await supabase
      .from("interests")
      .select("*")
      .eq("receiver_id", user.id)
      .order("created_at", { ascending: false });

    // Shortlisted
    const { data: shortData } = await supabase
      .from("shortlists")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Enrich all with profile data
    const enrich = async (items: any[], userIdKey: string) => {
      const enriched = [];
      for (const item of items || []) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name, photo_url, location, profession, user_id")
          .eq("user_id", item[userIdKey])
          .single();
        enriched.push({ ...item, profile });
      }
      return enriched;
    };

    const [enrichedSent, enrichedRecv, enrichedShort] = await Promise.all([
      enrich(sentData || [], "receiver_id"),
      enrich(recvData || [], "sender_id"),
      enrich(shortData || [], "profile_id"),
    ]);

    setSent(enrichedSent);
    setReceived(enrichedRecv);
    setShortlisted(enrichedShort);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [user]);

  // Realtime for interests
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel("interests-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "interests" }, () => { fetchAll(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "shortlists" }, () => { fetchAll(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleAccept = async (id: string) => {
    await supabase.from("interests").update({ status: "accepted", updated_at: new Date().toISOString() }).eq("id", id);
    toast.success("Interest accepted!");
  };

  const handleDecline = async (id: string) => {
    await supabase.from("interests").update({ status: "declined", updated_at: new Date().toISOString() }).eq("id", id);
    toast.success("Interest declined");
  };

  const handleWithdraw = async (id: string) => {
    await supabase.from("interests").delete().eq("id", id);
    toast.success("Interest withdrawn");
    fetchAll();
  };

  const handleRemoveShortlist = async (id: string) => {
    await supabase.from("shortlists").delete().eq("id", id);
    toast.success("Removed from shortlist");
    fetchAll();
  };

  const statusIcon = (s: string) => {
    if (s === "accepted") return <Badge variant="default" className="text-[10px] bg-green-600 gap-1"><Check className="w-2.5 h-2.5" />Accepted</Badge>;
    if (s === "declined") return <Badge variant="destructive" className="text-[10px] gap-1"><X className="w-2.5 h-2.5" />Declined</Badge>;
    return <Badge variant="secondary" className="text-[10px] gap-1"><Clock className="w-2.5 h-2.5" />Pending</Badge>;
  };

  const ProfileCard = ({ profile, children }: { profile: any; children?: React.ReactNode }) => (
    <div className="flex items-center gap-3 py-3 border-b border-border/30 last:border-0">
      <div
        className="w-12 h-12 rounded-full bg-muted overflow-hidden cursor-pointer shrink-0"
        onClick={() => profile?.user_id && navigate(`/profile/${profile.user_id}`)}
      >
        {profile?.photo_url ? (
          <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm font-semibold">
            {profile?.first_name?.[0] || "?"}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate cursor-pointer hover:text-primary" onClick={() => profile?.user_id && navigate(`/profile/${profile.user_id}`)}>
          {[profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Unknown"}
        </p>
        <p className="text-xs text-muted-foreground truncate">{[profile?.profession, profile?.location].filter(Boolean).join(" · ") || "—"}</p>
      </div>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-2xl">
        <h1 className="font-display text-2xl font-bold text-foreground mb-6">Interests & Shortlist</h1>

        <Tabs defaultValue="received">
          <TabsList className="w-full">
            <TabsTrigger value="received" className="flex-1 gap-1.5"><Inbox className="w-3.5 h-3.5" />Received {received.filter(r => r.status === "pending").length > 0 && <Badge variant="destructive" className="text-[9px] ml-1">{received.filter(r => r.status === "pending").length}</Badge>}</TabsTrigger>
            <TabsTrigger value="sent" className="flex-1 gap-1.5"><Send className="w-3.5 h-3.5" />Sent</TabsTrigger>
            <TabsTrigger value="shortlist" className="flex-1 gap-1.5"><Bookmark className="w-3.5 h-3.5" />Shortlist</TabsTrigger>
          </TabsList>

          <TabsContent value="received">
            <Card>
              <CardContent className="pt-4">
                {loading ? <p className="text-sm text-muted-foreground py-4">Loading…</p> : received.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No interests received yet</p>
                ) : received.map((r) => (
                  <ProfileCard key={r.id} profile={r.profile}>
                    <div className="flex items-center gap-2 shrink-0">
                      {statusIcon(r.status)}
                      {r.status === "pending" && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => handleAccept(r.id)}><Check className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDecline(r.id)}><X className="w-4 h-4" /></Button>
                        </>
                      )}
                    </div>
                  </ProfileCard>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sent">
            <Card>
              <CardContent className="pt-4">
                {loading ? <p className="text-sm text-muted-foreground py-4">Loading…</p> : sent.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No interests sent yet</p>
                ) : sent.map((r) => (
                  <ProfileCard key={r.id} profile={r.profile}>
                    <div className="flex items-center gap-2 shrink-0">
                      {statusIcon(r.status)}
                      {r.status === "pending" && (
                        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => handleWithdraw(r.id)}>Withdraw</Button>
                      )}
                    </div>
                  </ProfileCard>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shortlist">
            <Card>
              <CardContent className="pt-4">
                {loading ? <p className="text-sm text-muted-foreground py-4">Loading…</p> : shortlisted.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No profiles shortlisted yet</p>
                ) : shortlisted.map((r) => (
                  <ProfileCard key={r.id} profile={r.profile}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveShortlist(r.id)}>
                      <HeartOff className="w-4 h-4" />
                    </Button>
                  </ProfileCard>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Interests;
