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

  return (
    <div className="flex flex-col gap-6 lg:w-56 lg:shrink-0">
      <div>
        <h3 className="text-[12px] tracking-label uppercase text-ink">
          Giới tính
        </h3>
        <div className="mt-3 flex flex-col gap-2">
          {[
            { value: "", label: "Tất cả" },
            { value: "nam", label: "Nam" },
            { value: "nu", label: "Nữ" },
          ].map((opt) => (
            <button
              key={opt.label}
              onClick={() => updateParam("gender", opt.value)}
              className={`text-left text-sm transition-colors ${
                gender === opt.value ? "text-gold-dark font-medium" : "text-muted hover:text-ink"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-[12px] tracking-label uppercase text-ink">
          Danh mục
        </h3>
        <div className="mt-3 flex flex-col gap-2">
          <button
            onClick={() => updateParam("category", "")}
            className={`text-left text-sm transition-colors ${
              category === "" ? "text-gold-dark font-medium" : "text-muted hover:text-ink"
            }`}
          >
            Tất cả
          </button>
          {categories.map((c) => (
            <button
              key={c.value}
              onClick={() => updateParam("category", c.value)}
              className={`text-left text-sm transition-colors ${
                category === c.value ? "text-gold-dark font-medium" : "text-muted hover:text-ink"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-[12px] tracking-label uppercase text-ink">
          Bộ lọc nhanh
        </h3>
        <div className="mt-3 flex flex-col gap-2">
          {[
            { value: "", label: "Tất cả sản phẩm" },
            { value: "moi", label: "Hàng mới về" },
            { value: "sale", label: "Đang giảm giá" },
            { value: "bestseller", label: "Bán chạy nhất" },
          ].map((opt) => (
            <button
              key={opt.label}
              onClick={() => updateParam("filter", opt.value)}
              className={`text-left text-sm transition-colors ${
                filter === opt.value ? "text-gold-dark font-medium" : "text-muted hover:text-ink"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
