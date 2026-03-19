import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type MembershipTier = "free" | "premium" | "concierge";

interface Membership {
  tier: MembershipTier;
  isActive: boolean;
  expiresAt: string | null;
}

export const useMembership = (userId?: string) => {
  const [membership, setMembership] = useState<Membership>({ tier: "free", isActive: false, expiresAt: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    const fetch = async () => {
      const { data } = await supabase
        .from("memberships")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        const expired = data.expires_at ? new Date(data.expires_at) < new Date() : false;
        setMembership({
          tier: expired ? "free" : (data.tier as MembershipTier),
          isActive: !expired && data.is_active,
          expiresAt: data.expires_at,
        });
      }
      setLoading(false);
    };
    fetch();
  }, [userId]);

  const isPremiumOrAbove = membership.tier === "premium" || membership.tier === "concierge";
  const isConcierge = membership.tier === "concierge";

  return { membership, loading, isPremiumOrAbove, isConcierge };
};
