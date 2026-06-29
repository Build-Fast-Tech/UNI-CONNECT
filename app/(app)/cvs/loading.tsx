/**
 * Instant skeleton for the CV Center. The page loads CVs client-side, so this
 * shows a page-shaped placeholder the moment the link is clicked.
 */
export default function CvsLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in" aria-busy="true" aria-label="Loading CV Center">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-44 rounded-lg shimmer-skeleton" />
          <div className="h-4 w-72 max-w-full rounded shimmer-skeleton" />
        </div>
        <div className="h-10 w-28 rounded-xl shimmer-skeleton" />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl shimmer-skeleton" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-2/3 rounded shimmer-skeleton" />
                <div className="h-3 w-1/3 rounded shimmer-skeleton" />
              </div>
            </div>
            <div className="h-3 w-full rounded shimmer-skeleton" />
            <div className="flex gap-1.5">
              <div className="h-5 w-14 rounded-md shimmer-skeleton" />
              <div className="h-5 w-14 rounded-md shimmer-skeleton" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
