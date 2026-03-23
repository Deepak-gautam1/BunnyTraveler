import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

const CHATBOT_API = import.meta.env.VITE_CHATBOT_API || "http://localhost:8000";
const STORAGE_KEY = "safarsquad_chat_history";
const SESSION_ID = crypto.randomUUID(); // ✅ stable per browser session

const getTime = () =>
  new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

// ─── Quick suggestions shown before user sends first message ──────────────────
const SUGGESTIONS = [
  "🏔️ Trek in Himachal under ₹5000",
  "🌊 Beach trip in Goa",
  "🧘 Spiritual trip to Rishikesh",
  "🏕️ Adventure camping trip",
];

// ─── Custom Bot Icon ───────────────────────────────────────────────────────────
const BotIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
  >
    <rect x="3" y="8" width="18" height="13" rx="3" />
    <path d="M8 8V6a4 4 0 0 1 8 0v2" />
    <circle cx="9" cy="14" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="15" cy="14" r="1.2" fill="currentColor" stroke="none" />
    <path d="M9.5 17.5c.8.7 4.2.7 5 0" strokeLinecap="round" />
    <line x1="12" y1="3" x2="12" y2="5" strokeLinecap="round" />
  </svg>
);

// ─── Typing indicator ─────────────────────────────────────────────────────────
const TypingIndicator = () => (
  <div className="flex justify-start">
    <div className="flex items-center gap-1 bg-muted px-4 py-3 rounded-2xl rounded-bl-none">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }}
        />
      ))}
    </div>
  </div>
);

// ─── Main Widget ──────────────────────────────────────────────────────────────
const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0); // ✅ unread badge

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore parse errors and start fresh
    }
    return [
      {
        role: "assistant",
        content:
          "👋 Hi! I'm SafarSquad AI. Ask me anything about trips — budget, destination, dates, travel style!",
        timestamp: getTime(),
      },
    ];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Persist chat history
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // ✅ Clear unread badge when user opens chat
  useEffect(() => {
    if (isOpen) setUnreadCount(0);
  }, [isOpen]);

  // ✅ Show suggestions only if no user message yet
  const showSuggestions =
    messages.filter((m) => m.role === "user").length === 0;

  const sendMessage = async (overrideMessage?: string) => {
    const userMessage = (overrideMessage ?? input).trim();
    if (!userMessage || loading) return;
    setInput("");

    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage, timestamp: getTime() },
    ]);
    setLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch(`${CHATBOT_API}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": SESSION_ID,
        },
        body: JSON.stringify({ message: userMessage, history }),
        signal: AbortSignal.timeout(30000), // ✅ 30 second timeout
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply, timestamp: getTime() },
      ]);

      // ✅ Increment unread badge if chat is closed
      if (!isOpen) setUnreadCount((n) => n + 1);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble connecting. Please try again!",
          timestamp: getTime(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    const initial = [
      {
        role: "assistant" as const,
        content:
          "👋 Hi! I'm SafarSquad AI. Ask me anything about trips — budget, destination, dates, travel style!",
        timestamp: getTime(),
      },
    ];
    setMessages(initial);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  };

  return (
    <>
      {/* ─── Floating Button ───────────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        // ✅ bottom-24 on mobile (safe above bottom nav), bottom-8 on desktop
        className="fixed bottom-24 md:bottom-8 right-4 z-50 w-14 h-14 bg-accent rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform"
        aria-label="Open SafarSquad AI"
      >
        {!isOpen && (
          <span className="absolute w-14 h-14 rounded-full bg-accent/40 animate-ping" />
        )}

        {/* ✅ Unread badge */}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center z-10">
            {unreadCount}
          </span>
        )}

        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <BotIcon className="w-7 h-7 text-white" />
        )}
      </button>

      {/* ─── Chat Window ───────────────────────────────────────────────────── */}
      <div
        className={`fixed bottom-40 md:bottom-24 right-4 z-50 w-[340px] h-[500px] flex flex-col overflow-hidden
          rounded-3xl shadow-2xl border border-border bg-background
          transition-all duration-300 ease-in-out origin-bottom-right
          ${isOpen ? "scale-100 opacity-100 pointer-events-auto" : "scale-75 opacity-0 pointer-events-none"}
        `}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-accent to-orange-500 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
              <BotIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">
                SafarSquad AI
              </p>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
                <p className="text-white/80 text-xs">
                  Online • Find your perfect trip
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={clearHistory}
            className="text-white/60 hover:text-white text-xs transition-colors"
          >
            Clear
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-hide">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col gap-0.5 ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed shadow-sm
                  ${
                    msg.role === "user"
                      ? "bg-accent text-white rounded-2xl rounded-br-sm"
                      : "bg-muted text-foreground rounded-2xl rounded-bl-sm"
                  }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
              {msg.timestamp && (
                <span className="text-[10px] text-muted-foreground px-1">
                  {msg.timestamp}
                </span>
              )}
            </div>
          ))}

          {/* ✅ Suggestion chips — only before first user message */}
          {showSuggestions && !loading && (
            <div className="flex flex-col gap-1.5 pt-1">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-left text-xs px-3 py-2 rounded-xl border border-accent/30 text-accent hover:bg-accent/10 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-3 py-3 border-t border-border bg-background flex gap-2 items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask about trips..."
            maxLength={500}
            className="flex-1 text-sm bg-muted rounded-full px-4 py-2.5 outline-none placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-accent/30 transition-all"
          />
          <Button
            size="icon"
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="rounded-full w-10 h-10 bg-accent hover:bg-accent/90 flex-shrink-0 shadow-md"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center py-1.5 text-[10px] text-muted-foreground/50 bg-background">
          Powered by SafarSquad AI ✦
        </div>
      </div>
    </>
  );
};

export default ChatWidget;
