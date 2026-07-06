import { createClient } from "./supabase/server";

export interface TrafficData {
  totalPageViews: number;
  uniqueSessions: number;
  productViewSessions: number;
  cartSessions: number;
  topPages: { path: string; views: number }[];
  sourceBreakdown: { source: string; sessions: number; pct: number }[];
  dailyStats: { date: string; sessions: number; pageViews: number }[];
}

function parseSource(referrer: string): string {
  if (!referrer) return "Trực tiếp";
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    const SEARCH  = ["google.com", "google.com.vn", "bing.com", "yahoo.com", "coccoc.com", "duckduckgo.com"];
    const SOCIAL  = ["facebook.com", "m.facebook.com", "l.facebook.com", "instagram.com", "tiktok.com", "zalo.me", "youtube.com"];
    if (SEARCH.includes(host))  return "Tìm kiếm tự nhiên";
    if (SOCIAL.includes(host))  return "Mạng xã hội";
    return "Trang khác";
  } catch {
    return "Trực tiếp";
  }
}

export async function getTrafficData(cutoff: Date): Promise<TrafficData> {
  try {
    const supabase = await createClient();
    const { data: events, error } = await supabase
      .from("analytics_events")
      .select("event_type, session_id, page_path, referrer, created_at")
      .gte("created_at", cutoff.toISOString())
      .order("created_at", { ascending: true })
      .limit(20000);

    if (error || !events || events.length === 0) return empty();

    const pageViews = events.filter((e) => e.event_type === "page_view");
    const cartEvents = events.filter((e) => e.event_type === "add_to_cart");

    // Unique sessions across all events
    const allSessions = new Set(events.map((e) => e.session_id));

    // Product page sessions
    const productSessions = new Set(
      pageViews
        .filter((e) => {
          const parts = (e.page_path ?? "").split("/").filter(Boolean);
          return parts[0] === "san-pham" && parts.length >= 2;
        })
        .map((e) => e.session_id)
    );

    // Add-to-cart sessions
    const cartSessions = new Set(cartEvents.map((e) => e.session_id));

    // Top pages
    const pageCounts: Record<string, number> = {};
    for (const e of pageViews) {
      if (e.page_path) pageCounts[e.page_path] = (pageCounts[e.page_path] ?? 0) + 1;
    }
    const topPages = Object.entries(pageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, views]) => ({ path, views }));

    // Traffic sources — use the first page_view referrer per session
    const sessionEntry: Record<string, string> = {};
    for (const e of pageViews) {
      if (!(e.session_id in sessionEntry)) {
        sessionEntry[e.session_id] = e.referrer ?? "";
      }
    }
    const sourceCounts: Record<string, number> = {};
    for (const ref of Object.values(sessionEntry)) {
      const src = parseSource(ref);
      sourceCounts[src] = (sourceCounts[src] ?? 0) + 1;
    }
    const totalSrc = Object.values(sourceCounts).reduce((s, n) => s + n, 0) || 1;
    const sourceBreakdown = Object.entries(sourceCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([source, sessions]) => ({
        source,
        sessions,
        pct: Math.round((sessions / totalSrc) * 100),
      }));

    // Daily stats
    const dailySessionMap: Record<string, Set<string>> = {};
    const dailyViewCount: Record<string, number> = {};
    for (const e of pageViews) {
      const day = (e.created_at as string).slice(0, 10);
      if (!dailySessionMap[day]) dailySessionMap[day] = new Set();
      dailySessionMap[day].add(e.session_id);
      dailyViewCount[day] = (dailyViewCount[day] ?? 0) + 1;
    }
    const dailyStats = Object.entries(dailySessionMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, sessions]) => ({
        date,
        sessions: sessions.size,
        pageViews: dailyViewCount[date] ?? 0,
      }));

    return {
      totalPageViews: pageViews.length,
      uniqueSessions: allSessions.size,
      productViewSessions: productSessions.size,
      cartSessions: cartSessions.size,
      topPages,
      sourceBreakdown,
      dailyStats,
    };
  } catch {
    return empty();
  }
}

function empty(): TrafficData {
  return {
    totalPageViews: 0,
    uniqueSessions: 0,
    productViewSessions: 0,
    cartSessions: 0,
    topPages: [],
    sourceBreakdown: [],
    dailyStats: [],
  };
}
