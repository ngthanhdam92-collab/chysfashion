import Image from "next/image";
import { CtaButton } from "@/components/cta-button";
import type { Banner } from "@/lib/banners";

interface HeroBannerProps {
  banner: Banner;
}

export function HeroBanner({ banner }: HeroBannerProps) {
  return (
    <section className="relative flex min-h-[78vh] items-center overflow-hidden bg-gradient-to-br from-white via-white to-cream">
      {/* Background image */}
      {banner.imageUrl && (
        <>
          <Image
            src={banner.imageUrl}
            alt={banner.title}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          {/* Overlay gradient để text dễ đọc */}
          <div className="absolute inset-0 bg-gradient-to-r from-ink/60 via-ink/30 to-transparent" />
        </>
      )}

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-xl">
          {banner.subtitle && (
            <p
              className={`text-[12px] tracking-label uppercase ${
                banner.imageUrl ? "text-paper/80" : "text-gold-dark"
              }`}
            >
              {banner.subtitle}
            </p>
          )}
          <h1
            className={`mt-4 font-serif text-4xl leading-tight sm:text-5xl lg:text-6xl ${
              banner.imageUrl ? "text-paper" : "text-ink"
            }`}
          >
            {banner.title}
          </h1>
          {banner.linkUrl && banner.linkLabel && (
            <div className="mt-8">
              <CtaButton
                href={banner.linkUrl}
                variant={banner.imageUrl ? "outline" : "primary"}
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
