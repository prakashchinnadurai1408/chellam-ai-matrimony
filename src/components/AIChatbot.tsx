import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Mic, MicOff, Send, Loader2, Bot, User, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { postChat } from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `You are Chellam AI, a friendly and helpful virtual assistant for the Chellam Matrimony platform. You help users with:
- Navigating the app (dashboard, search, interests, messages, membership)
- Understanding features like AI matching, interest requests, shortlisting
- Membership plans (Free, Premium ₹499/mo, Concierge ₹1,999/mo)
- Profile creation and completion tips
- General matrimony guidance and support

Be warm, concise, and helpful. Use simple language. If asked to navigate, provide the URL path (e.g., "Go to /dashboard for your matches").
Keep responses under 3 sentences unless more detail is needed.`;

const AIChatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: "Vanakkam! 🙏 I'm Chellam AI. How can I help you today? You can type or tap the mic to speak." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const data = await postChat({
        messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        system_prompt: SYSTEM_PROMPT,
      });

      const reply = data?.reply || "Sorry, I couldn't process that. Please try again.";
      const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: reply };
      setMessages((prev) => [...prev, assistantMsg]);

      // Speak the response
      speakText(reply);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: "I'm having trouble connecting. Please try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading]);

  const speakText = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", content: "Voice input isn't supported in this browser. Please use Chrome or Edge." },
      ]);
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setListening(false);
      sendMessage(transcript);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full gradient-hero shadow-elevated flex items-center justify-center text-primary-foreground hover:scale-110 transition-transform"
          >
            <Bot className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-4rem)] bg-card border border-border rounded-2xl shadow-elevated flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="gradient-hero px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary-foreground">Chellam AI</p>
                  <p className="text-[10px] text-primary-foreground/70">
                    {speaking ? "Speaking..." : listening ? "Listening..." : "Online"}
                  </p>
                </div>
              </div>
              <button onClick={() => { setOpen(false); window.speechSynthesis.cancel(); }} className="text-primary-foreground/70 hover:text-primary-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full gradient-ai flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-primary-foreground" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5 text-primary" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full gradient-ai flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                  <div className="bg-muted px-4 py-2.5 rounded-2xl rounded-bl-md">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border shrink-0">
              <div className="flex gap-2">
                <Button
                  variant={listening ? "destructive" : "outline"}
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  onClick={toggleListening}
                  title={listening ? "Stop listening" : "Speak"}
                >
                  {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
                <Input
                  placeholder={listening ? "Listening..." : "Type a message..."}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                  disabled={listening}
                  className="flex-1"
                />
                <Button
                  variant="hero"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  onClick={() => sendMessage(input)}
                  disabled={loading || !input.trim()}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
              {listening && (
                <p className="text-[10px] text-center text-primary mt-1.5 animate-pulse">
                  🎤 Listening... Speak now
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatbot;
