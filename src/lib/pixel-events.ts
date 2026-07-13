// Client-side helpers to fire tracking events on FB Pixel and TikTok Pixel.
// Call these only from "use client" components (window is available).

export function trackPurchase(params: { value: number; orderId: string }) {
  if (typeof window === "undefined") return;
  const { value, orderId } = params;

  if (window.fbq) {
    window.fbq("track", "Purchase", {
      value,
      currency: "VND",
      content_ids: [orderId],
      content_type: "product",
    });
  }

  if (window.ttq) {
    window.ttq.track("PlaceAnOrder", {
      value,
      currency: "VND",
      order_id: orderId,
    });
  }
}

export function trackInitiateCheckout(params: { value: number }) {
  if (typeof window === "undefined") return;
  const { value } = params;

  if (window.fbq) {
    window.fbq("track", "InitiateCheckout", { value, currency: "VND" });
  }
  if (window.ttq) {
    window.ttq.track("InitiateCheckout", { value, currency: "VND" });
  }
}

export function trackPageView() {
  if (typeof window === "undefined") return;
  if (window.fbq) window.fbq("track", "PageView");
  if (window.ttq) window.ttq.track("ViewContent");
}
