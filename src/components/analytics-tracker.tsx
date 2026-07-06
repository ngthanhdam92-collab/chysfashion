"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getOrCreateSession, trackEvent } from "@/lib/analytics-client";

export function AnalyticsTracker() {
  const pathname = usePathname();
  const trackedPaths = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (trackedPaths.current.has(pathname)) return;
    trackedPaths.current.add(pathname);

    const { id: sessionId, isNew } = getOrCreateSession();

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "page_view",
        session_id: sessionId,
        page_path: pathname,
        // Only capture external referrer on session start
        referrer: isNew ? (document.referrer || "") : "",
      }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}

// Re-export for convenience
export { trackEvent };
