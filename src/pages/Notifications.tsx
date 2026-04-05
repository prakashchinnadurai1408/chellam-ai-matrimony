import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell, Heart, MessageCircle, Eye, Sparkles, Check, CheckCheck,
  Loader2, Trash2, Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type NotifType = "interest_received" | "interest_accepted" | "interest_declined" | "new_message" | "profile_view" | "daily_matches";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
}

const NOTIF_ICONS: Record<NotifType, any> = {
  interest_received: Heart,
  interest_accepted: CheckCheck,
  interest_declined: Heart,
  new_message: MessageCircle,
  profile_view: Eye,
  daily_matches: Sparkles,
};

const NOTIF_COLORS: Record<NotifType, string> = {
  interest_received: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
  interest_accepted: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  interest_declined: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  new_message: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  profile_view: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  daily_matches: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
};

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const generateNotifications = useCallback(async () => {
    if (!user) return;
    const notifs: Notification[] = [];

    // Fetch recent interests received
    const { data: interests } = await supabase
      .from("interests")
      .select("*")
      .eq("receiver_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (interests) {
      for (const interest of interests) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("user_id", interest.sender_id)
          .single();

        const name = profile ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") : "Someone";

        if (interest.status === "pending") {
          notifs.push({
            id: `int-${interest.id}`,
            type: "interest_received",
            title: "New Interest Received",
            message: `${name} has sent you an interest request`,
            link: "/interests",
            read: false,
            created_at: interest.created_at,
          });
        }
      }
    }

    // Fetch interests sent that were accepted/declined
    const { data: sentInterests } = await supabase
      .from("interests")
      .select("*")
      .eq("sender_id", user.id)
      .in("status", ["accepted", "declined"])
      .order("updated_at", { ascending: false })
      .limit(10);

    if (sentInterests) {
      for (const interest of sentInterests) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("user_id", interest.receiver_id)
          .single();

        const name = profile ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") : "Someone";

        notifs.push({
          id: `int-resp-${interest.id}`,
          type: interest.status === "accepted" ? "interest_accepted" : "interest_declined",
          title: interest.status === "accepted" ? "Interest Accepted! 🎉" : "Interest Declined",
          message: interest.status === "accepted"
            ? `${name} accepted your interest! You can now message them.`
            : `${name} declined your interest.`,
          link: interest.status === "accepted" ? `/messages?with=${interest.receiver_id}` : "/interests",
          read: true,
          created_at: interest.updated_at,
        });
      }
    }

    // Profile views
    const { data: views } = await supabase
      .from("profile_views")
      .select("*")
      .eq("viewed_id", user.id)
      .order("viewed_at", { ascending: false })
      .limit(5);

    if (views && views.length > 0) {
      notifs.push({
        id: `views-${views[0].id}`,
        type: "profile_view",
        title: "Profile Views",
        message: `${views.length} people viewed your profile recently`,
        link: "/profile-views",
        read: true,
        created_at: views[0].viewed_at,
      });
    }

    // Daily matches
    const today = new Date().toISOString().split("T")[0];
    const { count: matchCount } = await supabase
      .from("daily_matches")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("match_date", today);

    if (matchCount && matchCount > 0) {
      notifs.push({
        id: `matches-${today}`,
        type: "daily_matches",
        title: "Daily Matches Ready! ✨",
        message: `You have ${matchCount} AI-curated matches waiting for you today`,
        link: "/dashboard",
        read: true,
        created_at: new Date().toISOString(),
      });
    }

    // Sort by date
    notifs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setNotifications(notifs);
    setLoading(false);
  }, [user]);

  useEffect(() => { generateNotifications(); }, [generateNotifications]);

  // Realtime updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notifications-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "interests" }, () => {
        generateNotifications();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "profile_views" }, () => {
        generateNotifications();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, generateNotifications]);

  const markAllRead = () => {
    setNotifications((n) => n.map((x) => ({ ...x, read: true })));
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return d.toLocaleDateString();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const allNotifs = notifications;
  const unreadNotifs = notifications.filter((n) => !n.read);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 text-center">
          <Bell className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold mb-2">Sign in to view notifications</h2>
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
              <Bell className="w-6 h-6 text-primary" /> Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">{unreadCount}</Badge>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Stay updated on your matches and interests</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1.5 text-xs">
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </Button>
          )}
        </div>

        <Tabs defaultValue="all">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="all" className="flex-1">All ({allNotifs.length})</TabsTrigger>
            <TabsTrigger value="unread" className="flex-1">
              Unread {unreadCount > 0 && <Badge variant="destructive" className="ml-1.5 text-[9px] px-1.5">{unreadCount}</Badge>}
            </TabsTrigger>
          </TabsList>

          {[
            { key: "all", items: allNotifs },
            { key: "unread", items: unreadNotifs },
          ].map(({ key, items }) => (
            <TabsContent key={key} value={key}>
              {loading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : items.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Bell className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                    <h3 className="font-display text-lg font-semibold mb-2">
                      {key === "unread" ? "All caught up!" : "No notifications yet"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {key === "unread" ? "You've read all your notifications." : "Notifications will appear here when you receive interests, messages, and more."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence>
                    {items.map((notif, i) => {
                      const Icon = NOTIF_ICONS[notif.type];
                      const colorClass = NOTIF_COLORS[notif.type];
                      return (
                        <motion.div
                          key={notif.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                        >
                          <Card
                            className={`hover:shadow-md transition-all cursor-pointer ${!notif.read ? "border-primary/30 bg-primary/[0.02]" : ""}`}
                            onClick={() => {
                              setNotifications((n) => n.map((x) => x.id === notif.id ? { ...x, read: true } : x));
                              if (notif.link) navigate(notif.link);
                            }}
                          >
                            <CardContent className="py-4 flex items-start gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold text-foreground">{notif.title}</p>
                                  {!notif.read && (
                                    <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                              </div>
                              <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTime(notif.created_at)}
                              </span>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default Notifications;
