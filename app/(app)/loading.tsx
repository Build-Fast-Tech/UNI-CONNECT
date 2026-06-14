/**
 * Route-segment loading UI for the authenticated app. Next.js renders this
 * inside the AppShell during navigation / data loading, so the user always sees
 * a skeleton instead of a blank or black screen.
 */
export default function AppLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl p-1 animate-fade-in" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-48 rounded-lg shimmer-skeleton mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
            <div className="h-10 w-10 rounded-xl shimmer-skeleton mb-4" />
            <div className="h-4 w-3/4 rounded shimmer-skeleton mb-2" />
            <div className="h-3 w-full rounded shimmer-skeleton mb-1.5" />
            <div className="h-3 w-5/6 rounded shimmer-skeleton" />
          </div>
        ))}
      </div>
    </div>
  );
}
