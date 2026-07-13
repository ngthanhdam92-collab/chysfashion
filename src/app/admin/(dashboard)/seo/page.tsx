import { getAllPageSeo } from "@/lib/seo";
import { SeoClient } from "@/components/admin/seo-client";

export const metadata = { title: "SEO Settings — Admin" };

export default async function SeoPage() {
  const seoData = await getAllPageSeo();
  return <SeoClient seoData={seoData} />;
}
