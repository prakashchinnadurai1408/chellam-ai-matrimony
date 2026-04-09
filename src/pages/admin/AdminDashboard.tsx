import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users, MessageCircle, Heart, Shield, TrendingUp, UserCheck, AlertTriangle,
  Clock, CreditCard, IndianRupee, Bell, ArrowRight, RefreshCw,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";

type DateRange = "today" | "7d" | "30d";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>("7d");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState({
    totalUsers: 0,
    completeProfiles: 0,
    verifiedProfiles: 0,
    totalConversations: 0,
    totalMessages: 0,
    incompleteProfiles: 0,
    recentSignups: 0,
    pendingVerifications: 0,
    pendingPayments: 0,
    openReports: 0,
    activeSubscriptions: 0,
    revenueTotal: 0,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  const fetchStats = async () => {
    const rangeMs: Record<DateRange, number> = { today: 86400000, "7d": 7 * 86400000, "30d": 30 * 86400000 };
    const since = new Date(Date.now() - rangeMs[dateRange]).toISOString();
    const days = dateRange === "today" ? 1 : dateRange === "7d" ? 7 : 30;

    const [
      { count: totalUsers },
      { count: completeProfiles },
      { count: verifiedProfiles },
      { count: totalConversations },
      { count: totalMessages },
      { count: incompleteProfiles },
      { count: recentSignups },
      { count: pendingVerifications },
      { count: pendingPayments },
      { count: openReports },
      { count: activeSubscriptions },
      { data: recent },
      { data: payments },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("profile_complete", true),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("verified", true),
      supabase.from("conversations").select("*", { count: "exact", head: true }),
      supabase.from("messages").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("profile_complete", false),
      supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", since),
      supabase.from("profiles").select("*", { count: "exact", head: true })
        .eq("profile_complete", true).eq("verified", false),
      supabase.from("payment_requests").select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase.from("user_reports").select("*", { count: "exact", head: true })
        .eq("status", "open"),
      supabase.from("memberships").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(5),
      supabase.from("payment_requests").select("amount").eq("status", "approved"),
    ]);

    const revenueTotal = (payments || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    // Build chart data
    const buckets: { name: string; signups: number; messages: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      buckets.push({
        name: days <= 7
          ? d.toLocaleDateString("en-IN", { weekday: "short" })
          : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        signups: 0,
        messages: 0,
      });
    }

    setStats({
      totalUsers: totalUsers || 0,
      completeProfiles: completeProfiles || 0,
      verifiedProfiles: verifiedProfiles || 0,
      totalConversations: totalConversations || 0,
      totalMessages: totalMessages || 0,
      incompleteProfiles: incompleteProfiles || 0,
      recentSignups: recentSignups || 0,
      pendingVerifications: pendingVerifications || 0,
      pendingPayments: pendingPayments || 0,
      openReports: openReports || 0,
      activeSubscriptions: activeSubscriptions || 0,
      revenueTotal,
    });
    setRecentUsers(recent || []);
    setChartData(buckets);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchStats(); }, [dateRange]);

  const handleRefresh = () => { setRefreshing(true); fetchStats(); };

  const statCards = [
    { label: "Total Members", value: stats.totalUsers, icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: "Verified Profiles", value: stats.verifiedProfiles, icon: Shield, color: "text-green-600", bg: "bg-green-500/10" },
    { label: "Active Subscriptions", value: stats.activeSubscriptions, icon: CreditCard, color: "text-blue-600", bg: "bg-blue-500/10" },
    { label: "Total Revenue", value: `₹${(stats.revenueTotal / 100).toLocaleString("en-IN")}`, icon: IndianRupee, color: "text-emerald-600", bg: "bg-emerald-500/10", isString: true },
    { label: "Conversations", value: stats.totalConversations, icon: MessageCircle, color: "text-violet-600", bg: "bg-violet-500/10" },
    { label: "Messages Sent", value: stats.totalMessages, icon: Heart, color: "text-pink-600", bg: "bg-pink-500/10" },
    { label: `New Signups (${dateRange})`, value: stats.recentSignups, icon: TrendingUp, color: "text-accent", bg: "bg-accent/10" },
    { label: "Incomplete Profiles", value: stats.incompleteProfiles, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
  ];

  const pendingActions = [
    {
      label: "Profiles Awaiting Verification",
      count: stats.pendingVerifications,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-500/10",
      href: "/admin/verification",
    },
    {
      label: "Pending Payment Requests",
      count: stats.pendingPayments,
      icon: CreditCard,
      color: "text-blue-600",
      bg: "bg-blue-500/10",
      href: "/admin/payments",
    },
    {
      label: "Open User Reports",
      count: stats.openReports,
      icon: AlertTriangle,
      color: "text-destructive",
      bg: "bg-destructive/10",
      href: "/admin/moderation",
    },
  ];

  const ranges: { label: string; value: DateRange }[] = [
    { label: "Today", value: "today" },
    { label: "7 Days", value: "7d" },
    { label: "30 Days", value: "30d" },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Real-time platform overview</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border overflow-hidden">
              {ranges.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setDateRange(r.value)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    dateRange === r.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`w-3 h-3 mr-1 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Pending Action Alerts */}
        {!loading && (stats.pendingVerifications > 0 || stats.pendingPayments > 0 || stats.openReports > 0) && (
          <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Pending Actions Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {pendingActions.map((a) => a.count > 0 && (
                  <button
                    key={a.label}
                    onClick={() => navigate(a.href)}
                    className="flex items-center justify-between p-3 bg-background rounded-lg border border-border hover:border-primary/50 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg ${a.bg} flex items-center justify-center`}>
                        <a.icon className={`w-4 h-4 ${a.color}`} />
                      </div>
                      <div className="text-left">
                        <p className="text-xs text-muted-foreground">{a.label}</p>
                        <p className={`text-lg font-bold ${a.color}`}>{a.count}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{s.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {loading ? "—" : s.isString ? s.value : (s.value as number).toLocaleString()}
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-semibold">Signup Trend</CardTitle>
                <p className="text-xs text-muted-foreground">New registrations over time</p>
              </div>
              <TrendingUp className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="gSignups" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <Tooltip contentStyle={{
                      backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))",
                      borderRadius: "0.75rem", fontSize: "12px",
                    }} />
                    <Area type="monotone" dataKey="signups" stroke="hsl(var(--primary))"
                      strokeWidth={2} fillOpacity={1} fill="url(#gSignups)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-semibold">Profile Completion</CardTitle>
                <p className="text-xs text-muted-foreground">Complete vs incomplete vs verified</p>
              </div>
              <UserCheck className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: "Verified", count: stats.verifiedProfiles },
                    { name: "Complete", count: stats.completeProfiles - stats.verifiedProfiles },
                    { name: "Incomplete", count: stats.incompleteProfiles },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <Tooltip contentStyle={{
                      backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))",
                      borderRadius: "0.75rem", fontSize: "12px",
                    }} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Signups */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Recent Signups</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/users")}>
              View All <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
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
                        <p className="text-xs text-muted-foreground">{u.location || "No location"} · {u.phone || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {u.verified && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-700">Verified</span>
                      )}
                      {u.profile_complete ? (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700">Complete</span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">Incomplete</span>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString("en-IN")}
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
