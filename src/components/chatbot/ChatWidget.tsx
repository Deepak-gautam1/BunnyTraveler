import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CHATBOT_API = import.meta.env.VITE_CHATBOT_API || "http://localhost:8000";
const SESSION_ID = crypto.randomUUID();

const getTime = () =>
  new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content:
    "👋 Hi! I'm SafarSquad AI. Ask me anything about trips — budget, destination, dates, or travel style!",
  timestamp: getTime(),
};

const SUGGESTIONS = [
  "🏔️ Trek in Himachal under ₹5000",
  "🌊 Beach trip in Goa",
  "🧘 Spiritual trip to Rishikesh",
  "🏕️ Adventure camping weekend",
];

// ─── Bot Icon ─────────────────────────────────────────────────────────────────
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

// ─── Typing Indicator ─────────────────────────────────────────────────────────
const TypingIndicator = () => (
  <div className="flex justify-start">
    <div className="flex items-center gap-1.5 bg-muted px-4 py-3 rounded-2xl rounded-bl-none">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }}
        />
      ))}
    </div>
  </div>
);

// ─── Main Widget ──────────────────────────────────────────────────────────────
const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen) {
      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
        100,
      );
    }
  }, [messages, isOpen]);

  // Focus input when chat opens + clear unread badge
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const showSuggestions =
    messages.filter((m) => m.role === "user").length === 0;

  // ─── Close always wipes history (UNCHANGED AS REQUESTED) ────────────────
  const handleClose = () => {
    setMessages([{ ...WELCOME_MESSAGE, timestamp: getTime() }]);
    setInput("");
    setUnreadCount(0);
    setIsOpen(false);
  };

  const handleToggle = () => (isOpen ? handleClose() : setIsOpen(true));

  // ─── Send message ─────────────────────────────────────────────────────────
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
        signal: AbortSignal.timeout(30_000),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      const botReply = data.reply || data.message || data.response;
      if (!botReply) throw new Error("Empty reply from API");

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: botReply, timestamp: getTime() },
      ]);

      if (!isOpen) setUnreadCount((n) => n + 1);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I'm having trouble connecting right now. Please try again! 🙏",
          timestamp: getTime(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ─── Floating Action Button ───────────────────────────────────────── */}
      <button
        onClick={handleToggle}
        aria-label={isOpen ? "Close SafarSquad AI" : "Open SafarSquad AI"}
        className={`
          fixed z-[80] rounded-full shadow-xl
          flex items-center justify-center
          bg-gradient-to-br from-accent to-orange-500
          hover:scale-110 active:scale-95
          transition-all duration-200
          left-4 bottom-[76px] w-13 h-13
          md:left-auto md:right-6 md:bottom-20
        `}
        style={{ width: 52, height: 52 }}
      >
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-accent/30 animate-ping" />
        )}

        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 z-10 shadow">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}

        {isOpen ? (
          <ChevronDown className="w-5 h-5 text-white" />
        ) : (
          <BotIcon className="w-6 h-6 text-white" />
        )}
      </button>

      {/* ─── Mobile: Bottom Drawer ────────────────────────────────────────── */}
      <div
        className={`
          md:hidden fixed inset-x-0 bottom-0 z-[70]
          flex flex-col
          bg-background rounded-t-3xl shadow-2xl border-t border-border
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-y-0" : "translate-y-full"}
        `}
        style={{ height: "85dvh" }}
      >
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-muted-foreground/25 rounded-full" />
        </div>

        <ChatHeader onClose={handleClose} />
        <ChatMessages
          messages={messages}
          loading={loading}
          showSuggestions={showSuggestions}
          onSuggestion={sendMessage}
          bottomRef={bottomRef}
        />
        <ChatInput
          input={input}
          loading={loading}
          inputRef={inputRef}
          onChange={setInput}
          onSend={sendMessage}
          isMobile
        />
      </div>

      {/* ─── Desktop: Floating Window ─────────────────────────────────────── */}
      <div
        className={`
          hidden md:flex
          fixed right-6 z-[70]
          w-[360px] flex-col
          bg-background rounded-3xl shadow-2xl border border-border
          transition-all duration-300 ease-in-out origin-bottom-right
          ${
            isOpen
              ? "opacity-100 scale-100 pointer-events-auto"
              : "opacity-0 scale-90 pointer-events-none"
          }
        `}
        style={{
          bottom: 90,
          height: 520,
        }}
      >
        <ChatHeader onClose={handleClose} />
        <ChatMessages
          messages={messages}
          loading={loading}
          showSuggestions={showSuggestions}
          onSuggestion={sendMessage}
          bottomRef={bottomRef}
        />
        <ChatInput
          input={input}
          loading={loading}
          inputRef={inputRef}
          onChange={setInput}
          onSend={sendMessage}
        />
      </div>

      {/* Mobile backdrop — tap to close */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
          onClick={handleClose}
        />
      )}
    </>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const ChatHeader = ({ onClose }: { onClose: () => void }) => (
  <div className="bg-gradient-to-r from-accent to-orange-500 px-4 py-3 flex items-center justify-between shrink-0 rounded-t-3xl">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center shrink-0">
        <BotIcon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-white font-semibold text-sm leading-tight">
          SafarSquad AI
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
          <p className="text-white/75 text-xs">
            Online · Find your perfect trip
          </p>
        </div>
      </div>
    </div>
    <button
      onClick={onClose}
      aria-label="Close chat"
      className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"
    >
      <X className="w-4 h-4 text-white" />
    </button>
  </div>
);

interface ChatMessagesProps {
  messages: Message[];
  loading: boolean;
  showSuggestions: boolean;
  onSuggestion: (s: string) => void;
  bottomRef: React.RefObject<HTMLDivElement>;
}

const ChatMessages = ({
  messages,
  loading,
  showSuggestions,
  onSuggestion,
  bottomRef,
}: ChatMessagesProps) => (
  <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-hide">
    {messages.map((msg, i) => (
      <div
        key={i}
        className={`flex flex-col gap-0.5 ${msg.role === "user" ? "items-end" : "items-start"}`}
      >
        <div
          className={`
            max-w-[82%] px-3.5 py-2.5 text-sm leading-relaxed shadow-sm
            ${
              msg.role === "user"
                ? "bg-accent text-white rounded-2xl rounded-br-sm"
                : "bg-muted text-foreground rounded-2xl rounded-bl-sm"
            }
          `}
        >
          {msg.role === "assistant" ? (
            <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          ) : (
            msg.content
          )}
        </div>
        {msg.timestamp && (
          <span className="text-[10px] text-muted-foreground/60 px-1">
            {msg.timestamp}
          </span>
        )}
      </div>
    ))}

    {showSuggestions && !loading && (
      <div className="flex flex-col gap-2 pt-1">
        <p className="text-xs text-muted-foreground/60 px-1">
          Try asking about:
        </p>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSuggestion(s)}
            className="text-left text-xs px-3.5 py-2.5 rounded-xl border border-accent/30 text-accent hover:bg-accent/5 active:bg-accent/15 transition-colors font-medium"
          >
            {s}
          </button>
        ))}
      </div>
    )}

    {loading && <TypingIndicator />}
    <div ref={bottomRef} />
  </div>
);

interface ChatInputProps {
  input: string;
  loading: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  onChange: (v: string) => void;
  onSend: () => void;
  isMobile?: boolean;
}

const ChatInput = ({
  input,
  loading,
  inputRef,
  onChange,
  onSend,
  isMobile,
}: ChatInputProps) => (
  <div
    className={`
      px-3 py-3 border-t border-border bg-background flex gap-2 items-center shrink-0
      ${isMobile ? "" : "rounded-b-3xl"}
    `}
    style={
      isMobile
        ? { paddingBottom: "max(12px, env(safe-area-inset-bottom))" }
        : undefined
    }
  >
    <input
      ref={inputRef}
      type="text"
      value={input}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onSend()}
      placeholder="Ask about trips..."
      maxLength={500}
      className="flex-1 text-sm bg-muted rounded-full px-4 py-2.5 outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-accent/30 transition-all"
    />
    <Button
      size="icon"
      onClick={onSend}
      disabled={loading || !input.trim()}
      className="rounded-full w-10 h-10 bg-accent hover:bg-accent/90 active:scale-95 flex-shrink-0 shadow-md transition-all"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Send className="w-4 h-4" />
      )}
    </Button>
  </div>
);

export default ChatWidget;
