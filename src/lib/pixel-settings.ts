import { createPublicClient } from "./supabase/public";

export interface PixelSettings {
  fbPixelId: string;
  ttPixelId: string;
  fbDomainVerification: string;
}

const DEFAULT: PixelSettings = { fbPixelId: "", ttPixelId: "", fbDomainVerification: "" };

function parse(raw: unknown): PixelSettings {
  if (!raw || typeof raw !== "object") return DEFAULT;
  const d = raw as Record<string, unknown>;
  return {
    fbPixelId: typeof d.fbPixelId === "string" ? d.fbPixelId.trim() : "",
    ttPixelId: typeof d.ttPixelId === "string" ? d.ttPixelId.trim() : "",
    fbDomainVerification: typeof d.fbDomainVerification === "string" ? d.fbDomainVerification.trim() : "",
  };
}

export async function getPixelSettings(): Promise<PixelSettings> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("homepage_settings")
    .select("value")
    .eq("key", "pixel_settings")
    .maybeSingle();
  return parse(data?.value);
}
