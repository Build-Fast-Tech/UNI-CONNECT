"use client";

/**
 * global-error.tsx — catches errors that escape the root layout.
 * This must render its own <html> + <body> since the layout has crashed.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "16px",
          background: "#0a0a0a",
          color: "#fafafa",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#f97316"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>

        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: "14px", color: "#888", maxWidth: "360px" }}>
            An unexpected error occurred. This is usually temporary — try
            reloading the page.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={reset}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              background: "#f97316",
              color: "#fff",
              border: "none",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          <button
            onClick={() => (window.location.href = "/feed")}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              background: "#222",
              color: "#fafafa",
              border: "1px solid #333",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Go to Feed
          </button>
        </div>
      </body>
    </html>
  );
}
