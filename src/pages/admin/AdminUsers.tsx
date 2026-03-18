import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, Shield, ShieldCheck, ShieldX, Eye, Ban, CheckCircle,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const PAGE_SIZE = 20;

const AdminUsers = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    let query = supabase
      .from("profiles")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (filter === "verified") query = query.eq("verified", true);
    if (filter === "unverified") query = query.eq("verified", false);
    if (filter === "complete") query = query.eq("profile_complete", true);
    if (filter === "incomplete") query = query.eq("profile_complete", false);

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%,location.ilike.%${search}%`);
    }

    const { data, count } = await query;
    setProfiles(data || []);
    setTotal(count || 0);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [page, filter]);

  const handleSearch = () => { setPage(0); fetchUsers(); };

  const toggleVerified = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ verified: !currentStatus })
      .eq("user_id", userId);
    if (error) {
      toast.error("Failed to update");
    } else {
      toast.success(currentStatus ? "Verification removed" : "Profile verified");
      fetchUsers();
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} total users</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
            />
          </div>
          <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="unverified">Unverified</SelectItem>
              <SelectItem value="complete">Complete Profile</SelectItem>
              <SelectItem value="incomplete">Incomplete</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleSearch}>Search</Button>
        </div>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-3 font-medium text-muted-foreground">User</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Location</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Gender</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Joined</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
                  ) : profiles.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No users found</td></tr>
                  ) : (
                    profiles.map((p) => (
                      <tr key={p.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                              {(p.first_name?.[0] || "U").toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {[p.first_name, p.last_name].filter(Boolean).join(" ") || "Unnamed"}
                              </p>
                              <p className="text-xs text-muted-foreground">{p.phone || "No phone"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground">{p.location || "—"}</td>
                        <td className="p-3 text-muted-foreground capitalize">{p.gender || "—"}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            {p.verified ? (
                              <Badge variant="outline" className="text-[10px] border-secondary/30 text-secondary bg-secondary/5">
                                <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] border-muted-foreground/30 text-muted-foreground">
                                <ShieldX className="w-3 h-3 mr-1" /> Unverified
                              </Badge>
                            )}
                            {!p.profile_complete && (
                              <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive bg-destructive/5">
                                Incomplete
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground text-xs">
                          {new Date(p.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                              <Link to={`/profile/${p.user_id}`}>
                                <Eye className="w-3.5 h-3.5" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => toggleVerified(p.user_id, p.verified)}
                              title={p.verified ? "Remove verification" : "Verify profile"}
                            >
                              {p.verified ? (
                                <ShieldX className="w-3.5 h-3.5 text-destructive" />
                              ) : (
                                <CheckCircle className="w-3.5 h-3.5 text-secondary" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage(page - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
