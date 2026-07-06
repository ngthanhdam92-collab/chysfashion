"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Period = "yesterday" | "7d" | "custom";

interface Props {
  currentPeriod: Period;
  currentFrom?: string;
  currentTo?: string;
  view: string;
}

export function AnalyticsPeriodPicker({ currentPeriod, currentFrom, currentTo, view }: Props) {
  const router = useRouter();
  const [showCustom, setShowCustom] = useState(currentPeriod === "custom");
  const [from, setFrom] = useState(currentFrom ?? "");
  const [to, setTo]     = useState(currentTo ?? "");

  function navigate(period: Period, f?: string, t?: string) {
    const params = new URLSearchParams({ view, period });
    if (period === "custom" && f && t) {
      params.set("from", f);
      params.set("to", t);
    }
    router.push(`/admin/analytics?${params.toString()}`);
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-wrap items-start gap-2">
      <div className="flex border border-line">
        <button
          onClick={() => { setShowCustom(false); navigate("yesterday"); }}
          className={`px-4 py-2 text-xs tracking-wide transition-colors ${currentPeriod === "yesterday" && !showCustom ? "bg-ink text-paper" : "text-muted hover:text-ink"}`}
        >
          Hôm qua
        </button>
        <button
          onClick={() => { setShowCustom(false); navigate("7d"); }}
          className={`border-x border-line px-4 py-2 text-xs tracking-wide transition-colors ${currentPeriod === "7d" && !showCustom ? "bg-ink text-paper" : "text-muted hover:text-ink"}`}
        >
          7 ngày
        </button>
        <button
          onClick={() => setShowCustom(true)}
          className={`px-4 py-2 text-xs tracking-wide transition-colors ${showCustom ? "bg-ink text-paper" : "text-muted hover:text-ink"}`}
        >
          Tùy chỉnh
        </button>
      </div>

      {showCustom && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 border border-line bg-paper px-3 py-1.5">
            <input
              type="date"
              value={from}
              max={to || today}
              onChange={(e) => setFrom(e.target.value)}
              className="text-xs text-ink focus:outline-none"
            />
            <span className="text-xs text-muted">—</span>
            <input
              type="date"
              value={to}
              min={from}
              max={today}
              onChange={(e) => setTo(e.target.value)}
              className="text-xs text-ink focus:outline-none"
            />
          </div>
          <button
            onClick={() => { if (from && to) navigate("custom", from, to); }}
            disabled={!from || !to || from > to}
            className="bg-ink px-4 py-2 text-xs text-paper transition-colors hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Áp dụng
          </button>
        </div>
      )}
    </div>
  );
}
