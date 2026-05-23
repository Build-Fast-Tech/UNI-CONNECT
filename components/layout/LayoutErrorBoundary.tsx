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
              height: "100vh",
              gap: "12px",
              fontFamily: "sans-serif",
              color: "#fff",
              background: "#000",
            }}
          >
            <p style={{ fontSize: 14, opacity: 0.6 }}>Layout error — please reload</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "8px 20px",
                borderRadius: 12,
                background: "#6366f1",
                color: "#fff",
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
