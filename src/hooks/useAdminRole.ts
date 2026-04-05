import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

import { AdminRole } from "@/config/rbac";

export const useAdminRole = (userId: string | undefined) => {
  const [role, setRole] = useState<AdminRole | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const checkRole = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .in("role", ["admin", "moderator"]);

      if (data && data.length > 0) {
        const foundRole = data[0].role as AdminRole;
        setRole(foundRole);
        setIsAdmin(foundRole === "admin");
        setIsModerator(foundRole === "moderator");
      } else {
        setRole(null);
        setIsAdmin(false);
        setIsModerator(false);
      }
      setLoading(false);
    };

    checkRole();
  }, [userId]);

  return { role, isAdmin, isModerator, loading };
};
