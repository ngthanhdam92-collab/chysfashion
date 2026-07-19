import { NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";

function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY not set");
  const credentials = JSON.parse(raw);
  // Fix newlines in private key if Vercel escaped them
  if (credentials.private_key) {
    credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");
  }
  return new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
  });
}

export async function GET() {
  try {
    const propertyId = process.env.GOOGLE_GA4_PROPERTY_ID?.trim();
    if (!propertyId) return NextResponse.json({ error: "GA4 property not configured" }, { status: 500 });

    const auth = getAuth();
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    if (!token.token) throw new Error("Could not get access token");

    const url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runRealtimeReport`;
    const body = {
      metrics: [{ name: "activeUsers" }],
      dimensions: [{ name: "pagePath" }],
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    if (!res.ok) {
      console.error("GA4 API error:", JSON.stringify(json));
      return NextResponse.json({ error: json?.error?.message ?? "GA4 API error", detail: json }, { status: 500 });
    }

    const rows: { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] }[] = json.rows ?? [];
    const totalActive = rows.reduce((sum, row) => sum + parseInt(row.metricValues?.[0]?.value ?? "0", 10), 0);

    const pageMap: Record<string, number> = {};
    for (const row of rows) {
      const page = row.dimensionValues?.[0]?.value ?? "(unknown)";
      const count = parseInt(row.metricValues?.[0]?.value ?? "0", 10);
      pageMap[page] = (pageMap[page] ?? 0) + count;
    }

    const topPages = Object.entries(pageMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([page, users]) => ({ page, users }));

    return NextResponse.json({ activeUsers: totalActive, topPages, topSources: [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("GA realtime error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
