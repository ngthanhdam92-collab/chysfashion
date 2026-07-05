"use client";

import { useState, useTransition } from "react";
import { saveAnnouncementBar } from "@/lib/homepage-settings-actions";
import type { AnnouncementBar } from "@/lib/homepage-settings";

interface Props {
  current: AnnouncementBar;
}

const FONT_OPTIONS: { value: AnnouncementBar["fontStyle"]; label: string }[] = [
  { value: "uppercase", label: "Hoa + Giãn cách (mặc định)" },
  { value: "normal", label: "Thường (sans-serif)" },
  { value: "serif", label: "Serif (chân)" },
];

export function HomepageAnnouncementBar({ current }: Props) {
  const [bar, setBar] = useState<AnnouncementBar>(current);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof AnnouncementBar>(key: K, value: AnnouncementBar[K]) {
    setBar((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = await saveAnnouncementBar(bar);
      if (res && "error" in res) setError(res.error ?? "Lỗi không xác định");
      else setSaved(true);
    });
  }

  const fontClass =
    bar.fontStyle === "serif"
      ? "font-serif"
      : bar.fontStyle === "uppercase"
      ? "text-[11px] tracking-widest uppercase"
      : "text-sm";

  return (
    <div className="space-y-5">
      {/* Live preview */}
      <div
        className={`flex items-center justify-center py-2 ${fontClass}`}
        style={{ backgroundColor: bar.bgColor, color: bar.textColor }}
      >
        {bar.text || "Nội dung thanh thông báo"}
      </div>

      {/* Enable toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => update("enabled", !bar.enabled)}
          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
            bar.enabled ? "bg-ink" : "bg-line"
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 translate-x-0.5 rounded-full bg-white shadow transition-transform ${
              bar.enabled ? "translate-x-[18px]" : ""
            }`}
          />
        </button>
        <span className="text-sm text-ink">
          {bar.enabled ? "Đang hiển thị" : "Đang ẩn"}
        </span>
      </div>

      {/* Text */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink">Nội dung</label>
        <input
          type="text"
          value={bar.text}
          onChange={(e) => update("text", e.target.value)}
          className="w-full border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-gold focus:outline-none"
          placeholder="VD: Miễn phí vận chuyển cho đơn từ 500.000đ"
        />
      </div>

      {/* Colors */}
      <div className="flex flex-wrap gap-6">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink">Màu nền</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={bar.bgColor}
              onChange={(e) => update("bgColor", e.target.value)}
              className="h-9 w-14 cursor-pointer rounded border border-line bg-white p-0.5"
            />
            <span className="font-mono text-xs text-muted">{bar.bgColor}</span>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink">Màu chữ</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={bar.textColor}
              onChange={(e) => update("textColor", e.target.value)}
              className="h-9 w-14 cursor-pointer rounded border border-line bg-white p-0.5"
            />
            <span className="font-mono text-xs text-muted">{bar.textColor}</span>
          </div>
        </div>
      </div>

      {/* Font */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink">Phông chữ</label>
        <div className="flex flex-wrap gap-2">
          {FONT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update("fontStyle", opt.value)}
              className={`border px-3 py-1.5 text-xs transition-colors ${
                bar.fontStyle === opt.value
                  ? "border-ink bg-ink text-paper"
                  : "border-line bg-white text-ink hover:border-ink/40"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-xs text-error">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="bg-ink px-5 py-2 text-[12px] uppercase tracking-label text-paper hover:bg-ink/85 disabled:opacity-50"
        >
          {isPending ? "Đang lưu…" : "Lưu"}
        </button>
        {saved && <span className="text-xs text-emerald-600">Đã lưu ✓</span>}
      </div>
    </div>
  );
}
