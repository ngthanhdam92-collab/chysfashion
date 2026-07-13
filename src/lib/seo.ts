import { createPublicClient } from "./supabase/public";

export interface PageSeo {
  pageKey: string;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  updatedAt: string;
}

export const STATIC_PAGES = [
  { key: "home",                   label: "Trang chủ",              path: "/" },
  { key: "san-pham",               label: "Danh sách sản phẩm",    path: "/san-pham" },
  { key: "ve-chung-toi",           label: "Về chúng tôi",          path: "/ve-chung-toi" },
  { key: "lien-he",                label: "Liên hệ",               path: "/lien-he" },
  { key: "cau-hoi-thuong-gap",     label: "Câu hỏi thường gặp",   path: "/cau-hoi-thuong-gap" },
  { key: "huong-dan-mua-hang",     label: "Hướng dẫn mua hàng",   path: "/huong-dan-mua-hang" },
  { key: "huong-dan-chon-size",    label: "Hướng dẫn chọn size",  path: "/huong-dan-chon-size" },
  { key: "chinh-sach-doi-tra",     label: "Chính sách đổi trả",   path: "/chinh-sach-doi-tra" },
  { key: "chinh-sach-bao-mat",     label: "Chính sách bảo mật",   path: "/chinh-sach-bao-mat" },
  { key: "chinh-sach-van-chuyen",  label: "Chính sách vận chuyển",path: "/chinh-sach-van-chuyen" },
  { key: "dieu-khoan-dich-vu",     label: "Điều khoản dịch vụ",   path: "/dieu-khoan-dich-vu" },
] as const;

interface SeoRow {
  page_key: string;
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | null;
  updated_at: string;
}

function mapRow(row: SeoRow): PageSeo {
  return {
    pageKey: row.page_key,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    ogImage: row.og_image,
    updatedAt: row.updated_at,
  };
}

export async function getPageSeo(pageKey: string): Promise<PageSeo | null> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("page_seo")
    .select("*")
    .eq("page_key", pageKey)
    .maybeSingle();
  return data ? mapRow(data as SeoRow) : null;
}

export async function getAllPageSeo(): Promise<PageSeo[]> {
  const supabase = createPublicClient();
  const { data } = await supabase.from("page_seo").select("*");
  if (!data) return [];
  return (data as SeoRow[]).map(mapRow);
}

/** Build Next.js Metadata object from DB overrides + hard-coded defaults */
export async function buildPageMetadata(
  pageKey: string,
  defaults: { title: string; description?: string }
) {
  const seo = await getPageSeo(pageKey);
  const title = seo?.metaTitle || defaults.title;
  const description = seo?.metaDescription || defaults.description || "";
  const ogImage = seo?.ogImage;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website" as const,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}
