// src/contexts/ChatContext.tsx
// Lightweight global state for the AI chatbot open/close toggle.
// Follows the same pattern as TripCacheContext so the codebase stays consistent.
//
// Usage:
//   const { isChatOpen, setIsChatOpen } = useChatContext();
//
// Wired up in App.tsx: <ChatProvider> wraps the whole app.
// - ChatWidget reads isChatOpen to decide whether to render the panel.
// - AppNavigation's "Ask AI ✨" button calls setIsChatOpen(true).
// - The mobile FAB in ChatWidget calls setIsChatOpen(true) as before.

import { createContext, useContext, useState, ReactNode } from "react";

interface ChatContextType {
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  toggleChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => setIsChatOpen((prev) => !prev);

  return (
    <ChatContext.Provider value={{ isChatOpen, setIsChatOpen, toggleChat }}>
      {children}
    </ChatContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useChatContext = (): ChatContextType => {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChatContext must be used inside <ChatProvider>");
  }
  return ctx;
};
