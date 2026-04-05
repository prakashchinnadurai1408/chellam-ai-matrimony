import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageCircle, Heart, Shield, TrendingUp, UserCheck, AlertTriangle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CHART_DATA = [
  { name: 'Mon', signups: 45, matches: 12 },
  { name: 'Tue', signups: 52, matches: 19 },
  { name: 'Wed', signups: 38, matches: 15 },
  { name: 'Thu', signups: 65, matches: 28 },
  { name: 'Fri', signups: 48, matches: 22 },
  { name: 'Sat', signups: 59, matches: 34 },
  { name: 'Sun', signups: 72, matches: 41 },
];

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

        {/* Analytics Chart */}
        <div className="grid grid-cols-1 gap-6">
          <Card className="col-span-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-0.5">
                <CardTitle className="text-lg font-bold tracking-tight">Growth Analytics</CardTitle>
                <p className="text-xs text-muted-foreground">New signups vs Successful matches (Last 7 days)</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={CHART_DATA}>
                    <defs>
                      <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorMatches" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        borderColor: 'hsl(var(--border))', 
                        borderRadius: '0.75rem',
                        fontSize: '12px'
                      }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="signups" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorSignups)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="matches" 
                      stroke="hsl(var(--accent))" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorMatches)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
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
