import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Ticket, Plus, Search, X, Loader2, Clock, CheckCircle,
  AlertTriangle, ArrowUpCircle, ChevronDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type TicketStatus = "new" | "assigned" | "in_progress" | "awaiting_response" | "resolved" | "closed";
type Priority = "low" | "medium" | "high" | "urgent";
type Category = "general" | "technical" | "billing" | "safety" | "verification" | "matchmaking";

interface SupportTicket {
  id: string;
  ticket_number: number;
  user_id: string | null;
  subject: string;
  description: string | null;
  category: Category;
  priority: Priority;
  status: TicketStatus;
  assigned_to: string | null;
  internal_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  profile?: { first_name: string | null; last_name: string | null; phone: string | null };
}

const STATUS_FLOW: TicketStatus[] = ["new", "assigned", "in_progress", "awaiting_response", "resolved", "closed"];

const statusColor: Record<TicketStatus, string> = {
  new: "bg-blue-500/10 text-blue-700",
  assigned: "bg-violet-500/10 text-violet-700",
  in_progress: "bg-amber-500/10 text-amber-700",
  awaiting_response: "bg-orange-500/10 text-orange-700",
  resolved: "bg-green-500/10 text-green-700",
  closed: "bg-muted text-muted-foreground",
};

const priorityColor: Record<Priority, string> = {
  low: "text-muted-foreground",
  medium: "text-blue-600",
  high: "text-amber-600",
  urgent: "text-destructive font-semibold",
};

const AdminSupport = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");

  // Selected ticket for detail view
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // Create ticket modal
  const [createModal, setCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [form, setForm] = useState({
    subject: "", description: "", category: "general" as Category,
    priority: "medium" as Priority, phone: "",
  });
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!data) { setLoading(false); return; }

    const userIds = [...new Set(data.filter((t: any) => t.user_id).map((t: any) => t.user_id))];
    const { data: profiles } = await supabase.from("profiles").select("user_id,first_name,last_name,phone").in("user_id", userIds);
    const pMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p]));

    setTickets(data.map((t: any) => ({ ...t, profile: pMap[t.user_id] })));
    setLoading(false);
  };

  useEffect(() => { fetchTickets(); }, []);

  const filtered = tickets.filter(t => {
    const matchSearch = !search || t.subject.toLowerCase().includes(search.toLowerCase())
      || (t.profile?.phone || "").includes(search);
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    const matchPriority = priorityFilter === "all" || t.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const stats = {
    open: tickets.filter(t => !["resolved", "closed"].includes(t.status)).length,
    urgent: tickets.filter(t => t.priority === "urgent" && !["resolved", "closed"].includes(t.status)).length,
    resolved: tickets.filter(t => t.status === "resolved" || t.status === "closed").length,
  };

  const advanceStatus = async (ticket: SupportTicket) => {
    const idx = STATUS_FLOW.indexOf(ticket.status);
    if (idx >= STATUS_FLOW.length - 1) return;
    const next = STATUS_FLOW[idx + 1];
    const updates: any = { status: next, updated_at: new Date().toISOString() };
    if (next === "resolved") updates.resolved_at = new Date().toISOString();

    const { error } = await (supabase as any).from("support_tickets").update(updates).eq("id", ticket.id);
    if (!error) { toast({ title: `Status → ${next}` }); fetchTickets(); if (selected?.id === ticket.id) setSelected({ ...ticket, status: next }); }
  };

  const saveNotes = async () => {
    if (!selected || !noteText.trim()) return;
    setSavingNote(true);
    const notes = selected.internal_notes ? `${selected.internal_notes}\n\n[${new Date().toLocaleString()}] ${noteText}` : `[${new Date().toLocaleString()}] ${noteText}`;
    const { error } = await (supabase as any).from("support_tickets").update({ internal_notes: notes }).eq("id", selected.id);
    if (!error) { toast({ title: "Note saved" }); setNoteText(""); fetchTickets(); setSelected({ ...selected, internal_notes: notes }); }
    setSavingNote(false);
  };

  const resolveUser = async () => {
    if (!form.phone) return;
    const { data } = await supabase.from("profiles").select("user_id").eq("phone", form.phone).single();
    if (data) setResolvedUserId(data.user_id);
    else toast({ title: "User not found", variant: "destructive" });
  };

  const createTicket = async () => {
    if (!form.subject) { toast({ title: "Subject required", variant: "destructive" }); return; }
    setCreateLoading(true);
    const { error } = await (supabase as any).from("support_tickets").insert({
      user_id: resolvedUserId,
      subject: form.subject,
      description: form.description || null,
      category: form.category,
      priority: form.priority,
      status: "new",
      assigned_to: user?.id,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Ticket Created" }); setCreateModal(false); fetchTickets(); }
    setCreateLoading(false);
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Customer Support & Help Desk</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage member queries and support tickets</p>
          </div>
          <Button onClick={() => { setCreateModal(true); setResolvedUserId(null); setForm({ subject: "", description: "", category: "general", priority: "medium", phone: "" }); }}>
            <Plus className="w-4 h-4 mr-1.5" /> New Ticket
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Open Tickets", value: stats.open, icon: Clock, color: "text-amber-600" },
            { label: "Urgent", value: stats.urgent, icon: AlertTriangle, color: "text-destructive" },
            { label: "Resolved", value: stats.resolved, icon: CheckCircle, color: "text-green-600" },
          ].map(s => (
            <Card key={s.label}><CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`w-5 h-5 ${s.color}`} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold">{s.value}</p>
              </div>
            </CardContent></Card>
          ))}
        </div>

        <div className="flex gap-5">
          {/* Ticket List */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Filters */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search tickets…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground">
                <option value="all">All Status</option>
                {STATUS_FLOW.map(s => <option key={s} value={s} className="capitalize">{s.replace("_", " ")}</option>)}
              </select>
              <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value as any)}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground">
                <option value="all">All Priority</option>
                {(["low", "medium", "high", "urgent"] as Priority[]).map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
              </select>
            </div>

            {loading ? (
              <div className="text-sm text-muted-foreground text-center py-8">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <Ticket className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm text-muted-foreground">No tickets found.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map(t => {
                  const memberName = t.profile ? [t.profile.first_name, t.profile.last_name].filter(Boolean).join(" ") || t.profile.phone : "Anonymous";
                  const isSelected = selected?.id === t.id;
                  return (
                    <div key={t.id}
                      onClick={() => setSelected(isSelected ? null : t)}
                      className={`p-4 rounded-xl border cursor-pointer transition-colors ${isSelected ? "border-primary/50 bg-primary/5" : "border-border bg-card hover:border-border/80 hover:bg-muted/20"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-muted-foreground">#{t.ticket_number}</span>
                            <p className="text-sm font-medium text-foreground truncate">{t.subject}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-muted-foreground">{memberName}</span>
                            <span className="text-xs text-muted-foreground">· {t.category}</span>
                            <span className={`text-xs ${priorityColor[t.priority]} capitalize`}>{t.priority}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${statusColor[t.status]}`}>
                            {t.status.replace("_", " ")}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{new Date(t.created_at).toLocaleDateString("en-IN")}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ticket Detail */}
          {selected && (
            <div className="w-80 shrink-0 bg-card rounded-xl border border-border p-4 space-y-4 self-start sticky top-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm">Ticket #{selected.ticket_number}</p>
                <button onClick={() => setSelected(null)}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Subject</p>
                  <p className="font-medium">{selected.subject}</p>
                </div>
                {selected.description && (
                  <div>
                    <p className="text-xs text-muted-foreground">Description</p>
                    <p className="text-muted-foreground text-xs">{selected.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Category</p>
                    <p className="capitalize">{selected.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Priority</p>
                    <p className={`capitalize ${priorityColor[selected.priority]}`}>{selected.priority}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${statusColor[selected.status]}`}>
                      {selected.status.replace("_", " ")}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="text-xs">{new Date(selected.created_at).toLocaleDateString("en-IN")}</p>
                  </div>
                </div>
              </div>

              {STATUS_FLOW.indexOf(selected.status) < STATUS_FLOW.length - 1 && (
                <Button size="sm" className="w-full" onClick={() => advanceStatus(selected)}>
                  <ArrowUpCircle className="w-3 h-3 mr-1.5" />
                  Move to: {STATUS_FLOW[STATUS_FLOW.indexOf(selected.status) + 1].replace("_", " ")}
                </Button>
              )}

              {/* Internal Notes */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Internal Notes</p>
                {selected.internal_notes && (
                  <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2 whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {selected.internal_notes}
                  </div>
                )}
                <textarea
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3} placeholder="Add internal note…" value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                />
                <Button size="sm" variant="outline" className="w-full" onClick={saveNotes} disabled={savingNote || !noteText.trim()}>
                  {savingNote ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save Note"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Create Ticket Modal */}
        {createModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-md shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Create Support Ticket</h3>
                <button onClick={() => setCreateModal(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Member Phone (optional)</Label>
                  <div className="flex gap-2">
                    <Input placeholder="10-digit phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                    <Button variant="outline" size="sm" onClick={resolveUser}>Find</Button>
                  </div>
                  {resolvedUserId && <p className="text-xs text-green-600">✓ Member linked</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Subject <span className="text-destructive">*</span></Label>
                  <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" rows={3}
                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))}
                      className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm">
                      {(["general", "technical", "billing", "safety", "verification", "matchmaking"] as Category[]).map(c => (
                        <option key={c} value={c} className="capitalize">{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Priority</Label>
                    <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}
                      className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm">
                      {(["low", "medium", "high", "urgent"] as Priority[]).map(p => (
                        <option key={p} value={p} className="capitalize">{p}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setCreateModal(false)}>Cancel</Button>
                <Button className="flex-1" onClick={createTicket} disabled={createLoading}>
                  {createLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Ticket"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSupport;
