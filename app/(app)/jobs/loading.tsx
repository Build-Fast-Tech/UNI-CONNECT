/**
 * Instant skeleton for the Jobs (Career) page. The page fetches its listings
 * client-side, so this keeps navigation feeling immediate instead of blank.
 */
export default function JobsLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in" aria-busy="true" aria-label="Loading jobs">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 rounded-lg shimmer-skeleton" />
        <div className="h-10 w-28 rounded-xl shimmer-skeleton" />
      </div>
      <div className="h-11 w-full rounded-xl shimmer-skeleton" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl shimmer-skeleton flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/2 rounded shimmer-skeleton" />
              <div className="h-3 w-1/3 rounded shimmer-skeleton" />
            </div>
            <div className="h-8 w-20 rounded-lg shimmer-skeleton" />
          </div>
        ))}
      </div>
    </div>
  );
}
