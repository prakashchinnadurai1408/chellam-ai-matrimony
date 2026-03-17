import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TypingIndicatorHook {
  isOtherTyping: boolean;
  sendTyping: () => void;
}

export const useTypingIndicator = (
  conversationId: string | null,
  currentUserId: string | undefined
): TypingIndicatorHook => {
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendThrottleRef = useRef<number>(0);

  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const channel = supabase.channel(`typing-${conversationId}`);

    channel
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload?.user_id !== currentUserId) {
          setIsOtherTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsOtherTyping(false), 3000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [conversationId, currentUserId]);

  const sendTyping = useCallback(() => {
    if (!conversationId || !currentUserId) return;
    const now = Date.now();
    if (now - sendThrottleRef.current < 2000) return;
    sendThrottleRef.current = now;

    supabase.channel(`typing-${conversationId}`).send({
      type: "broadcast",
      event: "typing",
      payload: { user_id: currentUserId },
    });
  }, [conversationId, currentUserId]);

  return { isOtherTyping, sendTyping };
};
