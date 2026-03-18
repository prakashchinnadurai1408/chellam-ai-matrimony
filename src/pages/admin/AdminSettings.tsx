import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { UserPlus, Shield, Trash2 } from "lucide-react";
import { toast } from "sonner";

const AdminSettings = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<any[]>([]);
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "moderator">("admin");
  const [loading, setLoading] = useState(true);

  const fetchRoles = async () => {
    const { data } = await supabase.from("user_roles").select("*");
    if (!data) { setLoading(false); return; }

    // Enrich with profile names
    const enriched = [];
    for (const r of data) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, phone")
        .eq("user_id", r.user_id)
        .single();
      enriched.push({
        ...r,
        name: [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Unknown",
        phone: profile?.phone || "—",
      });
    }
    setRoles(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchRoles(); }, []);

  const addRole = async () => {
    if (!newPhone.trim()) { toast.error("Enter a phone number"); return; }

    // Find user by phone
    const email = `${newPhone.trim()}@chellam.dev`;
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("phone", newPhone.trim())
      .single();

    if (!profile) {
      toast.error("User not found with that phone number");
      return;
    }

    const { error } = await supabase.from("user_roles").insert({
      user_id: profile.user_id,
      role: newRole,
    });

    if (error) {
      if (error.message.includes("duplicate")) {
        toast.error("User already has this role");
      } else {
        toast.error("Failed to add role");
      }
    } else {
      toast.success(`${newRole} role assigned`);
      setNewPhone("");
      fetchRoles();
    }
  };

  const removeRole = async (id: string) => {
    const { error } = await supabase.from("user_roles").delete().eq("id", id);
    if (error) {
      toast.error("Failed to remove role");
    } else {
      toast.success("Role removed");
      setRoles((prev) => prev.filter((r) => r.id !== id));
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Admin Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage roles and access control</p>
        </div>

        {/* Add Role */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Assign Role
            </CardTitle>
            <CardDescription>Grant admin or moderator access to a user by phone number</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Label className="text-xs mb-1.5 block">Phone Number</Label>
                <Input
                  placeholder="e.g. 9876543210"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
              </div>
              <div className="w-40">
                <Label className="text-xs mb-1.5 block">Role</Label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as "admin" | "moderator")}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="admin">Admin</option>
                  <option value="moderator">Moderator</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button onClick={addRole} className="gap-1.5">
                  <UserPlus className="w-4 h-4" /> Assign
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Roles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4" /> Current Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : roles.length === 0 ? (
              <p className="text-sm text-muted-foreground">No roles assigned yet.</p>
            ) : (
              <div className="space-y-3">
                {roles.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                        {r.name[0]?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={r.role === "admin" ? "default" : "secondary"} className="text-[10px]">
                        {r.role}
                      </Badge>
                      {r.user_id !== user?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => removeRole(r.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
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

export default AdminSettings;
