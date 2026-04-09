import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Download, TrendingUp, Users, IndianRupee, Shield, RefreshCw } from "lucide-react";

type ReportTab = "members" | "revenue" | "engagement" | "safety";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--secondary))", "#f59e0b", "#8b5cf6"];

const AdminReports = () => {
  const [tab, setTab] = useState<ReportTab>("members");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Member report data
  const [memberStats, setMemberStats] = useState({
    total: 0, complete: 0, verified: 0, male: 0, female: 0,
    signupsByDay: [] as { date: string; count: number }[],
    locationDist: [] as { name: string; value: number }[],
  });

  // Revenue data
  const [revenueStats, setRevenueStats] = useState({
    total: 0, approved: 0, pending: 0, rejected: 0,
    byTier: [] as { name: string; value: number; count: number }[],
    recentPayments: [] as any[],
  });

  // Engagement data
  const [engagementStats, setEngagementStats] = useState({
    conversations: 0, messages: 0, interests: 0, acceptedInterests: 0,
    profileViews: 0, shortlists: 0,
  });

  // Safety data
  const [safetyStats, setSafetyStats] = useState({
    userReports: 0, openReports: 0, resolvedReports: 0,
    moderationActions: 0, suspendedUsers: 0, blockedUsers: 0,
    fraudFlags: 0,
    reportsByCategory: [] as { name: string; value: number }[],
  });

  const fetchAll = async () => {
    setLoading(true);

    await Promise.all([fetchMemberData(), fetchRevenueData(), fetchEngagementData(), fetchSafetyData()]);

    setLoading(false);
    setRefreshing(false);
  };

  const fetchMemberData = async () => {
    const [
      { count: total },
      { count: complete },
      { count: verified },
      { count: male },
      { count: female },
      { data: recent30 },
      { data: locations },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("profile_complete", true),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("verified", true),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("gender", "Male"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("gender", "Female"),
      supabase.from("profiles").select("created_at").gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()).order("created_at"),
      supabase.from("profiles").select("location").not("location", "is", null).limit(500),
    ]);

    // Build daily signups
    const buckets: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      buckets[d.toISOString().split("T")[0]] = 0;
    }
    (recent30 || []).forEach((r: any) => {
      const day = r.created_at?.split("T")[0];
      if (day && buckets[day] !== undefined) buckets[day]++;
    });
    const signupsByDay = Object.entries(buckets).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      count,
    }));

    // Location distribution
    const locCount: Record<string, number> = {};
    (locations || []).forEach((r: any) => { if (r.location) locCount[r.location] = (locCount[r.location] || 0) + 1; });
    const locationDist = Object.entries(locCount)
      .sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([name, value]) => ({ name, value }));

    setMemberStats({ total: total || 0, complete: complete || 0, verified: verified || 0, male: male || 0, female: female || 0, signupsByDay, locationDist });
  };

  const fetchRevenueData = async () => {
    const { data: payments } = await supabase.from("payment_requests").select("amount,status,tier,created_at").order("created_at", { ascending: false });
    if (!payments) return;

    const approved = payments.filter((p: any) => p.status === "approved");
    const pending = payments.filter((p: any) => p.status === "pending");
    const rejected = payments.filter((p: any) => p.status === "rejected");

    const total = approved.reduce((s: number, p: any) => s + (p.amount || 0), 0);

    const tierMap: Record<string, { value: number; count: number }> = {};
    approved.forEach((p: any) => {
      if (!tierMap[p.tier]) tierMap[p.tier] = { value: 0, count: 0 };
      tierMap[p.tier].value += p.amount || 0;
      tierMap[p.tier].count++;
    });
    const byTier = Object.entries(tierMap).map(([name, d]) => ({ name, ...d }));

    setRevenueStats({ total, approved: approved.length, pending: pending.length, rejected: rejected.length, byTier, recentPayments: payments.slice(0, 10) });
  };

  const fetchEngagementData = async () => {
    const [
      { count: conversations },
      { count: messages },
      { count: interests },
      { count: acceptedInterests },
      { count: profileViews },
      { count: shortlists },
    ] = await Promise.all([
      supabase.from("conversations").select("*", { count: "exact", head: true }),
      supabase.from("messages").select("*", { count: "exact", head: true }),
      supabase.from("interests").select("*", { count: "exact", head: true }),
      supabase.from("interests").select("*", { count: "exact", head: true }).eq("status", "accepted"),
      supabase.from("profile_views").select("*", { count: "exact", head: true }),
      supabase.from("shortlists").select("*", { count: "exact", head: true }),
    ]);
    setEngagementStats({
      conversations: conversations || 0, messages: messages || 0,
      interests: interests || 0, acceptedInterests: acceptedInterests || 0,
      profileViews: profileViews || 0, shortlists: shortlists || 0,
    });
  };

  const fetchSafetyData = async () => {
    const [
      { count: userReports },
      { count: openReports },
      { count: resolvedReports },
      { count: moderationActions },
      { count: suspendedUsers },
      { count: blockedUsers },
      { count: fraudFlags },
      { data: reportData },
    ] = await Promise.all([
      supabase.from("user_reports" as any).select("*", { count: "exact", head: true }),
      supabase.from("user_reports" as any).select("*", { count: "exact", head: true }).eq("status", "open"),
      supabase.from("user_reports" as any).select("*", { count: "exact", head: true }).eq("status", "resolved"),
      supabase.from("moderation_actions" as any).select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("status" as any, "suspended"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("status" as any, "blocked"),
      supabase.from("ai_fraud_flags" as any).select("*", { count: "exact", head: true }).eq("is_resolved", false),
      supabase.from("user_reports" as any).select("category").limit(200),
    ]);

    const catCount: Record<string, number> = {};
    (reportData || []).forEach((r: any) => { catCount[r.category] = (catCount[r.category] || 0) + 1; });
    const reportsByCategory = Object.entries(catCount).map(([name, value]) => ({ name, value }));

    setSafetyStats({
      userReports: userReports || 0, openReports: openReports || 0, resolvedReports: resolvedReports || 0,
      moderationActions: moderationActions || 0, suspendedUsers: suspendedUsers || 0, blockedUsers: blockedUsers || 0,
      fraudFlags: fraudFlags || 0, reportsByCategory,
    });
  };

  useEffect(() => { fetchAll(); }, []);

  const exportReport = () => {
    let data: string[][] = [];
    if (tab === "members") {
      data = [["Date", "Signups"], ...memberStats.signupsByDay.map(d => [d.date, String(d.count)])];
    } else if (tab === "revenue") {
      data = [["Tier", "Revenue (paise)", "Count"], ...revenueStats.byTier.map(t => [t.name, String(t.value), String(t.count)])];
    }
    if (!data.length) { alert("No exportable data for this report."); return; }
    const csv = data.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${tab}-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const tabs: { label: string; value: ReportTab; icon: any }[] = [
    { label: "Members", value: "members", icon: Users },
    { label: "Revenue", value: "revenue", icon: IndianRupee },
    { label: "Engagement", value: "engagement", icon: TrendingUp },
    { label: "Safety", value: "safety", icon: Shield },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Reports & Analytics</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Business intelligence across all platform modules</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => { setRefreshing(true); fetchAll(); }} disabled={refreshing}>
              <RefreshCw className={`w-3 h-3 mr-1 ${refreshing ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportReport}>
              <Download className="w-3 h-3 mr-1" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {tabs.map(t => (
            <button key={t.value} onClick={() => setTab(t.value)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.value ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-40 rounded-xl bg-muted/50 animate-pulse" />)}
          </div>
        ) : (
          <>
            {/* MEMBERS TAB */}
            {tab === "members" && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {[
                    { label: "Total Members", value: memberStats.total },
                    { label: "Complete Profiles", value: memberStats.complete },
                    { label: "Verified", value: memberStats.verified },
                    { label: "Male", value: memberStats.male },
                    { label: "Female", value: memberStats.female },
                  ].map(s => (
                    <Card key={s.label}><CardContent className="p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</p>
                      <p className="text-2xl font-bold mt-1">{s.value.toLocaleString()}</p>
                    </CardContent></Card>
                  ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Daily Signups (Last 30 Days)</CardTitle></CardHeader>
                    <CardContent>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={memberStats.signupsByDay}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} interval={4} />
                            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "0.75rem", fontSize: "12px" }} />
                            <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Signups" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Top Locations</CardTitle></CardHeader>
                    <CardContent>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={memberStats.locationDist} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                            <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={80} />
                            <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "0.75rem", fontSize: "12px" }} />
                            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Members" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <Card>
                  <CardHeader><CardTitle className="text-sm">Profile Completion Breakdown</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={[
                            { name: "Verified", value: memberStats.verified },
                            { name: "Complete (Unverified)", value: Math.max(0, memberStats.complete - memberStats.verified) },
                            { name: "Incomplete", value: Math.max(0, memberStats.total - memberStats.complete) },
                          ]} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                            {COLORS.map((color, i) => <Cell key={i} fill={color} />)}
                          </Pie>
                          <Legend />
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* REVENUE TAB */}
            {tab === "revenue" && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Total Revenue", value: `₹${(revenueStats.total / 100).toLocaleString("en-IN")}` },
                    { label: "Approved Payments", value: revenueStats.approved },
                    { label: "Pending Payments", value: revenueStats.pending },
                    { label: "Rejected", value: revenueStats.rejected },
                  ].map(s => (
                    <Card key={s.label}><CardContent className="p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</p>
                      <p className="text-2xl font-bold mt-1">{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</p>
                    </CardContent></Card>
                  ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Revenue by Plan Tier</CardTitle></CardHeader>
                    <CardContent>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={revenueStats.byTier.map(t => ({ ...t, revenue: t.value / 100 }))}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                            <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString("en-IN")}`} contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "0.75rem", fontSize: "12px" }} />
                            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Revenue (₹)" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Recent Transactions</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {revenueStats.recentPayments.map((p: any) => (
                          <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                            <div>
                              <p className="text-xs font-medium capitalize">{p.tier} · {p.plan_type}</p>
                              <p className="text-[10px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString("en-IN")}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">₹{((p.amount || 0) / 100).toLocaleString("en-IN")}</p>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${p.status === "approved" ? "bg-green-500/10 text-green-700" : p.status === "pending" ? "bg-amber-500/10 text-amber-700" : "bg-destructive/10 text-destructive"}`}>
                                {p.status}
                              </span>
                            </div>
                          </div>
                        ))}
                        {revenueStats.recentPayments.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No transactions yet.</p>}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* ENGAGEMENT TAB */}
            {tab === "engagement" && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { label: "Conversations", value: engagementStats.conversations },
                    { label: "Messages", value: engagementStats.messages },
                    { label: "Interests Sent", value: engagementStats.interests },
                    { label: "Interests Accepted", value: engagementStats.acceptedInterests },
                    { label: "Profile Views", value: engagementStats.profileViews },
                    { label: "Shortlists", value: engagementStats.shortlists },
                  ].map(s => (
                    <Card key={s.label}><CardContent className="p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</p>
                      <p className="text-2xl font-bold mt-1">{s.value.toLocaleString()}</p>
                    </CardContent></Card>
                  ))}
                </div>
                <Card>
                  <CardHeader><CardTitle className="text-sm">Engagement Overview</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: "Profile Views", value: engagementStats.profileViews },
                          { name: "Shortlists", value: engagementStats.shortlists },
                          { name: "Interests Sent", value: engagementStats.interests },
                          { name: "Interests Accepted", value: engagementStats.acceptedInterests },
                          { name: "Conversations", value: engagementStats.conversations },
                          { name: "Messages", value: engagementStats.messages },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "0.75rem", fontSize: "12px" }} />
                          <Bar dataKey="value" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm">Interest Conversion Rate</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-primary">
                          {engagementStats.interests > 0 ? ((engagementStats.acceptedInterests / engagementStats.interests) * 100).toFixed(1) : 0}%
                        </p>
                        <p className="text-xs text-muted-foreground">Acceptance Rate</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-accent">
                          {engagementStats.conversations > 0 && engagementStats.interests > 0
                            ? ((engagementStats.conversations / engagementStats.interests) * 100).toFixed(1) : 0}%
                        </p>
                        <p className="text-xs text-muted-foreground">Interest → Conversation</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* SAFETY TAB */}
            {tab === "safety" && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Total Reports", value: safetyStats.userReports, color: "text-foreground" },
                    { label: "Open Reports", value: safetyStats.openReports, color: "text-amber-600" },
                    { label: "Resolved", value: safetyStats.resolvedReports, color: "text-green-600" },
                    { label: "Fraud Flags", value: safetyStats.fraudFlags, color: "text-destructive" },
                    { label: "Moderation Actions", value: safetyStats.moderationActions, color: "text-primary" },
                    { label: "Suspended Accounts", value: safetyStats.suspendedUsers, color: "text-amber-600" },
                    { label: "Blocked Accounts", value: safetyStats.blockedUsers, color: "text-destructive" },
                  ].map(s => (
                    <Card key={s.label}><CardContent className="p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</p>
                      <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value.toLocaleString()}</p>
                    </CardContent></Card>
                  ))}
                </div>
                {safetyStats.reportsByCategory.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Reports by Category</CardTitle></CardHeader>
                    <CardContent>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={safetyStats.reportsByCategory} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                              {safetyStats.reportsByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminReports;
