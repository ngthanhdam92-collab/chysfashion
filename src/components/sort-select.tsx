"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sort = searchParams.get("sort") ?? "moi-nhat";

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      value={sort}
      onChange={(e) => handleChange(e.target.value)}
      className="border border-line bg-surface px-3 py-2 text-sm text-ink"
      aria-label="Sắp xếp sản phẩm"
    >
      <option value="moi-nhat">Mới nhất</option>
      <option value="gia-tang">Giá tăng dần</option>
      <option value="gia-giam">Giá giảm dần</option>
    </select>
  );
}
