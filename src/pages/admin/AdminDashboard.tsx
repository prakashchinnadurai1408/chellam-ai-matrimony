import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageCircle, Heart, Shield, TrendingUp, UserCheck, AlertTriangle } from "lucide-react";

interface Stats {
  totalUsers: number;
  completeProfiles: number;
  verifiedProfiles: number;
  totalConversations: number;
  totalMessages: number;
  incompleteProfiles: number;
  recentSignups: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0, completeProfiles: 0, verifiedProfiles: 0,
    totalConversations: 0, totalMessages: 0, incompleteProfiles: 0, recentSignups: 0,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [
        { count: totalUsers },
        { count: completeProfiles },
        { count: verifiedProfiles },
        { count: totalConversations },
        { count: totalMessages },
        { count: incompleteProfiles },
        { data: recent },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("profile_complete", true),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("verified", true),
        supabase.from("conversations").select("*", { count: "exact", head: true }),
        supabase.from("messages").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("profile_complete", false),
        supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(5),
      ]);

      // Count signups in last 7 days
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const { count: recentSignups } = await supabase
        .from("profiles").select("*", { count: "exact", head: true })
        .gte("created_at", weekAgo);

      setStats({
        totalUsers: totalUsers || 0,
        completeProfiles: completeProfiles || 0,
        verifiedProfiles: verifiedProfiles || 0,
        totalConversations: totalConversations || 0,
        totalMessages: totalMessages || 0,
        incompleteProfiles: incompleteProfiles || 0,
        recentSignups: recentSignups || 0,
      });
      setRecentUsers(recent || []);
      setLoading(false);
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-primary" },
    { label: "Complete Profiles", value: stats.completeProfiles, icon: UserCheck, color: "text-accent" },
    { label: "Verified Profiles", value: stats.verifiedProfiles, icon: Shield, color: "text-secondary" },
    { label: "Conversations", value: stats.totalConversations, icon: MessageCircle, color: "text-primary" },
    { label: "Messages Sent", value: stats.totalMessages, icon: Heart, color: "text-accent" },
    { label: "Signups (7d)", value: stats.recentSignups, icon: TrendingUp, color: "text-secondary" },
    { label: "Incomplete Profiles", value: stats.incompleteProfiles, icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Platform overview and analytics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{s.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {loading ? "—" : s.value.toLocaleString()}
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${s.color}`}>
                    <s.icon className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Signups</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : recentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No users yet.</p>
            ) : (
              <div className="space-y-3">
                {recentUsers.map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                        {(u.first_name?.[0] || "U").toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {[u.first_name, u.last_name].filter(Boolean).join(" ") || "Unnamed"}
                        </p>
                        <p className="text-xs text-muted-foreground">{u.location || "No location"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {u.verified && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary/10 text-secondary">Verified</span>
                      )}
                      {u.profile_complete ? (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent">Complete</span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">Incomplete</span>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
