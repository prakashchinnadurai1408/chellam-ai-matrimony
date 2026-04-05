import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, Loader2, ShieldAlert, CheckCircle, UserCog } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import { AdminRole, hasAccess } from "@/config/rbac";

interface ProfileRoleData {
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: AdminRole | "user" | null;
}

const AdminRoleManagement = () => {
  const { user } = useAuth();
  const { role: currentUserRole, loading: roleLoading } = useAdminRole(user?.id);
  
  const [profiles, setProfiles] = useState<ProfileRoleData[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    
    // 1. Fetch profiles
    let pQuery = supabase.from("profiles").select("user_id, first_name, last_name, phone");
    if (search) {
      pQuery = pQuery.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    const { data: pData, error: pError } = await pQuery.limit(50);

    // 2. Fetch roles
    const { data: rData, error: rError } = await supabase.from("user_roles").select("user_id, role");

    if (pError || rError) {
      toast.error("Failed to load user data");
      setLoading(false);
      return;
    }

    // Merge logic
    const rolesMap = new Map();
    if (rData) {
      rData.forEach((row) => rolesMap.set(row.user_id, row.role));
    }

    const merged: ProfileRoleData[] = (pData || []).map((p) => ({
      user_id: p.user_id,
      first_name: p.first_name || "",
      last_name: p.last_name || "",
      phone: p.phone || "",
      role: rolesMap.get(p.user_id) || "user",
    }));

    setProfiles(merged);
    setLoading(false);
  };

  useEffect(() => {
    if (!roleLoading && hasAccess(["admin"], currentUserRole)) {
      fetchData();
    }
  }, [roleLoading, currentUserRole]);

  const handleSearch = () => {
    fetchData();
  };

  const handleRoleChange = async (targetUserId: string, newRole: string) => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`)) return;
    
    setUpdatingId(targetUserId);

    try {
      if (newRole === "user") {
        // "user" means no special role entry needed, delete from user_roles
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", targetUserId);
          
        if (error) throw error;
      } else {
        // Upsert into user_roles (Insert or Update via upsert)
        // Check if exists first
        const { data: exists } = await supabase.from("user_roles").select("id").eq("user_id", targetUserId);
        
        if (exists && exists.length > 0) {
          const { error } = await supabase
            .from("user_roles")
            .update({ role: newRole })
            .eq("user_id", targetUserId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("user_roles")
            .insert([{ user_id: targetUserId, role: newRole }]);
          if (error) throw error;
        }
      }

      toast.success("Role updated successfully");
      fetchData(); // refresh list
    } catch (err) {
      console.error(err);
      toast.error("An error occurred updating the role");
    } finally {
      setUpdatingId(null);
    }
  };

  if (roleLoading) {
    return (
      <AdminLayout>
        <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>
      </AdminLayout>
    );
  }

  // Component-level protection
  if (!hasAccess(["admin"], currentUserRole)) {
    return (
      <AdminLayout>
        <div className="p-8 text-center space-y-4 max-w-sm mx-auto mt-20">
          <ShieldAlert className="w-16 h-16 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">Restricted Access</h2>
          <p className="text-muted-foreground">Only Super Admins can manage user roles. Your current role is {currentUserRole}.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Role Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Assign Administrator and Moderator roles to users.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={handleSearch}>Search</Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-3 font-medium text-muted-foreground">User</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Phone</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Assigned Role</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && profiles.length === 0 ? (
                    <tr><td colSpan={3} className="p-8 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
                  ) : profiles.length === 0 ? (
                    <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">No users found</td></tr>
                  ) : (
                    profiles.map((p) => (
                      <tr key={p.user_id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                              {p.first_name?.[0]?.toUpperCase() || <UserCog className="w-4 h-4"/>}
                            </div>
                            <span className="font-medium text-foreground">
                              {[p.first_name, p.last_name].filter(Boolean).join(" ") || "Unnamed User"}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground">{p.phone || "—"}</td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end items-center gap-2">
                             {updatingId === p.user_id && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                             <Select 
                                value={p.role || "user"} 
                                onValueChange={(val) => handleRoleChange(p.user_id, val)}
                                disabled={updatingId === p.user_id || p.user_id === user?.id}
                             >
                                <SelectTrigger className="w-[140px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">Standard User</SelectItem>
                                  <SelectItem value="moderator">Moderator</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                             </Select>
                          </div>
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

export default AdminRoleManagement;
