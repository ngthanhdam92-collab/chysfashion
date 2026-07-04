"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ProductImagePlaceholder } from "@/components/product-image-placeholder";
import { StoryCircles } from "@/components/story-circles";
import type { Category } from "@/lib/categories";
import type { Story } from "@/lib/stories";

interface Props {
  categories: Category[];
  stories: Story[];
}

export function HomepageCategorySection({ categories, stories }: Props) {
  const [gender, setGender] = useState<"nam" | "nu">("nam");
  const displayCats = categories.slice(0, 6);

  return (
    <section className="py-8 sm:py-12">
      {/* ── Story circles (feedback KH) hoặc category circles ── */}
      {stories.length > 0 ? (
        <StoryCircles stories={stories} />
      ) : (
        <div className="flex gap-4 overflow-x-auto px-4 pb-2 sm:justify-center sm:overflow-visible sm:px-6 lg:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/san-pham?category=${cat.value}`}
              className="flex shrink-0 flex-col items-center gap-1.5"
            >
              <div className="flex h-[62px] w-[62px] items-center justify-center rounded-full bg-gradient-to-br from-gold via-amber-400 to-rose-400 p-[2.5px]">
                <div className="relative h-full w-full overflow-hidden rounded-full bg-cream">
                  {cat.imageUrl ? (
                    <Image src={cat.imageUrl} alt={cat.label} fill className="object-cover" sizes="62px" />
                  ) : (
                    <ProductImagePlaceholder seed={cat.value} className="h-full w-full" />
                  )}
                </div>
              </div>
              <span className="w-[62px] text-center text-[9px] uppercase leading-tight tracking-wide text-ink line-clamp-2">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* ── Gender toggle ── */}
      <div className="mt-6 flex justify-start gap-2 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => setGender("nam")}
          className={`rounded-full px-7 py-2 text-sm font-semibold transition-colors ${
            gender === "nam" ? "bg-ink text-paper" : "border border-line text-ink hover:border-ink"
          }`}
        >
          NAM
        </button>
        <button
          type="button"
          onClick={() => setGender("nu")}
          className={`rounded-full px-7 py-2 text-sm font-semibold transition-colors ${
            gender === "nu" ? "bg-ink text-paper" : "border border-line text-ink hover:border-ink"
          }`}
        >
          NỮ
        </button>
      </div>

      {/* ── Category cards ── */}
      <div className="mt-6 overflow-x-auto px-4 sm:overflow-visible sm:px-6 lg:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-3 sm:w-full sm:grid sm:grid-cols-6 sm:gap-4 lg:gap-5">
          {displayCats.map((cat) => (
            <Link
              key={cat.id}
              href={`/san-pham?category=${cat.value}`}
              className="group flex w-[120px] shrink-0 flex-col items-center gap-2 sm:w-auto"
            >
              <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-b from-slate-100 to-slate-200">
                <div className="aspect-[3/4]">
                  {cat.imageUrl ? (
                    <Image
                      src={cat.imageUrl}
                      alt={cat.label}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(min-width: 640px) 17vw, 130px"
                    />
                  ) : (
                    <ProductImagePlaceholder
                      seed={cat.value}
                      className="h-full w-full transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                </div>
              </div>
              <span className="text-center text-[11px] font-semibold uppercase tracking-widest text-ink">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
