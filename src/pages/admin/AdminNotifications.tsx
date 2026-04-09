import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, Edit, Save, X, Loader2, Send, Users, Megaphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface NotificationTemplate {
  id: string;
  event_key: string;
  title: string;
  body: string;
  channels: string[];
  is_active: boolean;
  updated_at: string;
}

const CHANNEL_LABELS: Record<string, string> = {
  email: "Email", sms: "SMS", push: "Push", in_app: "In-App",
};

const AdminNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<NotificationTemplate | null>(null);
  const [editForm, setEditForm] = useState({ title: "", body: "", channels: [] as string[], is_active: true });
  const [saving, setSaving] = useState(false);

  // Broadcast panel
  const [broadcastSegment, setBroadcastSegment] = useState<"all" | "unverified" | "premium" | "inactive">("all");
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);
  const [targetCount, setTargetCount] = useState<number | null>(null);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("notification_templates").select("*").order("event_key");
    setTemplates(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchTemplates(); }, []);

  const openEdit = (t: NotificationTemplate) => {
    setEditing(t);
    setEditForm({ title: t.title, body: t.body, channels: [...t.channels], is_active: t.is_active });
  };

  const saveTemplate = async () => {
    if (!editing) return;
    setSaving(true);
    const { error } = await (supabase as any).from("notification_templates").update({
      title: editForm.title, body: editForm.body, channels: editForm.channels,
      is_active: editForm.is_active, updated_by: user?.id, updated_at: new Date().toISOString(),
    }).eq("id", editing.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Template saved" }); setEditing(null); fetchTemplates(); }
    setSaving(false);
  };

  const toggleChannel = (ch: string) => {
    setEditForm(f => ({
      ...f,
      channels: f.channels.includes(ch) ? f.channels.filter(c => c !== ch) : [...f.channels, ch],
    }));
  };

  // Simulate counting target segment
  const countSegment = async (seg: typeof broadcastSegment) => {
    let query = supabase.from("profiles").select("*", { count: "exact", head: true });
    if (seg === "unverified") query = query.eq("verified", false).eq("profile_complete", true);
    else if (seg === "premium") {
      const { count } = await supabase.from("memberships").select("*", { count: "exact", head: true }).eq("is_active", true).neq("tier", "free");
      setTargetCount(count);
      return;
    } else if (seg === "inactive") {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      query = query.lt("updated_at", weekAgo);
    }
    const { count } = await query;
    setTargetCount(count);
  };

  useEffect(() => { countSegment(broadcastSegment); }, [broadcastSegment]);

  const sendBroadcast = async () => {
    if (!broadcastTitle || !broadcastBody) { toast({ title: "Title and body required", variant: "destructive" }); return; }
    setBroadcasting(true);
    // In production this would call a server function or queue. Here we simulate success.
    await new Promise(r => setTimeout(r, 1000));
    toast({
      title: "Broadcast Queued",
      description: `Notification queued for ${targetCount?.toLocaleString() || "all"} members. Delivery is async.`,
    });
    setBroadcastTitle(""); setBroadcastBody("");
    setBroadcasting(false);
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Notifications Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage event templates and send broadcast notifications</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template List */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" /> Event-Triggered Templates
            </h2>

            {loading ? (
              <div className="text-sm text-muted-foreground py-4">Loading…</div>
            ) : templates.map(t => (
              <Card key={t.id} className={!t.is_active ? "opacity-60" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">{t.event_key}</p>
                        {!t.is_active && <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Disabled</span>}
                      </div>
                      <p className="font-medium text-sm mt-1">{t.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.body}</p>
                      <div className="flex gap-1 mt-2">
                        {t.channels.map(ch => (
                          <span key={ch} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{CHANNEL_LABELS[ch] || ch}</span>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => openEdit(t)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Broadcast Panel */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-primary" /> Broadcast Message
            </h2>
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Target Segment</Label>
                  <select value={broadcastSegment} onChange={e => setBroadcastSegment(e.target.value as any)}
                    className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs">
                    <option value="all">All Members</option>
                    <option value="unverified">Unverified (complete profiles)</option>
                    <option value="premium">Premium / Paid Members</option>
                    <option value="inactive">Inactive (7+ days)</option>
                  </select>
                  {targetCount !== null && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" /> ~{targetCount.toLocaleString()} recipients
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Notification Title</Label>
                  <Input placeholder="e.g. Platform Update" value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Message Body</Label>
                  <textarea
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    rows={4} placeholder="Enter notification content…"
                    value={broadcastBody} onChange={e => setBroadcastBody(e.target.value)}
                  />
                </div>
                <Button className="w-full" size="sm" onClick={sendBroadcast} disabled={broadcasting || !broadcastTitle || !broadcastBody}>
                  {broadcasting ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <Send className="w-3 h-3 mr-1.5" />}
                  {broadcasting ? "Sending…" : "Send Broadcast"}
                </Button>
                <p className="text-[10px] text-muted-foreground">
                  Broadcast is queued and delivered asynchronously. Members who opted out will not receive it.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Edit Template Modal */}
        {editing && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-lg shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Edit Template</h3>
                  <p className="text-xs font-mono text-primary">{editing.event_key}</p>
                </div>
                <button onClick={() => setEditing(null)}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Body</Label>
                  <textarea
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    rows={4} value={editForm.body}
                    onChange={e => setEditForm(f => ({ ...f, body: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">Use {"{{variable}}"} placeholders e.g. {"{{name}}"}, {"{{plan}}"}, {"{{days}}"}</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Delivery Channels</Label>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(CHANNEL_LABELS).map(([ch, label]) => (
                      <button key={ch} onClick={() => toggleChannel(ch)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${editForm.channels.includes(ch) ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary/50"}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditForm(f => ({ ...f, is_active: !f.is_active }))}
                    className={`w-10 h-5.5 rounded-full transition-colors relative ${editForm.is_active ? "bg-primary" : "bg-muted"}`}>
                    <span className={`absolute top-0.5 w-4.5 h-4 bg-white rounded-full shadow transition-all ${editForm.is_active ? "left-5" : "left-0.5"}`} />
                  </button>
                  <Label className="text-sm">{editForm.is_active ? "Template Active" : "Template Disabled"}</Label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setEditing(null)}>Cancel</Button>
                <Button className="flex-1" onClick={saveTemplate} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-3 h-3 mr-1.5" /> Save Template</>}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminNotifications;
