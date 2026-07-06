// Browser-only helpers — never import this from Server Components

export function getOrCreateSession(): { id: string; isNew: boolean } {
  try {
    const stored = sessionStorage.getItem("chys_sid");
    if (stored) return { id: stored, isNew: false };
    const id = "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    sessionStorage.setItem("chys_sid", id);
    return { id, isNew: true };
  } catch {
    return { id: "s" + Date.now().toString(36), isNew: true };
  }
}

export function getSessionId(): string {
  try {
    return sessionStorage.getItem("chys_sid") ?? "";
  } catch {
    return "";
  }
}

// Capture UTM params from URL and persist for the whole session.
// If UTM params are present they override referrer-based source detection.
export function captureUtm(): { utm_source?: string; utm_medium?: string; utm_campaign?: string } {
  try {
    // Return cached value if already captured this session
    const cached = sessionStorage.getItem("chys_utm");
    if (cached) return JSON.parse(cached);

    const params = new URLSearchParams(window.location.search);
    const utm_source   = params.get("utm_source")   ?? undefined;
    const utm_medium   = params.get("utm_medium")   ?? undefined;
    const utm_campaign = params.get("utm_campaign") ?? undefined;

    if (utm_source) {
      const utm = { utm_source, utm_medium, utm_campaign };
      sessionStorage.setItem("chys_utm", JSON.stringify(utm));
      return utm;
    }
    return {};
  } catch {
    return {};
  }
}

export function getStoredUtm(): { utm_source?: string; utm_medium?: string; utm_campaign?: string } {
  try {
    const cached = sessionStorage.getItem("chys_utm");
    return cached ? JSON.parse(cached) : {};
  } catch {
    return {};
  }
}

export function trackEvent(
  eventType: "page_view" | "add_to_cart",
  extra?: { page_path?: string; referrer?: string; product_id?: string }
) {
  const sessionId = getSessionId();
  if (!sessionId) return;
  const utm = getStoredUtm();
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event_type: eventType, session_id: sessionId, ...utm, ...extra }),
  }).catch(() => {});
}
