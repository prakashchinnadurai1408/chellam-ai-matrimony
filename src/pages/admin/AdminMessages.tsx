import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MessageCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

const AdminMessages = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchConversations = async () => {
    setLoading(true);
    const { data: convos } = await supabase
      .from("conversations")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(50);

    if (!convos) { setLoading(false); return; }

    const enriched = [];
    for (const c of convos) {
      const [{ data: p1 }, { data: p2 }, { count }] = await Promise.all([
        supabase.from("profiles").select("first_name, last_name").eq("user_id", c.user1_id).maybeSingle(),
        supabase.from("profiles").select("first_name, last_name").eq("user_id", c.user2_id).maybeSingle(),
        supabase.from("messages").select("*", { count: "exact", head: true }).eq("conversation_id", c.id),
      ]);

      enriched.push({
        ...c,
        user1_name: [p1?.first_name, p1?.last_name].filter(Boolean).join(" ") || "Unknown",
        user2_name: [p2?.first_name, p2?.last_name].filter(Boolean).join(" ") || "Unknown",
        message_count: count || 0,
      });
    }

    setConversations(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchConversations(); }, []);

  const deleteConversation = async (id: string) => {
    // Delete messages first, then conversation
    await supabase.from("messages").delete().eq("conversation_id", id);
    const { error } = await supabase.from("conversations").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
    } else {
      toast.success("Conversation deleted");
      setConversations((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.user1_name.toLowerCase().includes(q) || c.user2_name.toLowerCase().includes(q);
  });

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Messages Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor platform conversations</p>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by user name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-3 font-medium text-muted-foreground">User 1</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">User 2</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Messages</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Last Active</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">
                      <MessageCircle className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                      No conversations found
                    </td></tr>
                  ) : (
                    filtered.map((c) => (
                      <tr key={c.id} className="border-b border-border/30 hover:bg-muted/20">
                        <td className="p-3 font-medium text-foreground">{c.user1_name}</td>
                        <td className="p-3 font-medium text-foreground">{c.user2_name}</td>
                        <td className="p-3 text-muted-foreground">{c.message_count}</td>
                        <td className="p-3 text-muted-foreground text-xs">
                          {new Date(c.updated_at).toLocaleString()}
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteConversation(c.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminMessages;
