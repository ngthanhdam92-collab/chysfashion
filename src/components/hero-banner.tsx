import Image from "next/image";
import { CtaButton } from "@/components/cta-button";
import type { Banner } from "@/lib/banners";

interface HeroBannerProps {
  banner: Banner;
}

export function HeroBanner({ banner }: HeroBannerProps) {
  const hasImage = !!banner.imageUrl;

  return (
    <>
      {/* ── MOBILE (< sm): ảnh đầy đủ + text bên dưới ── */}
      <div className="sm:hidden">
        {hasImage && (
          <Image
            src={banner.imageUrl!}
            alt={banner.title}
            width={1440}
            height={540}
            style={{ width: "100%", height: "auto" }}
            sizes="100vw"
            priority
          />
        )}
        <div
          className={`px-5 py-8 ${
            hasImage
              ? "bg-ink text-paper"
              : "flex min-h-[60vh] flex-col justify-center bg-gradient-to-br from-white via-white to-cream"
          }`}
        >
          {banner.subtitle && (
            <p
              className={`text-[11px] tracking-label uppercase ${
                hasImage ? "text-paper/60" : "text-gold-dark"
              }`}
            >
              {banner.subtitle}
            </p>
          )}
          <h2
            className={`mt-2 font-serif text-2xl leading-snug ${
              hasImage ? "text-paper" : "text-ink"
            }`}
          >
            {banner.title}
          </h2>
          {banner.linkUrl && banner.linkLabel && (
            <div className="mt-5">
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

      {/* ── DESKTOP (sm+): full-screen overlay ── */}
      <section className="relative hidden min-h-[78vh] overflow-hidden sm:flex sm:items-center">
        {hasImage ? (
          <>
            <Image
              src={banner.imageUrl!}
              alt={banner.title}
              fill
              priority
              className="object-cover object-center"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-ink/65 via-ink/35 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-cream" />
        )}

        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-20 lg:px-8">
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
              className={`mt-4 font-serif text-5xl leading-tight lg:text-6xl ${
                hasImage ? "text-paper" : "text-ink"
              }`}
            >
              {banner.title}
            </h1>
            {banner.linkUrl && banner.linkLabel && (
              <div className="mt-8">
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
    </>
  );
}
