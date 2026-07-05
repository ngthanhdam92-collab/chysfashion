"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Category } from "@/lib/categories";

export function ProductFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const gender = searchParams.get("gender") ?? "";
  const category = searchParams.get("category") ?? "";
  const filter = searchParams.get("filter") ?? "";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const GENDERS = [
    { value: "", label: "Tất cả" },
    { value: "nam", label: "Nam" },
    { value: "nu", label: "Nữ" },
  ];

  const QUICK_FILTERS = [
    { value: "", label: "Tất cả" },
    { value: "moi", label: "Hàng mới" },
    { value: "sale", label: "Giảm giá" },
    { value: "bestseller", label: "Bán chạy" },
  ];

  /* ── Mobile chip style ── */
  function chip(active: boolean) {
    return `shrink-0 rounded-full border px-3 py-1 text-xs transition-colors ${
      active
        ? "border-ink bg-ink text-paper"
        : "border-line bg-white text-muted hover:border-ink hover:text-ink"
    }`;
  }

  return (
    <>
      {/* ── MOBILE: compact horizontal chip rows ── */}
      <div className="flex flex-col gap-3 lg:hidden">
        {/* Gender */}
        <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="shrink-0 text-[10px] uppercase tracking-label text-muted">Giới tính:</span>
          {GENDERS.map((opt) => (
            <button key={opt.value} type="button" onClick={() => updateParam("gender", opt.value)} className={chip(gender === opt.value)}>
              {opt.label}
            </button>
          ))}
        </div>

        {/* Category */}
        <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="shrink-0 text-[10px] uppercase tracking-label text-muted">Danh mục:</span>
          <button type="button" onClick={() => updateParam("category", "")} className={chip(category === "")}>Tất cả</button>
          {categories.map((c) => (
            <button key={c.value} type="button" onClick={() => updateParam("category", c.value)} className={chip(category === c.value)}>
              {c.label}
            </button>
          ))}
        </div>

        {/* Quick filters */}
        <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="shrink-0 text-[10px] uppercase tracking-label text-muted">Bộ lọc:</span>
          {QUICK_FILTERS.map((opt) => (
            <button key={opt.value} type="button" onClick={() => updateParam("filter", opt.value)} className={chip(filter === opt.value)}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── DESKTOP: vertical sidebar ── */}
      <div className="hidden flex-col gap-6 lg:flex lg:w-56 lg:shrink-0">
        <div>
          <h3 className="text-[12px] tracking-label uppercase text-ink">Giới tính</h3>
          <div className="mt-3 flex flex-col gap-2">
            {GENDERS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateParam("gender", opt.value)}
                className={`text-left text-sm transition-colors ${
                  gender === opt.value ? "font-medium text-gold-dark" : "text-muted hover:text-ink"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-[12px] tracking-label uppercase text-ink">Danh mục</h3>
          <div className="mt-3 flex flex-col gap-2">
            <button
              onClick={() => updateParam("category", "")}
              className={`text-left text-sm transition-colors ${
                category === "" ? "font-medium text-gold-dark" : "text-muted hover:text-ink"
              }`}
            >
              Tất cả
            </button>
            {categories.map((c) => (
              <button
                key={c.value}
                onClick={() => updateParam("category", c.value)}
                className={`text-left text-sm transition-colors ${
                  category === c.value ? "font-medium text-gold-dark" : "text-muted hover:text-ink"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-[12px] tracking-label uppercase text-ink">Bộ lọc nhanh</h3>
          <div className="mt-3 flex flex-col gap-2">
            {QUICK_FILTERS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateParam("filter", opt.value)}
                className={`text-left text-sm transition-colors ${
                  filter === opt.value ? "font-medium text-gold-dark" : "text-muted hover:text-ink"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
