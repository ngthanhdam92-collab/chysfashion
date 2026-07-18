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
  const displayName = campaign.displayName || featured?.name || campaign.title;
  const allImages = campaign.bannerImages.length > 0
    ? campaign.bannerImages
    : campaign.products.flatMap((p) => p.images).slice(0, 12);

  return (
    <div className="mx-auto max-w-md">

      {/* Header */}
      <div className="relative overflow-hidden bg-[#0c0c0c]">
        {/* Red glow from top-center */}
        <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(185,28,28,0.35),transparent)]" />
        {/* Top accent line */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-red-600 to-transparent" />

        <div className="relative px-5 pb-0 pt-7 text-center text-white">
          {/* Brand with decorative lines */}
          <div className="flex items-center justify-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-red-600/60" />
            <p className="text-[9px] font-bold tracking-[0.4em] text-red-400 uppercase">CHYS FASHION</p>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-red-600/60" />
          </div>

          {/* Title */}
          <h1 className="mt-3 text-[1.6rem] font-black uppercase leading-[1.15] tracking-tight text-white drop-shadow-sm">
            {campaign.title}
          </h1>

          {/* Diamond separator */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="h-px w-10 bg-white/15" />
            <div className="h-[5px] w-[5px] rotate-45 bg-red-500" />
            <div className="h-px w-10 bg-white/15" />
          </div>
        </div>

        {/* Banner message — full-width bold strip */}
        {campaign.bannerMessage && (
          <div className="relative mt-5 overflow-hidden bg-red-700 px-4 py-3.5 text-center">
            {/* Diagonal stripe texture */}
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)", backgroundSize: "8px 8px" }} />
            <p className="relative text-[18px] font-bold uppercase tracking-wide text-white" style={{ fontFamily: "var(--font-barlow-condensed)", fontSize: "24px" }}>
              {campaign.bannerMessage}
            </p>
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
      {(featured || campaign.displayName) && (
        <div className="px-4 pt-3 pb-2">
          <h2 className="text-base font-bold uppercase text-gray-900 leading-tight">
            {displayName}
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
