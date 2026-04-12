import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Ban, Flag, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

const reportReasons = [
  "Fake profile",
  "Inappropriate content",
  "Harassment or abuse",
  "Spam or scam",
  "Other",
];

interface Props {
  targetUserId: string;
  targetName?: string;
}

export const BlockButton = ({ targetUserId, targetName }: Props) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const handleBlock = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("blocked_users").insert({
      blocker_id: user.id,
      blocked_id: targetUserId,
    });
    setLoading(false);
    if (error) {
      if (error.code === "23505") {
        toast.info("Already blocked");
        setBlocked(true);
      } else {
        toast.error("Failed to block user");
      }
      return;
    }
    setBlocked(true);
    toast.success(`${targetName || "User"} has been blocked`);
  };

  if (blocked) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-1.5 text-destructive border-destructive/30">
        <Ban className="w-3.5 h-3.5" /> Blocked
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:bg-destructive/10" onClick={handleBlock} disabled={loading}>
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
      Block
    </Button>
  );
};

export const ReportDialog = ({ targetUserId, targetName }: Props) => {
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSubmit = async () => {
    if (!user || !reason) return;
    setLoading(true);
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_id: targetUserId,
      reason,
      details: details || null,
    });
    setLoading(false);
    if (error) {
      toast.error("Failed to submit report");
      return;
    }
    toast.success("Report submitted. Our team will review it shortly.");
    setOpen(false);
    setReason("");
    setDetails("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-amber-600 hover:bg-amber-50">
          <Flag className="w-3.5 h-3.5" /> Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-destructive" />
            Report {targetName || "User"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-sm font-medium">Reason for reporting</Label>
            <RadioGroup value={reason} onValueChange={setReason} className="mt-2 space-y-2">
              {reportReasons.map((r) => (
                <div key={r} className="flex items-center space-x-2">
                  <RadioGroupItem value={r} id={r} />
                  <Label htmlFor={r} className="text-sm cursor-pointer">{r}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div>
            <Label className="text-sm font-medium">Additional details (optional)</Label>
            <Textarea
              placeholder="Provide more context..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="mt-1.5"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" className="gap-1.5" onClick={handleSubmit} disabled={!reason || loading}>
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Flag className="w-3.5 h-3.5" />}
            Submit Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
