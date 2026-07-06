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

export function trackEvent(
  eventType: "page_view" | "add_to_cart",
  extra?: { page_path?: string; referrer?: string; product_id?: string }
) {
  const sessionId = getSessionId();
  if (!sessionId) return;
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event_type: eventType, session_id: sessionId, ...extra }),
  }).catch(() => {});
}
