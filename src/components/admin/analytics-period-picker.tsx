"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Period = "today" | "yesterday" | "7d" | "custom";

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

  const btns: { value: Period; label: string }[] = [
    { value: "today",     label: "Hôm nay" },
    { value: "yesterday", label: "Hôm qua" },
    { value: "7d",        label: "7 ngày" },
    { value: "custom",    label: "Tùy chỉnh" },
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex self-start border border-line">
        {btns.map((btn, i) => {
          const active = btn.value === "custom" ? showCustom : currentPeriod === btn.value && !showCustom;
          return (
            <button
              key={btn.value}
              onClick={() => {
                if (btn.value === "custom") {
                  setShowCustom(true);
                } else {
                  setShowCustom(false);
                  navigate(btn.value);
                }
              }}
              className={`px-3 py-2 text-xs tracking-wide transition-colors sm:px-4 ${i > 0 ? "border-l border-line" : ""} ${active ? "bg-ink text-paper" : "text-muted hover:text-ink"}`}
            >
              {btn.label}
            </button>
          );
        })}
      </div>

      {showCustom && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={from}
            max={to || today}
            onChange={(e) => setFrom(e.target.value)}
            className="border border-line px-2 py-1.5 text-xs text-ink focus:outline-none"
          />
          <span className="text-xs text-muted">—</span>
          <input
            type="date"
            value={to}
            min={from}
            max={today}
            onChange={(e) => setTo(e.target.value)}
            className="border border-line px-2 py-1.5 text-xs text-ink focus:outline-none"
          />
          <button
            onClick={() => { if (from && to) navigate("custom", from, to); }}
            disabled={!from || !to || from > to}
            className="bg-ink px-3 py-1.5 text-xs text-paper transition-colors hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Áp dụng
          </button>
        </div>
      )}
    </div>
  );
}
