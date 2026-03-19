import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useInterestActions = (currentUserId?: string, targetUserId?: string) => {
  const [interest, setInterest] = useState<any>(null);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!currentUserId || !targetUserId) { setLoading(false); return; }

    const [{ data: sentInterest }, { data: recvInterest }, { data: shortlist }] = await Promise.all([
      supabase.from("interests").select("*").eq("sender_id", currentUserId).eq("receiver_id", targetUserId).maybeSingle(),
      supabase.from("interests").select("*").eq("sender_id", targetUserId).eq("receiver_id", currentUserId).maybeSingle(),
      supabase.from("shortlists").select("*").eq("user_id", currentUserId).eq("profile_id", targetUserId).maybeSingle(),
    ]);

    setInterest(sentInterest || recvInterest);
    setIsShortlisted(!!shortlist);
    setLoading(false);
  }, [currentUserId, targetUserId]);

  useEffect(() => { refresh(); }, [refresh]);

  const sendInterest = async () => {
    if (!currentUserId || !targetUserId) return;
    const { error } = await supabase.from("interests").insert({ sender_id: currentUserId, receiver_id: targetUserId });
    if (error) {
      if (error.message.includes("duplicate")) toast.error("Interest already sent");
      else toast.error("Failed to send interest");
    } else {
      toast.success("Interest sent!");
      refresh();
    }
  };

  const toggleShortlist = async () => {
    if (!currentUserId || !targetUserId) return;
    if (isShortlisted) {
      await supabase.from("shortlists").delete().eq("user_id", currentUserId).eq("profile_id", targetUserId);
      toast.success("Removed from shortlist");
    } else {
      const { error } = await supabase.from("shortlists").insert({ user_id: currentUserId, profile_id: targetUserId });
      if (error && error.message.includes("duplicate")) toast.error("Already shortlisted");
      else if (error) toast.error("Failed to shortlist");
      else toast.success("Added to shortlist!");
    }
    refresh();
  };

  return { interest, isShortlisted, loading, sendInterest, toggleShortlist, refresh };
};
