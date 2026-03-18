import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useAdminRole = (userId: string | undefined) => {
  const [isAdmin, setIsAdmin] = useState(false);
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
        .eq("role", "admin");

      setIsAdmin(!!data && data.length > 0);
      setLoading(false);
    };

    checkRole();
  }, [userId]);

  return { isAdmin, loading };
};
