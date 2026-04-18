import { ChannelSidebar } from "@/components/chat/ChannelSidebar";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-4 sm:-m-6 h-[calc(100vh-3.5rem)] flex overflow-hidden">
      <ChannelSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
