import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Shield, ShieldOff, Clock, CheckCircle, XCircle, MessageSquare,
  Search, Eye, Loader2, X, AlertTriangle,
} from "lucide-react";

type Tab = "pending" | "approved" | "rejected";

interface ProfileRow {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  gender: string | null;
  location: string | null;
  religion: string | null;
  education: string | null;
  profession: string | null;
  photo_url: string | null;
  verified: boolean | null;
  profile_complete: boolean | null;
  created_at: string;
  updated_at: string;
}

const hoursAgo = (dateStr: string) =>
  Math.floor((Date.now() - new Date(dateStr).getTime()) / 3600000);

const slaColor = (hours: number) => {
  if (hours < 24) return "text-green-600 bg-green-500/10";
  if (hours < 48) return "text-amber-600 bg-amber-500/10";
  return "text-destructive bg-destructive/10";
};

const AdminVerification = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("pending");
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal
  const [modal, setModal] = useState<{ open: boolean; profile: ProfileRow | null; action: "approve" | "reject" | "request" | null }>({ open: false, profile: null, action: null });
  const [rejectionReason, setRejectionReason] = useState("");

  // Detail panel
  const [detailProfile, setDetailProfile] = useState<ProfileRow | null>(null);

  const fetchProfiles = async () => {
    setLoading(true);
    let query = supabase
      .from("profiles")
      .select("id,user_id,first_name,last_name,phone,gender,location,religion,education,profession,photo_url,verified,profile_complete,status,created_at,updated_at" as any)
      .eq("profile_complete", true);

    if (tab === "pending") query = (query as any).eq("verified", false).or("status.eq.active,status.is.null");
    else if (tab === "approved") query = (query as any).eq("verified", true);
    else query = (query as any).eq("verified", false).eq("status", "rejected");

    if (search) query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`);

    const { data } = await query.order("updated_at", { ascending: true }).limit(50);
    setProfiles((data as unknown as ProfileRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchProfiles(); }, [tab, search]);

  const openAction = (profile: ProfileRow, action: "approve" | "reject" | "request") => {
    setModal({ open: true, profile, action });
    setRejectionReason("");
  };

  const confirmAction = async () => {
    if (!modal.profile || !modal.action) return;
    if ((modal.action === "reject" || modal.action === "request") && !rejectionReason.trim()) {
      toast({ title: "Reason required", variant: "destructive" }); return;
    }
    setActionLoading(modal.profile.user_id);

    if (modal.action === "approve") {
      await supabase.from("profiles").update({ verified: true }).eq("user_id", modal.profile.user_id);
      // Record in id_verifications if table exists
      await supabase.from("id_verifications" as any).insert({
        user_id: modal.profile.user_id,
        document_type: "profile_review",
        status: "verified",
        verified_at: new Date().toISOString(),
        verified_by: user?.id,
      }).select();
      toast({ title: "Profile Approved", description: "Verification badge applied." });
    } else if (modal.action === "reject") {
      await supabase.from("profiles").update({ verified: false, status: "rejected" } as any).eq("user_id", modal.profile.user_id);
      await supabase.from("moderation_actions" as any).insert({
        target_user_id: modal.profile.user_id,
        moderator_id: user?.id,
        action_type: "reject_verification",
        reason: rejectionReason,
      });
      toast({ title: "Profile Rejected", description: "Member notified." });
    } else {
      await supabase.from("moderation_actions" as any).insert({
        target_user_id: modal.profile.user_id,
        moderator_id: user?.id,
        action_type: "request_more_info",
        reason: rejectionReason,
      });
      toast({ title: "Info Requested", description: "Member notified to resubmit." });
    }

    setModal({ open: false, profile: null, action: null });
    setActionLoading(null);
    fetchProfiles();
  };

  const tabs: { label: string; value: Tab; icon: any }[] = [
    { label: "Pending Review", value: "pending", icon: Clock },
    { label: "Approved", value: "approved", icon: CheckCircle },
    { label: "Rejected", value: "rejected", icon: XCircle },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Profile Verification & KYC</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Review and verify member identity and profile authenticity</p>
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

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search member…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        {/* SLA Legend */}
        {tab === "pending" && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>SLA:</span>
            <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-600">&#60;24h (On Track)</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">24–48h (At Risk)</span>
            <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">&#62;48h (Breached)</span>
          </div>
        )}

        {/* Profiles Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Shield className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No profiles in this queue.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {profiles.map(p => {
              const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || "Unnamed";
              const hours = hoursAgo(p.updated_at || p.created_at);
              const isSelected = detailProfile?.user_id === p.user_id;

              return (
                <div key={p.id}
                  className={`bg-card rounded-xl border transition-colors ${isSelected ? "border-primary/50" : "border-border"}`}>
                  <div className="p-4 flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/10 shrink-0 flex items-center justify-center">
                      {p.photo_url
                        ? <img src={p.photo_url} alt={name} className="w-full h-full object-cover" />
                        : <span className="text-lg font-bold text-primary">{(p.first_name?.[0] || "U").toUpperCase()}</span>}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground">{name}</p>
                        {p.gender && <span className="text-xs text-muted-foreground capitalize">{p.gender}</span>}
                        {p.location && <span className="text-xs text-muted-foreground">· {p.location}</span>}
                        {tab === "pending" && (
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${slaColor(hours)}`}>
                            {hours < 1 ? "Just now" : `${hours}h ago`}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                        {p.phone && <span>{p.phone}</span>}
                        {p.religion && <span>{p.religion}</span>}
                        {p.education && <span>{p.education}</span>}
                        {p.profession && <span>{p.profession}</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <button onClick={() => setDetailProfile(isSelected ? null : p)}
                        className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                        <Eye className="w-4 h-4" />
                      </button>
                      {tab === "pending" && (
                        <>
                          <Button size="sm" variant="outline"
                            className="text-amber-700 border-amber-200 hover:bg-amber-50"
                            onClick={() => openAction(p, "request")} disabled={actionLoading === p.user_id}>
                            <MessageSquare className="w-3 h-3 mr-1" /> Request Info
                          </Button>
                          <Button size="sm" variant="outline"
                            className="text-destructive border-destructive/20 hover:bg-destructive/5"
                            onClick={() => openAction(p, "reject")} disabled={actionLoading === p.user_id}>
                            <XCircle className="w-3 h-3 mr-1" /> Reject
                          </Button>
                          <Button size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => openAction(p, "approve")} disabled={actionLoading === p.user_id}>
                            {actionLoading === p.user_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><CheckCircle className="w-3 h-3 mr-1" /> Approve</>}
                          </Button>
                        </>
                      )}
                      {tab === "approved" && (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-700 flex items-center gap-1">
                          <Shield className="w-3 h-3" /> Verified
                        </span>
                      )}
                      {tab === "rejected" && (
                        <Button size="sm" variant="outline" onClick={() => openAction(p, "approve")}>
                          <RotateCcwIcon className="w-3 h-3 mr-1" /> Re-approve
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Detail panel */}
                  {isSelected && (
                    <div className="border-t border-border p-4 bg-muted/20">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        {[["User ID", p.user_id?.slice(0, 8) + "…"], ["Phone", p.phone || "—"], ["Gender", p.gender || "—"], ["Location", p.location || "—"], ["Religion", p.religion || "—"], ["Education", p.education || "—"], ["Profession", p.profession || "—"], ["Joined", new Date(p.created_at).toLocaleDateString("en-IN")]].map(([label, value]) => (
                          <div key={label}>
                            <p className="text-xs text-muted-foreground">{label}</p>
                            <p className="font-medium text-foreground truncate">{value}</p>
                          </div>
                        ))}
                      </div>
                      {p.photo_url && (
                        <div className="mt-3">
                          <p className="text-xs text-muted-foreground mb-1">Profile Photo</p>
                          <img src={p.photo_url} alt="profile" className="w-24 h-24 rounded-lg object-cover border border-border" />
                        </div>
                      )}
                      {!p.photo_url && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-amber-600">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          No profile photo uploaded
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Action Confirmation Modal */}
        {modal.open && modal.profile && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-md shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground capitalize">
                  {modal.action === "approve" ? "Approve Verification" : modal.action === "reject" ? "Reject Verification" : "Request More Information"}
                </h3>
                <button onClick={() => setModal({ open: false, profile: null, action: null })}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <p className="text-sm text-muted-foreground">
                {modal.action === "approve"
                  ? `Approve and verify profile for ${[modal.profile.first_name, modal.profile.last_name].filter(Boolean).join(" ") || "this member"}?`
                  : `${modal.action === "reject" ? "Reject verification for" : "Request more information from"} ${[modal.profile.first_name, modal.profile.last_name].filter(Boolean).join(" ") || "this member"}.`}
              </p>
              {modal.action !== "approve" && (
                <div className="space-y-1.5">
                  <Label>{modal.action === "reject" ? "Rejection Reason" : "Information Required"} <span className="text-destructive">*</span></Label>
                  <textarea
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    rows={3}
                    placeholder={modal.action === "reject" ? "Explain why the profile was rejected…" : "Describe what additional documents or information are needed…"}
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                  />
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setModal({ open: false, profile: null, action: null })}>Cancel</Button>
                <Button
                  className={`flex-1 text-white ${modal.action === "approve" ? "bg-green-600 hover:bg-green-700" : modal.action === "reject" ? "bg-destructive hover:bg-destructive/90" : "bg-amber-600 hover:bg-amber-700"}`}
                  onClick={confirmAction}>
                  {modal.action === "approve" ? "Approve" : modal.action === "reject" ? "Reject" : "Send Request"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

// Inline icon to avoid import issues
const RotateCcwIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 4v6h6M3.51 15a9 9 0 1 0 .49-3.07"/>
  </svg>
);

export default AdminVerification;
