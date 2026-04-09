import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Search, ChevronLeft, ChevronRight, Shield, ShieldOff,
  UserX, Download, Eye, Edit, Loader2, X, CheckSquare, Square,
  Ban, RotateCcw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PAGE_SIZE = 20;
type StatusFilter = "all" | "active" | "suspended" | "blocked";

interface Profile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  gender: string | null;
  location: string | null;
  verified: boolean | null;
  profile_complete: boolean | null;
  status: string | null;
  created_at: string;
  religion: string | null;
  education: string | null;
  profession: string | null;
}

const statusBadge = (status: string | null) => {
  const s = status || "active";
  const map: Record<string, string> = {
    active: "bg-green-500/10 text-green-700",
    suspended: "bg-amber-500/10 text-amber-700",
    blocked: "bg-destructive/10 text-destructive",
  };
  return `text-[10px] font-medium px-2 py-0.5 rounded-full ${map[s] || map.active}`;
};

const AdminUsers = () => {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [completionFilter, setCompletionFilter] = useState<"all" | "complete" | "incomplete">("all");
  const [verifiedFilter, setVerifiedFilter] = useState<"all" | "verified" | "unverified">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [statusModal, setStatusModal] = useState<{
    open: boolean; userId: string | null; name: string; action: "suspend" | "block" | "activate";
  }>({ open: false, userId: null, name: "", action: "suspend" });
  const [statusReason, setStatusReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [editModal, setEditModal] = useState<{ open: boolean; profile: Profile | null }>({ open: false, profile: null });
  const [editForm, setEditForm] = useState({ first_name: "", last_name: "", phone: "", gender: "", location: "", religion: "", education: "", profession: "" });
  const [editLoading, setEditLoading] = useState(false);

  const fetchProfiles = async () => {
    setLoading(true);
    let query = supabase
      .from("profiles")
      .select("id,user_id,first_name,last_name,phone,gender,location,verified,profile_complete,status,created_at,religion,education,profession" as any, { count: "exact" });

    if (search) query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%,location.ilike.%${search}%`);
    if (statusFilter === "active") query = query.or("status.eq.active,status.is.null");
    else if (statusFilter !== "all") query = (query as any).eq("status", statusFilter);
    if (completionFilter !== "all") query = query.eq("profile_complete", completionFilter === "complete");
    if (verifiedFilter !== "all") query = query.eq("verified", verifiedFilter === "verified");

    const from = (page - 1) * PAGE_SIZE;
    const { data, count, error } = await query.order("created_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);
    if (!error) { setProfiles((data as unknown as Profile[]) || []); setTotal(count || 0); }
    setLoading(false);
  };

  useEffect(() => { setPage(1); }, [search, statusFilter, completionFilter, verifiedFilter]);
  useEffect(() => { fetchProfiles(); }, [page, search, statusFilter, completionFilter, verifiedFilter]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const toggleVerify = async (profile: Profile) => {
    const newVal = !profile.verified;
    const { error } = await supabase.from("profiles").update({ verified: newVal }).eq("user_id", profile.user_id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: newVal ? "Profile Verified" : "Verification Removed" });
    fetchProfiles();
  };

  const openStatusModal = (profile: Profile, action: "suspend" | "block" | "activate") => {
    setStatusModal({ open: true, userId: profile.user_id, name: [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.phone || "User", action });
    setStatusReason("");
  };

  const applyStatusAction = async () => {
    if (!statusModal.userId) return;
    if (statusModal.action !== "activate" && !statusReason.trim()) { toast({ title: "Reason required", variant: "destructive" }); return; }
    setActionLoading(true);
    const newStatus = statusModal.action === "activate" ? "active" : statusModal.action === "suspend" ? "suspended" : "blocked";
    const { error } = await supabase.from("profiles").update({
      status: newStatus, status_reason: statusReason || null, status_updated_at: new Date().toISOString(),
    } as any).eq("user_id", statusModal.userId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: `Account ${newStatus}` }); setStatusModal({ open: false, userId: null, name: "", action: "suspend" }); }
    setActionLoading(false);
    fetchProfiles();
  };

  const openEditModal = (profile: Profile) => {
    setEditForm({ first_name: profile.first_name || "", last_name: profile.last_name || "", phone: profile.phone || "", gender: profile.gender || "", location: profile.location || "", religion: profile.religion || "", education: profile.education || "", profession: profile.profession || "" });
    setEditModal({ open: true, profile });
  };

  const saveEdit = async () => {
    if (!editModal.profile) return;
    setEditLoading(true);
    const { error } = await supabase.from("profiles").update(editForm).eq("user_id", editModal.profile.user_id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Profile Updated" }); setEditModal({ open: false, profile: null }); fetchProfiles(); }
    setEditLoading(false);
  };

  const exportCSV = () => {
    const rows = [
      ["Name", "Phone", "Gender", "Location", "Verified", "Complete", "Status", "Joined"],
      ...profiles.map(p => [
        [p.first_name, p.last_name].filter(Boolean).join(" ") || "—",
        p.phone || "—", p.gender || "—", p.location || "—",
        p.verified ? "Yes" : "No", p.profile_complete ? "Yes" : "No",
        p.status || "active", new Date(p.created_at).toLocaleDateString("en-IN"),
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `members-${new Date().toISOString().split("T")[0]}.csv`; a.click();
  };

  const bulkVerify = async (value: boolean) => {
    if (selected.size === 0) return;
    const { error } = await supabase.from("profiles").update({ verified: value }).in("user_id", [...selected]);
    if (!error) { toast({ title: `${selected.size} profiles ${value ? "verified" : "unverified"}` }); setSelected(new Set()); fetchProfiles(); }
  };

  const toggleSelectAll = () => {
    if (selected.size === profiles.length) setSelected(new Set());
    else setSelected(new Set(profiles.map(p => p.user_id)));
  };

  const statusFilters: { label: string; value: StatusFilter }[] = [
    { label: "All", value: "all" }, { label: "Active", value: "active" },
    { label: "Suspended", value: "suspended" }, { label: "Blocked", value: "blocked" },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Member Management</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{total.toLocaleString()} total members</p>
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-3 h-3 mr-1.5" /> Export CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search name, phone, location…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex rounded-lg border border-border overflow-hidden">
            {statusFilters.map(f => (
              <button key={f.value} onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${statusFilter === f.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
                {f.label}
              </button>
            ))}
          </div>
          <select value={completionFilter} onChange={e => setCompletionFilter(e.target.value as any)}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground">
            <option value="all">All Profiles</option>
            <option value="complete">Complete</option>
            <option value="incomplete">Incomplete</option>
          </select>
          <select value={verifiedFilter} onChange={e => setVerifiedFilter(e.target.value as any)}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground">
            <option value="all">All Verification</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>

        {selected.size > 0 && (
          <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <span className="text-sm font-medium text-primary">{selected.size} selected</span>
            <Button size="sm" variant="outline" onClick={() => bulkVerify(true)}><Shield className="w-3 h-3 mr-1" /> Verify All</Button>
            <Button size="sm" variant="outline" onClick={() => bulkVerify(false)}><ShieldOff className="w-3 h-3 mr-1" /> Unverify All</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
          </div>
        )}

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="w-10 p-3 text-center">
                    <button onClick={toggleSelectAll}>
                      {selected.size === profiles.length && profiles.length > 0 ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </th>
                  {["Member", "Phone", "Gender", "Location", "Status", "Verified", "Profile", "Joined", "Actions"].map(h => (
                    <th key={h} className={`px-4 py-3 font-medium text-muted-foreground ${["Status", "Verified", "Profile", "Actions"].includes(h) ? "text-center" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
                ) : profiles.length === 0 ? (
                  <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">No members found.</td></tr>
                ) : profiles.map(p => {
                  const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || "Unnamed";
                  const status = p.status || "active";
                  return (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 text-center">
                        <button onClick={() => { const s = new Set(selected); s.has(p.user_id) ? s.delete(p.user_id) : s.add(p.user_id); setSelected(s); }}>
                          {selected.has(p.user_id) ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground" />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {(p.first_name?.[0] || "U").toUpperCase()}
                          </div>
                          <span className="font-medium text-foreground">{name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{p.phone || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground capitalize">{p.gender || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.location || "—"}</td>
                      <td className="px-4 py-3 text-center"><span className={statusBadge(p.status)}>{status}</span></td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => toggleVerify(p)} title={p.verified ? "Remove verification" : "Mark verified"}>
                          {p.verified ? <Shield className="w-4 h-4 text-green-600 mx-auto" /> : <ShieldOff className="w-4 h-4 text-muted-foreground mx-auto" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${p.profile_complete ? "bg-blue-500/10 text-blue-700" : "bg-muted text-muted-foreground"}`}>
                          {p.profile_complete ? "Complete" : "Incomplete"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("en-IN")}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEditModal(p)} title="Edit" className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                          <a href={`/profile/${p.user_id}`} target="_blank" rel="noreferrer" title="View" className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Eye className="w-3.5 h-3.5" /></a>
                          {status === "active" ? (
                            <>
                              <button onClick={() => openStatusModal(p, "suspend")} title="Suspend" className="p-1.5 rounded hover:bg-amber-500/10 text-muted-foreground hover:text-amber-700 transition-colors"><UserX className="w-3.5 h-3.5" /></button>
                              <button onClick={() => openStatusModal(p, "block")} title="Block" className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Ban className="w-3.5 h-3.5" /></button>
                            </>
                          ) : (
                            <button onClick={() => openStatusModal(p, "activate")} title="Reactivate" className="p-1.5 rounded hover:bg-green-500/10 text-muted-foreground hover:text-green-700 transition-colors"><RotateCcw className="w-3.5 h-3.5" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Showing {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} of {total}</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="w-4 h-4" /></Button>
              <span className="text-xs text-muted-foreground">{page} / {totalPages || 1}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>

        {/* Status Action Modal */}
        {statusModal.open && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-sm shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground capitalize">{statusModal.action} Account</h3>
                <button onClick={() => setStatusModal({ open: false, userId: null, name: "", action: "suspend" })}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <p className="text-sm text-muted-foreground">
                {statusModal.action === "activate" ? `Reactivate account for ${statusModal.name}?` : `You are about to ${statusModal.action} ${statusModal.name}.`}
              </p>
              {statusModal.action !== "activate" && (
                <div className="space-y-1.5">
                  <Label>Reason <span className="text-destructive">*</span></Label>
                  <Input placeholder="Enter reason…" value={statusReason} onChange={e => setStatusReason(e.target.value)} />
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setStatusModal({ open: false, userId: null, name: "", action: "suspend" })}>Cancel</Button>
                <Button
                  className={`flex-1 text-white ${statusModal.action === "block" ? "bg-destructive hover:bg-destructive/90" : statusModal.action === "activate" ? "bg-green-600 hover:bg-green-700" : "bg-amber-600 hover:bg-amber-700"}`}
                  onClick={applyStatusAction} disabled={actionLoading}>
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Confirm ${statusModal.action}`}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Profile Modal */}
        {editModal.open && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-lg shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Edit Profile</h3>
                <button onClick={() => setEditModal({ open: false, profile: null })}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {([["first_name", "First Name"], ["last_name", "Last Name"], ["phone", "Phone"], ["gender", "Gender"], ["location", "Location"], ["religion", "Religion"], ["education", "Education"], ["profession", "Profession"]] as [keyof typeof editForm, string][]).map(([key, label]) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs">{label}</Label>
                    <Input value={editForm[key]} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setEditModal({ open: false, profile: null })}>Cancel</Button>
                <Button className="flex-1" onClick={saveEdit} disabled={editLoading}>
                  {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
