/**
 * Instant skeleton for the Communication / chat area. `/chat` runs a server
 * query and redirects to the global channel, so without this the message pane
 * is blank during that round-trip. Rendered inside ChatShell, so this only
 * fills the message thread region.
 */
export default function ChatLoading() {
  return (
    <div className="flex-1 flex flex-col p-4 gap-5 animate-fade-in" aria-busy="true" aria-label="Loading chat">
      <div className="h-6 w-40 rounded-lg shimmer-skeleton" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={`flex gap-3 ${i % 2 ? "flex-row-reverse" : ""}`}>
          <div className="h-9 w-9 rounded-full shimmer-skeleton flex-shrink-0" />
          <div className="flex flex-col gap-1.5 max-w-[60%]">
            <div className="h-3 w-24 rounded shimmer-skeleton" />
            <div className="h-10 w-64 max-w-full rounded-2xl shimmer-skeleton" />
          </div>
        </div>
      ))}
    </div>
  );
}
