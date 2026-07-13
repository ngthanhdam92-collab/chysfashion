"use client";

import { useState } from "react";
import { savePixelSettings } from "@/lib/pixel-settings-actions";
import type { PixelSettings } from "@/lib/pixel-settings";

export function PixelSettingsClient({ initial }: { initial: PixelSettings }) {
  const [form, setForm] = useState<PixelSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof PixelSettings>(key: K, value: PixelSettings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = await savePixelSettings(form);
    setSaving(false);
    if ("error" in result) { setError(result.error ?? "Lỗi không xác định"); return; }
    setSaved(true);
  }

  return (
    <div className="max-w-lg space-y-6 rounded border border-line bg-white p-6">
      {/* Facebook Pixel */}
      <div>
        <label className="text-xs font-medium text-muted">Facebook Pixel ID</label>
        <input
          value={form.fbPixelId}
          onChange={(e) => set("fbPixelId", e.target.value.trim())}
          placeholder="VD: 1234567890123456"
          className="mt-1 w-full border border-line bg-white px-3 py-2.5 font-mono text-sm text-ink placeholder:font-sans placeholder:text-muted focus:border-gold focus:outline-none"
        />
        <p className="mt-1 text-[11px] text-muted">
          Facebook Business Manager → Events Manager → Data Sources → Pixel
        </p>
      </div>

      {/* TikTok Pixel */}
      <div>
        <label className="text-xs font-medium text-muted">TikTok Pixel ID</label>
        <input
          value={form.ttPixelId}
          onChange={(e) => set("ttPixelId", e.target.value.trim())}
          placeholder="VD: CXXXXXXXXXXXXXXX"
          className="mt-1 w-full border border-line bg-white px-3 py-2.5 font-mono text-sm text-ink placeholder:font-sans placeholder:text-muted focus:border-gold focus:outline-none"
        />
        <p className="mt-1 text-[11px] text-muted">
          TikTok Ads Manager → Assets → Events → Manage → Web Events
        </p>
      </div>

      {/* Status box */}
      <div className="rounded border border-line bg-surface px-4 py-3 text-xs text-muted space-y-1">
        <p className="font-medium text-ink">Events được ghi nhận tự động:</p>
        <p>• <span className="font-medium text-ink">PageView</span> — mỗi lần chuyển trang</p>
        <p>• <span className="font-medium text-ink">InitiateCheckout</span> — khi bấm đặt hàng</p>
        <p>• <span className="font-medium text-ink">Purchase</span> — khi đặt hàng thành công (kèm giá trị đơn)</p>
      </div>

      {error && (
        <p className="rounded border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">{error}</p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-ink/85 disabled:opacity-50"
      >
        {saving ? "Đang lưu..." : saved ? "✓ Đã lưu" : "Lưu cài đặt"}
      </button>
    </div>
  );
}
