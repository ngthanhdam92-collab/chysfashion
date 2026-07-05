import { createPublicClient } from "./supabase/public";

export interface AnnouncementBar {
  enabled: boolean;
  text: string;
  bgColor: string;
  textColor: string;
  fontStyle: "uppercase" | "normal" | "serif";
}

export interface HomepageSettings {
  featuredCategoryValues: string[];
  collectionBannerValues: string[];
  newCollectionCategory: string | null;
  newCollectionDisplayName: string | null;
  announcementBar: AnnouncementBar;
}

export const DEFAULT_ANNOUNCEMENT: AnnouncementBar = {
  enabled: true,
  text: "Miễn phí vận chuyển cho đơn hàng từ 500.000đ",
  bgColor: "#18181b",
  textColor: "#ffffff",
  fontStyle: "uppercase",
};

const DEFAULT: HomepageSettings = {
  featuredCategoryValues: [],
  collectionBannerValues: [],
  newCollectionCategory: null,
  newCollectionDisplayName: null,
  announcementBar: DEFAULT_ANNOUNCEMENT,
};

function parseAnnouncementBar(d: Record<string, unknown>): AnnouncementBar {
  const raw = d.announcementBar as Record<string, unknown> | undefined;
  if (!raw || typeof raw !== "object") return DEFAULT_ANNOUNCEMENT;
  return {
    enabled: raw.enabled !== false,
    text: typeof raw.text === "string" && raw.text ? raw.text : DEFAULT_ANNOUNCEMENT.text,
    bgColor: typeof raw.bgColor === "string" && raw.bgColor ? raw.bgColor : DEFAULT_ANNOUNCEMENT.bgColor,
    textColor: typeof raw.textColor === "string" && raw.textColor ? raw.textColor : DEFAULT_ANNOUNCEMENT.textColor,
    fontStyle:
      raw.fontStyle === "uppercase" || raw.fontStyle === "normal" || raw.fontStyle === "serif"
        ? raw.fontStyle
        : "uppercase",
  };
}

function parse(raw: unknown): HomepageSettings {
  if (!raw || typeof raw !== "object") return DEFAULT;
  const d = raw as Record<string, unknown>;
  return {
    featuredCategoryValues: Array.isArray(d.featuredCategoryValues)
      ? (d.featuredCategoryValues as string[])
      : [],
    collectionBannerValues: Array.isArray(d.collectionBannerValues)
      ? (d.collectionBannerValues as string[])
      : [],
    newCollectionCategory:
      typeof d.newCollectionCategory === "string" && d.newCollectionCategory
        ? d.newCollectionCategory
        : null,
    newCollectionDisplayName:
      typeof d.newCollectionDisplayName === "string" && d.newCollectionDisplayName
        ? d.newCollectionDisplayName
        : null,
    announcementBar: parseAnnouncementBar(d),
  };
}

export async function getHomepageSettings(): Promise<HomepageSettings> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("homepage_settings")
    .select("value")
    .eq("key", "main")
    .maybeSingle();
  return parse(data?.value);
}
