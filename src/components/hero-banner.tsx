import Image from "next/image";
import Link from "next/link";
import type { Banner } from "@/lib/banners";

interface HeroBannerProps {
  banner: Banner;
}

export function HeroBanner({ banner }: HeroBannerProps) {
  if (!banner.imageUrl) return null;

  const href = banner.linkUrl || "#";

  return (
    <>
      {/* ── MOBILE (< sm): ảnh đầy đủ tỉ lệ tự nhiên, bấm điều hướng ── */}
      <Link href={href} className="block sm:hidden">
        <Image
          src={banner.imageUrl}
          alt={banner.title || "Banner"}
          width={1440}
          height={540}
          style={{ width: "100%", height: "auto" }}
          sizes="100vw"
          priority
        />
      </Link>

      {/* ── DESKTOP (sm+): full-screen, bấm điều hướng ── */}
      <Link href={href} className="hidden sm:block">
        <div className="relative min-h-[78vh] overflow-hidden">
          <Image
            src={banner.imageUrl}
            alt={banner.title || "Banner"}
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
        </div>
      </Link>
    </>
  );
}
