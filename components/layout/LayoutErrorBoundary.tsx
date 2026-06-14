"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}
interface State {
  hasError: boolean;
  errorMsg: string;
}

/**
 * Class-based error boundary that wraps layout-level components (Sidebar,
 * Topbar). Because Next.js error.tsx cannot catch errors thrown by the layout
 * itself, any crash in AppShell bypasses (app)/error.tsx and goes straight to
 * global-error.tsx. This boundary intercepts those crashes locally and shows a
 * minimal fallback instead of nuking the entire page.
 */
export class LayoutErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMsg: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error?.message ?? "Unknown error" };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[LayoutErrorBoundary] caught:", error.message, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "60vh",
              width: "100%",
              gap: "12px",
              padding: "24px",
              textAlign: "center",
              fontFamily: "var(--font-geist-sans, system-ui, sans-serif)",
              color: "rgb(var(--fg))",
              background: "rgb(var(--bg))",
            }}
          >
            <p style={{ fontSize: 16, fontWeight: 700 }}>Something went wrong</p>
            <p style={{ fontSize: 14, opacity: 0.6, maxWidth: 360 }}>
              A part of the page failed to load. Reloading usually fixes it.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 22px",
                borderRadius: 12,
                background: "rgb(var(--primary))",
                color: "rgb(var(--primary-fg))",
                border: "none",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Reload
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
