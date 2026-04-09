import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Users, Calendar, TrendingUp, Search, Plus, X, Loader2, IndianRupee } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PLANS = [
  { key: "free", label: "Free", price: 0, duration: "Unlimited", contacts: 5, messages: 5, ai: false, highlight: false, color: "bg-muted" },
  { key: "silver", label: "Silver", price: 1999, duration: "3 Months", contacts: 25, messages: 20, ai: false, highlight: false, color: "bg-slate-100 dark:bg-slate-800" },
  { key: "gold", label: "Gold", price: 3999, duration: "6 Months", contacts: 75, messages: 999, ai: true, highlight: false, color: "bg-yellow-50 dark:bg-yellow-900/20" },
  { key: "premium", label: "Platinum", price: 6999, duration: "12 Months", contacts: 150, messages: 999, ai: true, highlight: true, color: "bg-primary/5" },
  { key: "concierge", label: "Diamond/Concierge", price: 11999, duration: "12 Months", contacts: 999, messages: 999, ai: true, highlight: false, color: "bg-violet-50 dark:bg-violet-900/20" },
];

interface Membership {
  id: string;
  user_id: string;
  tier: string;
  plan_type: string;
  started_at: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

interface MembershipWithProfile extends Membership {
  profile?: { first_name: string | null; last_name: string | null; phone: string | null };
}

const AdminSubscriptions = () => {
  const { toast } = useToast();
  const [memberships, setMemberships] = useState<MembershipWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ total: 0, active: 0, expiringSoon: 0, revenue: 0 });

  // Manual override modal
  const [overrideModal, setOverrideModal] = useState(false);
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [overrideForm, setOverrideForm] = useState({ phone: "", tier: "premium", plan_type: "monthly", months: "1" });
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);
  const [resolvingUser, setResolvingUser] = useState(false);

  const fetchMemberships = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("memberships")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!data) { setLoading(false); return; }

    // Enrich with profile names
    const userIds = [...new Set(data.map((m: any) => m.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id,first_name,last_name,phone")
      .in("user_id", userIds);

    const profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p]));
    const enriched: MembershipWithProfile[] = data.map((m: any) => ({ ...m, profile: profileMap[m.user_id] }));

    // Stats
    const now = new Date();
    const soon = new Date(now.getTime() + 30 * 86400000);
    const active = enriched.filter(m => m.is_active);
    const expiringSoon = active.filter(m => m.expires_at && new Date(m.expires_at) <= soon && new Date(m.expires_at) > now);

    // Revenue from payment_requests
    const { data: payments } = await supabase.from("payment_requests").select("amount").eq("status", "approved");
    const revenue = (payments || []).reduce((s: number, p: any) => s + (p.amount || 0), 0);

    setStats({ total: data.length, active: active.length, expiringSoon: expiringSoon.length, revenue });
    setMemberships(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchMemberships(); }, []);

  const filtered = memberships.filter(m => {
    if (!search) return true;
    const name = [m.profile?.first_name, m.profile?.last_name].filter(Boolean).join(" ").toLowerCase();
    return name.includes(search.toLowerCase()) || (m.profile?.phone || "").includes(search);
  });

  const resolveUserByPhone = async (phone: string) => {
    if (!phone) return;
    setResolvingUser(true);
    const { data } = await supabase.from("profiles").select("user_id,first_name,last_name").eq("phone", phone).maybeSingle();
    if (data) setResolvedUserId(data.user_id);
    else { toast({ title: "User not found", variant: "destructive" }); setResolvedUserId(null); }
    setResolvingUser(false);
  };

  const applyOverride = async () => {
    if (!resolvedUserId) { toast({ title: "Resolve a user first", variant: "destructive" }); return; }
    setOverrideLoading(true);

    const months = parseInt(overrideForm.months) || 1;
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    // Deactivate existing active subscriptions
    await supabase.from("memberships").update({ is_active: false }).eq("user_id", resolvedUserId).eq("is_active", true);

    // Insert new subscription
    const { error } = await supabase.from("memberships").insert({
      user_id: resolvedUserId,
      tier: overrideForm.tier as any,
      plan_type: overrideForm.plan_type,
      started_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      is_active: true,
    });

    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Subscription Applied", description: `${overrideForm.tier} plan activated for ${months} month(s).` }); setOverrideModal(false); fetchMemberships(); }
    setOverrideLoading(false);
  };

  const tierBadge = (tier: string) => {
    const map: Record<string, string> = {
      free: "bg-muted text-muted-foreground",
      premium: "bg-primary/10 text-primary",
      concierge: "bg-violet-500/10 text-violet-700",
    };
    return `text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${map[tier] || "bg-muted text-muted-foreground"}`;
  };

  const isExpired = (m: MembershipWithProfile) => m.expires_at && new Date(m.expires_at) < new Date();

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Subscription Management</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage membership plans and member subscriptions</p>
          </div>
          <Button onClick={() => { setOverrideModal(true); setResolvedUserId(null); setOverrideForm({ phone: "", tier: "premium", plan_type: "monthly", months: "1" }); }}>
            <Plus className="w-4 h-4 mr-1.5" /> Manual Override
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Subscriptions", value: stats.total, icon: CreditCard, color: "text-primary" },
            { label: "Active", value: stats.active, icon: Users, color: "text-green-600" },
            { label: "Expiring in 30d", value: stats.expiringSoon, icon: Calendar, color: "text-amber-600" },
            { label: "Total Revenue", value: `₹${(stats.revenue / 100).toLocaleString("en-IN")}`, icon: IndianRupee, color: "text-emerald-600", isString: true },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</p>
                    <p className="text-xl font-bold text-foreground mt-1">
                      {loading ? "—" : s.isString ? s.value : (s.value as number).toLocaleString()}
                    </p>
                  </div>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Plan Cards */}
        <Card>
          <CardHeader><CardTitle className="text-base">Membership Plans</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {PLANS.map(plan => (
                <div key={plan.key} className={`rounded-xl border p-4 space-y-2 ${plan.highlight ? "border-primary shadow-sm" : "border-border"} ${plan.color}`}>
                  {plan.highlight && <span className="text-[10px] font-bold text-primary uppercase tracking-wide">Most Popular</span>}
                  <p className="font-bold text-foreground">{plan.label}</p>
                  <p className="text-xl font-bold text-foreground">
                    {plan.price === 0 ? "Free" : `₹${plan.price.toLocaleString("en-IN")}`}
                    {plan.price > 0 && <span className="text-xs text-muted-foreground font-normal"> / {plan.duration}</span>}
                  </p>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>{plan.contacts === 999 ? "Unlimited" : plan.contacts} contact views</li>
                    <li>{plan.messages === 999 ? "Unlimited" : plan.messages} msg/day</li>
                    <li>{plan.ai ? "✓ AI Matches" : "✗ AI Matches"}</li>
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Memberships */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search member…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {["Member", "Plan", "Type", "Started", "Expires", "Status"].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No subscriptions found.</td></tr>
                  ) : filtered.map(m => {
                    const name = [m.profile?.first_name, m.profile?.last_name].filter(Boolean).join(" ") || "Unknown";
                    const expired = isExpired(m);
                    return (
                      <tr key={m.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{name}</p>
                          <p className="text-xs text-muted-foreground">{m.profile?.phone || "—"}</p>
                        </td>
                        <td className="px-4 py-3"><span className={tierBadge(m.tier)}>{m.tier}</span></td>
                        <td className="px-4 py-3 text-muted-foreground capitalize">{m.plan_type}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(m.started_at).toLocaleDateString("en-IN")}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {m.expires_at ? new Date(m.expires_at).toLocaleDateString("en-IN") : "Never"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${!m.is_active || expired ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-700"}`}>
                            {!m.is_active ? "Inactive" : expired ? "Expired" : "Active"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Manual Override Modal */}
        {overrideModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-md shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Manual Subscription Override</h3>
                <button onClick={() => setOverrideModal(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Member Phone</Label>
                  <div className="flex gap-2">
                    <Input placeholder="10-digit phone" value={overrideForm.phone}
                      onChange={e => setOverrideForm(f => ({ ...f, phone: e.target.value }))} />
                    <Button variant="outline" onClick={() => resolveUserByPhone(overrideForm.phone)} disabled={resolvingUser}>
                      {resolvingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : "Find"}
                    </Button>
                  </div>
                  {resolvedUserId && <p className="text-xs text-green-600">✓ User found</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Plan Tier</Label>
                  <select value={overrideForm.tier} onChange={e => setOverrideForm(f => ({ ...f, tier: e.target.value }))}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="free">Free</option>
                    <option value="premium">Premium / Platinum</option>
                    <option value="concierge">Concierge / Diamond</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Duration (months)</Label>
                  <Input type="number" min="1" max="24" value={overrideForm.months}
                    onChange={e => setOverrideForm(f => ({ ...f, months: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setOverrideModal(false)}>Cancel</Button>
                <Button className="flex-1" onClick={applyOverride} disabled={overrideLoading || !resolvedUserId}>
                  {overrideLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply Subscription"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSubscriptions;
