import { notFound } from "next/navigation";
import { getCampaignBySlug } from "@/lib/campaigns";
import { getShippingRules } from "@/lib/shipping";
import { CampaignCountdown } from "@/components/campaign-countdown";
import { CampaignProductGallery } from "@/components/campaign-product-gallery";
import { CampaignOrderForm } from "@/components/campaign-order-form";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const campaign = await getCampaignBySlug(slug);
  if (!campaign) return { title: "Khuyến mãi — CHYS Fashion" };
  return { title: `${campaign.title} — CHYS Fashion` };
}

function fmt(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

export default async function CampaignPage({ params }: Params) {
  const { slug } = await params;
  const [campaign, shippingRules] = await Promise.all([
    getCampaignBySlug(slug),
    getShippingRules(),
  ]);
  if (!campaign) notFound();

  const featured = campaign.products[0];
  const allImages = campaign.products.flatMap((p) => p.images).slice(0, 12);

  return (
    <div className="mx-auto max-w-md">

      {/* Header */}
      <div className="bg-[#1a1a2e] px-4 py-5 text-center text-white">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase opacity-70">CHYS FASHION</p>
        <h1 className="mt-1 text-xl font-bold leading-tight">{campaign.title}</h1>
        {campaign.bannerMessage && (
          <div className="mx-auto mt-3 max-w-xs rounded border border-white/20 bg-white/10 px-3 py-2 text-sm leading-snug">
            {campaign.bannerMessage}
          </div>
        )}
      </div>

      {/* Image carousel */}
      {allImages.length > 0 && (
        <CampaignProductGallery
          images={allImages}
          name={campaign.title}
        />
      )}

      {/* Product name + Sale badge + CTA */}
      {featured && (
        <div className="px-4 pt-3 pb-2">
          <h2 className="text-base font-bold uppercase text-gray-900 leading-tight">
            {featured.name}
          </h2>
          <div className="mt-2 flex items-center gap-2">
            {campaign.discountPercent && (
              <div className="flex items-center gap-1 rounded bg-red-600 px-3 py-1.5">
                <span className="text-xs font-bold text-white">SALE OFF</span>
                <span className="text-lg font-black text-white leading-none">
                  {campaign.discountPercent}%
                </span>
              </div>
            )}
            <a
              href="#order-form"
              className="flex-1 rounded bg-red-600 py-2.5 text-center text-sm font-bold uppercase tracking-wide text-white"
            >
              MUA NGAY
            </a>
          </div>
        </div>
      )}

      {/* Price box */}
      {featured && (
        <div className="flex items-baseline gap-2 bg-[#1e40af] px-4 py-3">
          <span className="text-sm font-semibold text-white/80">GIÁ CHỈ :</span>
          <span className="text-2xl font-black text-white">{fmt(featured.price)}</span>
          <span className="text-sm text-white/70">/1 SP</span>
          {featured.compareAtPrice && (
            <span className="ml-1 text-sm text-white/50 line-through">
              {fmt(featured.compareAtPrice)}
            </span>
          )}
        </div>
      )}

      {/* Countdown */}
      <div className="border-b bg-white px-3 pb-3 pt-2 text-center">
        <p className="mb-1 text-sm font-semibold text-red-600">Khuyến mãi sắp kết thúc!!!</p>
        <CampaignCountdown countdownHours={campaign.countdownHours} />
      </div>

      {/* Description bullets */}
      {campaign.description && (
        <div className="px-4 py-4">
          <ul className="space-y-2">
            {campaign.description
              .split("\n")
              .map((l) => l.trim())
              .filter(Boolean)
              .map((line, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                  {line}
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Shipping badges */}
      <div className="grid grid-cols-2 divide-x divide-gray-200 border-y border-gray-200 bg-gray-50 px-2 py-3 text-xs text-gray-600">
        <div className="flex items-center gap-2 px-2">
          <span className="text-lg">🔄</span>
          <span>6 tháng, 1 đổi 1 trong 7 ngày nếu phát sinh lỗi</span>
        </div>
        <div className="flex items-center gap-2 px-2">
          <span className="text-lg">🚚</span>
          <span>Giao hàng toàn quốc.</span>
        </div>
      </div>

      {/* Inline order form */}
      <div className="bg-white" id="order-form">
        <div className="border-b border-gray-100 bg-red-600 px-4 py-3 text-center">
          <p className="text-sm font-bold uppercase tracking-wide text-white">
            ĐẶT HÀNG NGAY — NHẬN NGAY ƯU ĐÃI
          </p>
        </div>
        <CampaignOrderForm products={campaign.products} shippingRules={shippingRules} />
      </div>

      {/* Footer */}
      <div className="bg-[#1a1a2e] py-5 text-center">
        <p className="text-sm font-bold text-white">CHYS FASHION</p>
        <p className="mt-0.5 text-xs text-white/40">chysfashion.online</p>
      </div>
    </div>
  );
}
