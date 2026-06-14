/**
 * Loading UI for auth/onboarding routes. Renders inside the auth layout so the
 * user sees a spinner + message rather than a blank screen during transitions.
 */
export default function AuthLoading() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16" aria-busy="true" aria-label="Loading">
      <span className="h-9 w-9 rounded-full border-2 border-[rgb(var(--primary))] border-t-transparent animate-spin" />
      <p className="text-sm text-[rgb(var(--muted-fg))]">Loading…</p>
    </div>
  );
}
