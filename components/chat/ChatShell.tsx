"use client";

import { createContext, useContext, useState } from "react";
import { ChannelSidebar } from "./ChannelSidebar";

interface ChatShellCtx {
  openChannels: () => void;
}

const ChatCtx = createContext<ChatShellCtx | null>(null);

export function useChatShell() {
  return useContext(ChatCtx);
}

export function ChatShell({ children }: { children: React.ReactNode }) {
  const [channelsOpen, setChannelsOpen] = useState(false);

  return (
    <ChatCtx.Provider value={{ openChannels: () => setChannelsOpen(true) }}>
      <div className="-m-4 sm:-m-6 h-[calc(100vh-3.5rem)] flex overflow-hidden">
        <ChannelSidebar
          mobileOpen={channelsOpen}
          onClose={() => setChannelsOpen(false)}
        />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {children}
        </div>
      </div>
    </ChatCtx.Provider>
  );
}
