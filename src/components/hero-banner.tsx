import Image from "next/image";
import { CtaButton } from "@/components/cta-button";
import type { Banner } from "@/lib/banners";

interface HeroBannerProps {
  banner: Banner;
}

export function HeroBanner({ banner }: HeroBannerProps) {
  const hasImage = !!banner.imageUrl;

  return (
    <section
      className={`relative flex overflow-hidden ${
        hasImage
          ? "min-h-[60vh] items-end sm:min-h-[78vh] sm:items-center"
          : "min-h-[78vh] items-center bg-gradient-to-br from-white via-white to-cream"
      }`}
    >
      {hasImage && (
        <>
          <Image
            src={banner.imageUrl!}
            alt={banner.title}
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          {/* Mobile: gradient từ dưới lên để text dễ đọc */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/40 to-ink/10 sm:hidden" />
          {/* Desktop: gradient từ trái sang phải */}
          <div className="absolute inset-0 hidden bg-gradient-to-r from-ink/65 via-ink/35 to-transparent sm:block" />
        </>
      )}

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-10 pt-6 sm:px-6 sm:py-20 lg:px-8">
        <div className="max-w-xl">
          {banner.subtitle && (
            <p
              className={`text-[12px] tracking-label uppercase ${
                hasImage ? "text-paper/80" : "text-gold-dark"
              }`}
            >
              {banner.subtitle}
            </p>
          )}
          <h1
            className={`mt-3 font-serif text-3xl leading-tight sm:text-5xl lg:text-6xl ${
              hasImage ? "text-paper" : "text-ink"
            }`}
          >
            {banner.title}
          </h1>
          {banner.linkUrl && banner.linkLabel && (
            <div className="mt-6 sm:mt-8">
              <CtaButton
                href={banner.linkUrl}
                variant={hasImage ? "outline" : "primary"}
              >
                {banner.linkLabel}
              </CtaButton>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
