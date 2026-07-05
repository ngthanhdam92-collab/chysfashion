"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export function OrderTrackingForm({ defaultCode }: { defaultCode?: string }) {
  const router = useRouter();
  const [code, setCode] = useState(defaultCode ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    router.push(`/tra-cuu-don-hang?code=${encodeURIComponent(code.trim().toUpperCase())}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="VD: CHYS46014465"
          className="w-full border border-line bg-white py-3 pl-10 pr-4 text-sm text-ink placeholder:text-muted focus:border-gold focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={!code.trim()}
        className="bg-ink px-6 py-3 text-sm font-medium text-paper hover:bg-ink/85 disabled:opacity-50"
      >
        Tra cứu
      </button>
    </form>
  );
}
