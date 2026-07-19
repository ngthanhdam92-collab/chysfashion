import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { NextResponse } from "next/server";

function getClient() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY not set");
  const credentials = JSON.parse(raw);
  return new BetaAnalyticsDataClient({ credentials });
}

export async function GET() {
  try {
    const propertyId = process.env.GOOGLE_GA4_PROPERTY_ID;
    if (!propertyId) return NextResponse.json({ error: "GA4 property not configured" }, { status: 500 });

    const client = getClient();
    const [response] = await client.runRealtimeReport({
      property: `properties/${propertyId}`,
      metrics: [{ name: "activeUsers" }],
    });

    const totalActive = response.rows?.reduce((sum, row) => {
      return sum + parseInt(row.metricValues?.[0]?.value ?? "0", 10);
    }, 0) ?? 0;

    const pageMap: Record<string, number> = {};
    const sourceMap: Record<string, number> = {};
    for (const row of response.rows ?? []) {
      const page = row.dimensionValues?.[0]?.value ?? "(unknown)";
      const medium = row.dimensionValues?.[1]?.value ?? "(none)";
      const count = parseInt(row.metricValues?.[0]?.value ?? "0", 10);
      pageMap[page] = (pageMap[page] ?? 0) + count;
      sourceMap[medium] = (sourceMap[medium] ?? 0) + count;
    }

    const topPages = Object.entries(pageMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([page, users]) => ({ page, users }));

    const topSources = Object.entries(sourceMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([source, users]) => ({ source, users }));

    return NextResponse.json({ activeUsers: totalActive, topPages, topSources });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("GA realtime error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
