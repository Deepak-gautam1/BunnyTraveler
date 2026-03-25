import { useRef, useEffect } from "react";
import {
  Send,
  Loader2,
  ChevronDown,
  ThumbsUp,
  ThumbsDown,
  MapPin,
  Calendar,
  IndianRupee,
  Users,
  Navigation,
  Mic,
  MicOff,
  Bot,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { useNavigate, useLocation } from "react-router-dom";
import useGeolocation from "@/hooks/useGeolocation";
import remarkGfm from "remark-gfm";
import { useChatContext } from "@/contexts/ChatContext";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Trip {
  id: number;
  destination: string;
  start_city: string;
  start_date: string;
  end_date: string;
  budget_per_person: number | null;
  max_participants: number | null;
  current_participants: number | null;
  travel_style: string[];
  description?: string;
  distance_km?: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  trips?: Trip[];
  search_mode?: "semantic" | "nearby";
  suggestions?: string[];
  feedbackGiven?: boolean;
  timestamp?: string;
  streaming?: boolean;
}

interface SSEEvent {
  type: string;
  content?: string;
  trips?: Trip[];
  search_mode?: string;
  suggestions?: string[];
  tool?: string;
  args?: Record<string, unknown>;
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

const QUICK_SUGGESTIONS = [
  "🏔️ Trek in Himachal under ₹5000",
  "🌊 Beach trip in Goa",
  "🧘 Spiritual trip to Rishikesh",
  "🏕️ Show me nearby trips",
];

// ─── Typing Indicator ─────────────────────────────────────────────────────────
const TypingIndicator = () => (
  <div className="flex items-center gap-1 px-3 py-2">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-2 h-2 rounded-full bg-orange-400 animate-bounce"
        style={{ animationDelay: `${i * 0.15}s` }}
      />
    ))}
  </div>
);

// ─── Inline Trip Card ─────────────────────────────────────────────────────────
const InlineTripCard = ({
  trip,
  onClose,
}: {
  trip: Trip;
  onClose: () => void;
}) => {
  const navigate = useNavigate();
  const maxP = trip.max_participants ?? 0;
  const currP = trip.current_participants ?? 0;
  const spotsLeft = maxP - currP;

  const urgencyClasses =
    spotsLeft <= 2
      ? "bg-red-100 text-red-700"
      : spotsLeft <= 5
        ? "bg-orange-100 text-orange-700"
        : "bg-emerald-100 text-emerald-700";

  const budgetDisplay =
    trip.budget_per_person != null
      ? `₹${trip.budget_per_person.toLocaleString("en-IN")}`
      : "TBD";

  return (
    <div
      onClick={() => {
        if (!trip.id) return;
        navigate(`/trip/${trip.id}`);
        onClose();
      }}
      className="mt-3 border border-orange-200 rounded-2xl p-4 bg-gradient-to-b from-orange-50/80 to-white hover:from-orange-100 hover:to-orange-50 cursor-pointer transition-all shadow-sm hover:shadow-md group"
    >
      <div className="flex items-start justify-between mb-3 gap-2">
        <span className="font-bold text-gray-800 group-hover:text-orange-600 transition-colors text-[15px] leading-tight">
          {trip.destination}
        </span>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${urgencyClasses}`}
          >
            {spotsLeft} spots left
          </span>
          {trip.distance_km != null && (
            <span className="text-[10px] text-blue-500 font-semibold flex items-center gap-0.5 mt-1">
              <Navigation className="w-2.5 h-2.5" />
              {trip.distance_km} km
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-[13px] text-gray-600 font-medium">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-gray-400" />
          <span className="truncate">{trip.start_city}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <IndianRupee className="w-3.5 h-3.5 text-gray-400" />
          <span className="truncate">{budgetDisplay}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          <span className="truncate">
            {new Date(trip.start_date).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-gray-400" />
          <span className="truncate">{trip.travel_style[0] || "Open"}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-orange-100 text-right">
        <span className="text-[13px] text-orange-500 font-bold group-hover:text-orange-600 transition-colors flex items-center justify-end gap-1">
          View Details <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
        </span>
      </div>
    </div>
  );
};

// ─── Streaming cursor ─────────────────────────────────────────────────────────
const StreamCursor = () => (
  <span className="inline-block w-[2px] h-[14px] bg-orange-400 ml-[1px] align-middle animate-pulse" />
);

// ─── Voice Input Hook ─────────────────────────────────────────────────────────
function useVoiceInput(onTranscript: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    type SpeechRecognitionCtor = new () => SpeechRecognition;
    type SpeechWindow = Window & {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const SR =
      (window as SpeechWindow).SpeechRecognition ||
      (window as SpeechWindow).webkitSpeechRecognition;
    if (!SR) return;
    setSupported(true);

    const r: SpeechRecognition = new SR();
    r.continuous = false;
    r.interimResults = true;
    r.lang = "en-IN";

    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    r.onerror = (e) => {
      setListening(false);
      if (e.error === "not-allowed")
        alert("Microphone access denied. Please allow it in browser settings.");
    };
    r.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map((res) => res[0].transcript)
        .join("");
      onTranscript(transcript);
    };

    recognitionRef.current = r;
  }, [onTranscript]);

  const toggle = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  return { listening, supported, toggle };
}

// ─── Page Sensing Hook ────────────────────────────────────────────────────────
function useCurrentTripId(): number | null {
  const location = useLocation();
  const match = location.pathname.match(/^\/trips?\/(\d+)/);
  if (match && match[1]) {
    const id = parseInt(match[1], 10);
    return isNaN(id) ? null : id;
  }
  return null;
}

// ─── Main Widget ──────────────────────────────────────────────────────────────
export default function ChatWidget() {
  // ── Global open/close state (shared with Navbar "Ask AI" button) ─────────
  const { isChatOpen, setIsChatOpen } = useChatContext();

  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Tooltip — shown once until dismissed, desktop only (handled via CSS md:hidden)
  const [showTooltip, setShowTooltip] = useState(
    () => !localStorage.getItem("ai_tooltip_seen"),
  );

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { location, isLocationAvailable } = useGeolocation();
  const locationActive =
    isLocationAvailable &&
    location.latitude !== null &&
    location.longitude !== null;

  const currentTripId = useCurrentTripId();

  const {
    listening,
    supported,
    toggle: toggleMic,
  } = useVoiceInput((transcript) => {
    setInput(transcript);
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isChatOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isChatOpen]);

  const handleOpenChat = () => {
    setIsChatOpen(true);
    if (showTooltip) {
      localStorage.setItem("ai_tooltip_seen", "true");
      setShowTooltip(false);
    }
  };

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = {
      role: "user",
      content: trimmed,
      timestamp: getTime(),
    };

    const historyForAPI = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-8)
      .map(({ role, content }) => ({ role, content }));

    const botPlaceholder: Message = {
      role: "assistant",
      content: "",
      streaming: true,
      timestamp: getTime(),
    };

    setMessages((prev) => [...prev, userMsg, botPlaceholder]);
    setInput("");
    setIsLoading(true);

    try {
      const payload: Record<string, unknown> = {
        message: trimmed,
        history: historyForAPI,
        session_id: SESSION_ID,
      };

      if (locationActive && location.latitude && location.longitude) {
        payload.lat = location.latitude;
        payload.lng = location.longitude;
      }

      if (currentTripId !== null) {
        payload.current_trip_id = currentTripId;
      }

      const res = await fetch(`${CHATBOT_API}/chat-stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": SESSION_ID,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;

          let event: SSEEvent;
          try {
            event = JSON.parse(line.slice(5).trim()) as SSEEvent;
          } catch {
            continue;
          }

          if (event.type === "token" && event.content) {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              updated[updated.length - 1] = {
                ...last,
                content: last.content + event.content,
              };
              return updated;
            });
          } else if (event.type === "tool_call") {
            let statusMessage = "⚙️ Thinking...";
            if (event.tool === "get_live_weather")
              statusMessage = `🌤️ Checking weather for ${event.args?.destination || "location"}...`;
            else if (event.tool === "compare_specific_trips")
              statusMessage = "🔍 Fetching trips to compare...";

            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: statusMessage,
              };
              return updated;
            });
          } else if (event.type === "content_fix" && event.content) {
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: event.content ?? "",
              };
              return updated;
            });
          } else if (
            event.type === "suggestions" &&
            Array.isArray(event.suggestions)
          ) {
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                suggestions: event.suggestions,
              };
              return updated;
            });
          } else if (event.type === "trips") {
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                trips: event.trips ?? [],
                search_mode: (event.search_mode ?? "semantic") as
                  | "semantic"
                  | "nearby",
                streaming: false,
                feedbackGiven: false,
              };
              return updated;
            });
          } else if (event.type === "done") {
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                streaming: false,
              };
              return updated;
            });
          } else if (event.type === "error" && event.content) {
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: event.content ?? "",
                streaming: false,
              };
              return updated;
            });
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: "⚠️ Something went wrong. Please try again!",
          streaming: false,
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Feedback ───────────────────────────────────────────────────────────────
  const submitFeedback = async (
    msgIndex: number,
    rating: 1 | -1,
    userMessage: string,
    botReply: string,
    trips: Trip[],
  ) => {
    setMessages((prev) =>
      prev.map((m, i) => (i === msgIndex ? { ...m, feedbackGiven: true } : m)),
    );
    try {
      await fetch(`${CHATBOT_API}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: SESSION_ID,
          user_message: userMessage,
          bot_reply: botReply,
          rating,
          trip_ids: trips.map((t) => t.id),
        }),
      });
    } catch {
      /* best-effort */
    }
  };

  return (
    <>
      {/*
        ─── Mobile-only FAB ────────────────────────────────────────────────────
        Hidden on md+ because the Navbar "Ask AI ✨" button takes over on desktop.
        Sits above the mobile bottom nav (bottom-[85px]).
      */}
      {!isChatOpen && (
        <div className="md:hidden">
          {showTooltip && (
            <div
              className="fixed z-40 bottom-[150px] right-4
                          bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg
                          shadow-lg whitespace-nowrap"
            >
              Ask AI ✨
              <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45" />
            </div>
          )}
          <button
            onClick={handleOpenChat}
            className="fixed z-50 right-4 bottom-[85px] w-12 h-12
                       flex items-center justify-center rounded-full
                       bg-gradient-to-tr from-orange-500 to-rose-500 text-white
                       shadow-[0_8px_30px_rgb(249,115,22,0.4)]
                       transition-transform hover:scale-105 active:scale-95"
            aria-label="Open SafarSquad AI"
          >
            <Bot className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* ─── Dark backdrop (mobile bottom sheet only) ──────────────────────── */}
      {isChatOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] md:hidden"
          onClick={() => setIsChatOpen(false)}
        />
      )}

      {/* ─── Chat panel ───────────────────────────────────────────────────── */}
      {isChatOpen && (
        <div
          className="fixed z-[70] flex flex-col bg-white shadow-[0_0_40px_rgba(0,0,0,0.15)] overflow-hidden
            /* Mobile: full-width bottom sheet */
            bottom-0 left-0 right-0 w-full h-[85dvh] rounded-t-[32px]
            /* Desktop: floating panel anchored bottom-right */
            md:bottom-24 md:right-6 md:left-auto md:w-[400px] md:h-[650px] md:rounded-3xl md:border md:border-gray-200"
        >
          {/* ── Header ── */}
          <div className="flex flex-col bg-gradient-to-r from-orange-500 to-rose-500 text-white shrink-0">
            {/* Mobile drag handle */}
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 bg-white/30 rounded-full" />
            </div>

            <div className="flex items-center gap-3 px-4 py-3 md:py-4">
              <div className="relative flex items-center justify-center w-10 h-10 bg-white/20 rounded-full backdrop-blur-sm shrink-0">
                <Bot className="w-6 h-6 text-white" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-rose-500 rounded-full" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base leading-tight tracking-wide">
                  SafarSquad AI
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Sparkles className="w-3 h-3 text-orange-200" />
                  <p className="text-[11px] text-orange-100 font-medium">
                    Find your perfect trip
                  </p>
                  {locationActive && (
                    <span className="flex items-center gap-0.5 text-[9px] bg-black/10 rounded-full px-1.5 py-0.5 ml-1 border border-white/10 font-medium tracking-wide">
                      <Navigation className="w-2.5 h-2.5" />
                      {location.city ?? "Location"}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Close chat"
              >
                <ChevronDown className="w-6 h-6 md:hidden" />
                <X className="w-5 h-5 hidden md:block" />
              </button>
            </div>
          </div>

          {/* ── Messages ── */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 bg-[#f9fafb] min-h-0">
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {QUICK_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-xs font-medium px-3.5 py-2 rounded-full border border-orange-200 bg-white hover:bg-orange-50 text-orange-600 transition-colors shadow-sm"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg, idx) => {
              const isBot = msg.role === "assistant";
              const prevUserMsg = isBot
                ? messages
                    .slice(0, idx)
                    .reverse()
                    .find((m) => m.role === "user")
                : null;

              return (
                <div
                  key={idx}
                  className={`flex flex-col ${isBot ? "items-start" : "items-end"}`}
                >
                  <div className="max-w-[88%]">
                    {isBot && msg.search_mode === "nearby" && (
                      <div className="flex items-center gap-1 mb-1.5 ml-2">
                        <Navigation className="w-3 h-3 text-blue-500" />
                        <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                          Nearby Search
                        </span>
                      </div>
                    )}

                    <div
                      className={`px-4 py-3 text-[15px] leading-relaxed shadow-sm ${
                        isBot
                          ? "bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-tl-sm"
                          : "bg-gradient-to-br from-orange-500 to-rose-500 text-white rounded-2xl rounded-tr-sm"
                      }`}
                    >
                      {isBot ? (
                        msg.content === "" && msg.streaming ? (
                          <TypingIndicator />
                        ) : (
                          <>
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                a: ({ href, children }) => (
                                  <a
                                    href={href}
                                    className="text-orange-500 font-medium underline underline-offset-2"
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {children}
                                  </a>
                                ),
                                p: ({ children }) => (
                                  <p className="mb-2 last:mb-0">{children}</p>
                                ),
                                strong: ({ children }) => (
                                  <strong className="font-bold text-gray-900">
                                    {children}
                                  </strong>
                                ),
                                ul: ({ children }) => (
                                  <ul className="list-disc pl-4 mb-2 space-y-1">
                                    {children}
                                  </ul>
                                ),
                                table: ({ children }) => (
                                  <div className="overflow-x-auto my-3 rounded-xl border border-gray-200 text-[13px]">
                                    <table className="w-full border-collapse bg-white">
                                      {children}
                                    </table>
                                  </div>
                                ),
                                thead: ({ children }) => (
                                  <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
                                    {children}
                                  </thead>
                                ),
                                tbody: ({ children }) => (
                                  <tbody className="divide-y divide-gray-100">
                                    {children}
                                  </tbody>
                                ),
                                tr: ({ children }) => (
                                  <tr className="hover:bg-gray-50/50 transition-colors">
                                    {children}
                                  </tr>
                                ),
                                th: ({ children }) => (
                                  <th className="px-3 py-2.5 text-left font-bold whitespace-nowrap">
                                    {children}
                                  </th>
                                ),
                                td: ({ children }) => (
                                  <td className="px-3 py-2.5 text-gray-700 align-top">
                                    {children}
                                  </td>
                                ),
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                            {msg.streaming && <StreamCursor />}
                          </>
                        )
                      ) : (
                        msg.content
                      )}
                    </div>

                    {isBot &&
                      !msg.streaming &&
                      msg.trips &&
                      msg.trips.length > 0 && (
                        <div className="space-y-2 mt-1">
                          {msg.trips.map((trip) => (
                            <InlineTripCard
                              key={trip.id}
                              trip={trip}
                              onClose={() => setIsChatOpen(false)}
                            />
                          ))}
                        </div>
                      )}

                    <div
                      className={`flex items-center mt-1.5 ${isBot ? "justify-start ml-2" : "justify-end mr-2"}`}
                    >
                      {msg.timestamp && !msg.streaming && (
                        <span className="text-[10px] text-gray-400 font-medium">
                          {msg.timestamp}
                        </span>
                      )}

                      {isBot &&
                        idx > 0 &&
                        !msg.streaming &&
                        !msg.feedbackGiven && (
                          <div className="flex items-center gap-1.5 ml-4">
                            <button
                              onClick={() =>
                                submitFeedback(
                                  idx,
                                  1,
                                  prevUserMsg?.content ?? "",
                                  msg.content,
                                  msg.trips ?? [],
                                )
                              }
                              className="p-1 rounded hover:bg-green-50 text-gray-400 hover:text-green-500 transition-colors"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                submitFeedback(
                                  idx,
                                  -1,
                                  prevUserMsg?.content ?? "",
                                  msg.content,
                                  msg.trips ?? [],
                                )
                              }
                              className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      {isBot &&
                        idx > 0 &&
                        !msg.streaming &&
                        msg.feedbackGiven && (
                          <span className="text-[10px] text-green-600 font-medium ml-4">
                            Thanks! 🙏
                          </span>
                        )}
                    </div>

                    {isBot &&
                      !msg.streaming &&
                      msg.suggestions &&
                      msg.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3 ml-1">
                          {msg.suggestions.map((s) => (
                            <button
                              key={s}
                              onClick={() => sendMessage(s)}
                              className="text-[12px] font-medium px-3 py-1.5 rounded-full border border-orange-200 bg-white hover:bg-orange-500 hover:text-white hover:border-orange-500 text-orange-600 transition-all duration-200 shadow-sm"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} className="h-2" />
          </div>

          {/* ── Input bar ── */}
          <div
            className="p-3 bg-white border-t border-gray-100 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]"
            style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
          >
            <div
              className={`flex items-center gap-2 bg-[#f9fafb] border rounded-2xl px-3 py-2 transition-all
              ${
                listening
                  ? "border-orange-400 ring-4 ring-orange-100 bg-orange-50"
                  : "border-gray-200 focus-within:border-orange-400 focus-within:ring-4 focus-within:ring-orange-100 focus-within:bg-white"
              }`}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder={
                  listening
                    ? "🎙️ Listening..."
                    : "Ask about trips, budget, destinations..."
                }
                className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-gray-400 min-w-0"
                maxLength={500}
                disabled={isLoading}
              />

              {supported && (
                <button
                  onClick={() => {
                    if (listening) setInput("");
                    toggleMic();
                  }}
                  type="button"
                  aria-label={listening ? "Stop recording" : "Voice input"}
                  className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all
                    ${
                      listening
                        ? "bg-rose-500 text-white animate-pulse shadow-md"
                        : "text-gray-400 hover:text-rose-500 hover:bg-rose-50"
                    }`}
                >
                  {listening ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>
              )}

              <Button
                size="icon"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="h-8 w-8 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 flex-shrink-0 shadow-sm transition-transform active:scale-95"
                aria-label="Send message"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Send className="w-4 h-4 text-white ml-0.5" />
                )}
              </Button>
            </div>
            <p className="text-center text-[11px] font-medium text-gray-400 mt-2">
              Powered by SafarSquad AI
              {listening && (
                <span className="text-rose-500 ml-1 animate-pulse">
                  · 🎙️ Recording
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
