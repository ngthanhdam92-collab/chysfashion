import { createClient } from "./supabase/server";

export interface TrafficData {
  totalPageViews: number;
  uniqueSessions: number;
  productViewSessions: number;
  cartSessions: number;
  topPages: { path: string; views: number }[];
  sourceBreakdown: { source: string; sessions: number; pct: number }[];
  campaignBreakdown: { campaign: string; source: string; sessions: number; pct: number }[];
  dailyStats: { date: string; sessions: number; pageViews: number }[];
}

function parseSource(referrer: string): string {
  if (!referrer) return "Trực tiếp";
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    const SEARCH = ["google.com", "google.com.vn", "bing.com", "yahoo.com", "coccoc.com", "duckduckgo.com"];
    const SOCIAL = ["facebook.com", "m.facebook.com", "l.facebook.com", "instagram.com", "tiktok.com", "zalo.me", "youtube.com"];
    if (SEARCH.includes(host)) return "Tìm kiếm tự nhiên";
    if (SOCIAL.includes(host)) return "Mạng xã hội";
    return "Trang khác";
  } catch {
    return "Trực tiếp";
  }
}

function utmSourceLabel(src: string): string {
  const map: Record<string, string> = {
    facebook:  "Facebook",
    fb:        "Facebook",
    zalo:      "Zalo",
    tiktok:    "TikTok",
    instagram: "Instagram",
    google:    "Google Ads",
    youtube:   "YouTube",
    email:     "Email",
    sms:       "SMS",
  };
  return map[src.toLowerCase()] ?? src;
}

export async function getTrafficData(cutoff: Date): Promise<TrafficData> {
  try {
    const supabase = await createClient();
    const { data: events, error } = await supabase
      .from("analytics_events")
      .select("event_type, session_id, page_path, referrer, utm_source, utm_medium, utm_campaign, created_at")
      .gte("created_at", cutoff.toISOString())
      .order("created_at", { ascending: true })
      .limit(20000);

    if (error || !events || events.length === 0) return empty();

    const pageViews  = events.filter((e) => e.event_type === "page_view");
    const cartEvents = events.filter((e) => e.event_type === "add_to_cart");

    const allSessions = new Set(events.map((e) => e.session_id));

    const productSessions = new Set(
      pageViews
        .filter((e) => {
          const parts = (e.page_path ?? "").split("/").filter(Boolean);
          return parts[0] === "san-pham" && parts.length >= 2;
        })
        .map((e) => e.session_id)
    );

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

    // Source breakdown — prefer utm_source, fall back to referrer parsing
    // One entry per session (use first event of session)
    const sessionSource: Record<string, string> = {};
    for (const e of events) {
      if (e.session_id in sessionSource) continue;
      if (e.utm_source) {
        sessionSource[e.session_id] = utmSourceLabel(e.utm_source);
      } else if (e.event_type === "page_view") {
        sessionSource[e.session_id] = parseSource(e.referrer ?? "");
      }
    }
    // Fill sessions not yet assigned (e.g. first event was add_to_cart without utm)
    for (const sid of allSessions) {
      if (!(sid in sessionSource)) sessionSource[sid] = "Trực tiếp";
    }

    const sourceCounts: Record<string, number> = {};
    for (const src of Object.values(sessionSource)) {
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

    // Campaign breakdown (utm_campaign)
    const campaignMap: Record<string, { source: string; sessions: Set<string> }> = {};
    for (const e of events) {
      if (!e.utm_campaign || !e.utm_source) continue;
      const key = e.utm_campaign;
      if (!campaignMap[key]) campaignMap[key] = { source: utmSourceLabel(e.utm_source), sessions: new Set() };
      campaignMap[key].sessions.add(e.session_id);
    }
    const totalCamp = allSessions.size || 1;
    const campaignBreakdown = Object.entries(campaignMap)
      .sort((a, b) => b[1].sessions.size - a[1].sessions.size)
      .slice(0, 10)
      .map(([campaign, { source, sessions }]) => ({
        campaign,
        source,
        sessions: sessions.size,
        pct: Math.round((sessions.size / totalCamp) * 100),
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
      campaignBreakdown,
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
    campaignBreakdown: [],
    dailyStats: [],
  };
}
