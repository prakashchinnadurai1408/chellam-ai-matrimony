import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MessageCircle, Send, ArrowLeft, Search, Check, CheckCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { usePresence } from "@/hooks/usePresence";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import TypingIndicator from "@/components/TypingIndicator";

interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  updated_at: string;
  other_user: {
    first_name: string | null;
    last_name: string | null;
    photo_url: string | null;
    user_id: string;
  };
  last_message?: string;
  unread_count: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

const MessagesPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const startWithUserId = searchParams.get("with");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    const { data: convos } = await supabase
      .from("conversations")
      .select("*")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order("updated_at", { ascending: false });

    if (!convos) { setLoading(false); return; }

    const enriched: Conversation[] = [];
    for (const c of convos) {
      const otherUserId = c.user1_id === user.id ? c.user2_id : c.user1_id;

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, photo_url, user_id")
        .eq("user_id", otherUserId)
        .single();

      // Get last message
      const { data: lastMsg } = await supabase
        .from("messages")
        .select("content")
        .eq("conversation_id", c.id)
        .order("created_at", { ascending: false })
        .limit(1);

      // Get unread count
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", c.id)
        .eq("read", false)
        .neq("sender_id", user.id);

      enriched.push({
        ...c,
        other_user: profile || { first_name: "User", last_name: null, photo_url: null, user_id: otherUserId },
        last_message: lastMsg?.[0]?.content,
        unread_count: count || 0,
      });
    }
    setConversations(enriched);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Start conversation with a specific user (from URL param)
  useEffect(() => {
    if (!startWithUserId || !user || loading) return;
    const startConversation = async () => {
      // Check if conversation already exists
      const existing = conversations.find(
        (c) =>
          (c.user1_id === user.id && c.user2_id === startWithUserId) ||
          (c.user1_id === startWithUserId && c.user2_id === user.id)
      );
      if (existing) {
        setActiveConversation(existing.id);
        return;
      }

      // Create new conversation
      const { data, error } = await supabase
        .from("conversations")
        .insert({ user1_id: user.id, user2_id: startWithUserId })
        .select()
        .single();

      if (error) {
        // Try reverse order
        const { data: data2 } = await supabase
          .from("conversations")
          .insert({ user1_id: startWithUserId, user2_id: user.id })
          .select()
          .single();
        if (data2) {
          await fetchConversations();
          setActiveConversation(data2.id);
        }
      } else if (data) {
        await fetchConversations();
        setActiveConversation(data.id);
      }
    };
    startConversation();
  }, [startWithUserId, user, loading, conversations, fetchConversations]);

  // Fetch messages for active conversation
  useEffect(() => {
    if (!activeConversation) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", activeConversation)
        .order("created_at", { ascending: true });
      if (data) setMessages(data as Message[]);

      // Mark messages as read
      if (user) {
        await supabase
          .from("messages")
          .update({ read: true })
          .eq("conversation_id", activeConversation)
          .neq("sender_id", user.id)
          .eq("read", false);
      }
    };
    fetchMessages();
  }, [activeConversation, user]);

  // Realtime subscription
  useEffect(() => {
    if (!activeConversation) return;
    const channel = supabase
      .channel(`messages-${activeConversation}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConversation}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // Mark as read if from other user
          if (user && newMsg.sender_id !== user.id) {
            supabase
              .from("messages")
              .update({ read: true })
              .eq("id", newMsg.id)
              .then(() => {});
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeConversation, user]);

  useEffect(scrollToBottom, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || !user || sending) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      conversation_id: activeConversation,
      sender_id: user.id,
      content: newMessage.trim(),
    });
    if (error) {
      toast.error("Failed to send message");
    } else {
      setNewMessage("");
      inputRef.current?.focus();
    }
    setSending(false);
  };

  const activeConvo = conversations.find((c) => c.id === activeConversation);
  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery) return true;
    const name = [c.other_user.first_name, c.other_user.last_name].filter(Boolean).join(" ").toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "Now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const getInitials = (first: string | null, last: string | null) => {
    return ((first?.[0] || "") + (last?.[0] || "")).toUpperCase() || "U";
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">Sign in to message</h2>
            <p className="text-muted-foreground">Log in to start conversations with your matches.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 h-screen flex flex-col">
        <div className="flex-1 flex overflow-hidden">
          {/* Conversation List */}
          <aside
            className={`w-full md:w-[360px] border-r border-border bg-card flex flex-col shrink-0 ${
              activeConversation ? "hidden md:flex" : "flex"
            }`}
          >
            <div className="p-4 border-b border-border">
              <h2 className="font-display text-xl font-bold text-foreground mb-3">Messages</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground text-sm">Loading…</div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No conversations yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Visit a profile and click "Message" to start chatting.</p>
                </div>
              ) : (
                filteredConversations.map((convo) => (
                  <button
                    key={convo.id}
                    onClick={() => setActiveConversation(convo.id)}
                    className={`w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left border-b border-border/30 ${
                      activeConversation === convo.id ? "bg-muted/70" : ""
                    }`}
                  >
                    <Avatar className="w-12 h-12 shrink-0">
                      <AvatarImage src={convo.other_user.photo_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                        {getInitials(convo.other_user.first_name, convo.other_user.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-foreground truncate">
                          {[convo.other_user.first_name, convo.other_user.last_name].filter(Boolean).join(" ") || "User"}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {formatTime(convo.updated_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-muted-foreground truncate">
                          {convo.last_message || "Start a conversation"}
                        </p>
                        {convo.unread_count > 0 && (
                          <span className="ml-2 shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                            {convo.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </aside>

          {/* Chat Area */}
          <div
            className={`flex-1 flex flex-col ${
              !activeConversation ? "hidden md:flex" : "flex"
            }`}
          >
            {!activeConversation ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                  <h3 className="font-display text-xl font-semibold text-foreground mb-1">Select a conversation</h3>
                  <p className="text-sm text-muted-foreground">Choose a conversation to start messaging.</p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="h-16 border-b border-border bg-card flex items-center gap-3 px-4 shrink-0">
                  <button
                    className="md:hidden p-1"
                    onClick={() => setActiveConversation(null)}
                  >
                    <ArrowLeft className="w-5 h-5 text-foreground" />
                  </button>
                  {activeConvo && (
                    <>
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={activeConvo.other_user.photo_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {getInitials(activeConvo.other_user.first_name, activeConvo.other_user.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-sm text-foreground">
                          {[activeConvo.other_user.first_name, activeConvo.other_user.last_name].filter(Boolean).join(" ") || "User"}
                        </h3>
                      </div>
                    </>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <AnimatePresence initial={false}>
                    {messages.map((msg) => {
                      const isMine = msg.sender_id === user.id;
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm ${
                              isMine
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-muted text-foreground rounded-bl-md"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                            <div className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : ""}`}>
                              <span className={`text-[10px] ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                                {formatTime(msg.created_at)}
                              </span>
                              {isMine && (
                                msg.read
                                  ? <CheckCheck className="w-3 h-3 text-primary-foreground/60" />
                                  : <Check className="w-3 h-3 text-primary-foreground/40" />
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-border bg-card p-3">
                  <form
                    onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                    className="flex items-center gap-2"
                  >
                    <Input
                      ref={inputRef}
                      placeholder="Type a message…"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1"
                      autoFocus
                    />
                    <Button
                      type="submit"
                      variant="hero"
                      size="icon"
                      disabled={!newMessage.trim() || sending}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MessagesPage;
