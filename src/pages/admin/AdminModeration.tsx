import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, XCircle, Shield, Eye, AlertTriangle, User } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const AdminModeration = () => {
  const [pendingProfiles, setPendingProfiles] = useState<any[]>([]);
  const [flaggedProfiles, setFlaggedProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      // Profiles not verified and complete (pending review)
      const { data: pending } = await supabase
        .from("profiles")
        .select("*")
        .eq("profile_complete", true)
        .eq("verified", false)
        .order("created_at", { ascending: false })
        .limit(50);

      // Profiles without photos (flagged)
      const { data: flagged } = await supabase
        .from("profiles")
        .select("*")
        .eq("profile_complete", true)
        .is("photo_url", null)
        .order("created_at", { ascending: false })
        .limit(50);

      setPendingProfiles(pending || []);
      setFlaggedProfiles(flagged || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const approveProfile = async (userId: string) => {
    const { error } = await supabase.from("profiles").update({ verified: true }).eq("user_id", userId);
    if (error) {
      toast.error("Failed to approve");
    } else {
      toast.success("Profile approved");
      setPendingProfiles((prev) => prev.filter((p) => p.user_id !== userId));
    }
  };

  const rejectProfile = async (userId: string) => {
    const { error } = await supabase.from("profiles").update({ verified: false, profile_complete: false }).eq("user_id", userId);
    if (error) {
      toast.error("Failed to reject");
    } else {
      toast.success("Profile sent back for review");
      setPendingProfiles((prev) => prev.filter((p) => p.user_id !== userId));
    }
  };

  const ProfileRow = ({ profile, showActions = false }: { profile: any; showActions?: boolean }) => (
    <div className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
      <div className="flex items-center gap-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={profile.photo_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
            {(profile.first_name?.[0] || "U").toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium text-foreground">
            {[profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Unnamed"}
          </p>
          <p className="text-xs text-muted-foreground">
            {[profile.gender, profile.location, profile.community].filter(Boolean).join(" · ") || "No details"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link to={`/profile/${profile.user_id}`}>
            <Eye className="w-3.5 h-3.5" />
          </Link>
        </Button>
        {showActions && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-secondary hover:text-secondary"
              onClick={() => approveProfile(profile.user_id)}
            >
              <CheckCircle className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => rejectProfile(profile.user_id)}
            >
              <XCircle className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Content Moderation</h1>
          <p className="text-sm text-muted-foreground mt-1">Review and approve profiles</p>
        </div>

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending" className="gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              Pending Review
              {pendingProfiles.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                  {pendingProfiles.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="flagged" className="gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Flagged
              {flaggedProfiles.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px]">
                  {flaggedProfiles.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Profiles Awaiting Verification</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : pendingProfiles.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-secondary/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">All caught up! No profiles pending.</p>
                  </div>
                ) : (
                  pendingProfiles.map((p) => <ProfileRow key={p.id} profile={p} showActions />)
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="flagged">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Profiles Missing Photos</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : flaggedProfiles.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No flagged profiles.</p>
                  </div>
                ) : (
                  flaggedProfiles.map((p) => <ProfileRow key={p.id} profile={p} />)
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminModeration;
