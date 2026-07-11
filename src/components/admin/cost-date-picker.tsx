"use client";

import { useRouter } from "next/navigation";

export function CostDatePicker({ value, max }: { value: string; max: string }) {
  const router = useRouter();
  return (
    <input
      type="date"
      defaultValue={value}
      max={max}
      className="border border-line bg-white px-3 py-1.5 text-sm text-ink focus:border-gold focus:outline-none"
      onChange={(e) => {
        if (e.target.value) router.push(`/admin/chi-phi?date=${e.target.value}`);
      }}
    />
  );
}
