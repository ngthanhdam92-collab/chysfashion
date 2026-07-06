"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getOrCreateSession, captureUtm, trackEvent } from "@/lib/analytics-client";

export function AnalyticsTracker() {
  const pathname = usePathname();
  const trackedPaths = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (trackedPaths.current.has(pathname)) return;
    trackedPaths.current.add(pathname);

    const { id: sessionId, isNew } = getOrCreateSession();

    // Capture UTM params on first page of session (they stay in the URL only on landing)
    if (isNew) captureUtm();

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "page_view",
        session_id: sessionId,
        page_path: pathname,
        referrer: isNew ? (document.referrer || "") : "",
        // UTM params are sent once per session on the first page view
        ...(isNew
          ? (() => {
              const params = new URLSearchParams(window.location.search);
              const utm_source   = params.get("utm_source");
              const utm_medium   = params.get("utm_medium");
              const utm_campaign = params.get("utm_campaign");
              return utm_source ? { utm_source, utm_medium, utm_campaign } : {};
            })()
          : {}),
      }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}

export { trackEvent };
