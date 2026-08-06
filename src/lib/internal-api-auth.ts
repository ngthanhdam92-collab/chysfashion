import { NextResponse, type NextRequest } from "next/server";

// Shared-secret guard for internal API endpoints (called server-side by CHYS Chat).
export function checkInternalSecret(req: NextRequest): NextResponse | null {
  const secret = req.headers.get("x-internal-secret");
  if (!secret || secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}
