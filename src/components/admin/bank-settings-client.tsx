"use client";

import { useState } from "react";
import { saveBankSettings } from "@/lib/bank-settings-actions";
import type { BankSettings } from "@/lib/bank-settings";
import { buildVietQrUrl } from "@/lib/bank-settings";

const BANKS = [
  { code: "MB", name: "MB Bank" },
  { code: "VCB", name: "Vietcombank" },
  { code: "TCB", name: "Techcombank" },
  { code: "ACB", name: "ACB" },
  { code: "VIB", name: "VIB" },
  { code: "TPB", name: "TPBank" },
  { code: "STB", name: "Sacombank" },
  { code: "BIDV", name: "BIDV" },
  { code: "VTB", name: "Vietinbank" },
  { code: "VBA", name: "Agribank" },
];

export function BankSettingsClient({ initial }: { initial: BankSettings }) {
  const [form, setForm] = useState<BankSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof BankSettings>(key: K, value: BankSettings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = await saveBankSettings(form);
    setSaving(false);
    if ("error" in result) { setError(result.error ?? "Lỗi không xác định"); return; }
    setSaved(true);
  }

  const previewUrl =
    form.accountNumber && form.accountName
      ? buildVietQrUrl(form, 250000, "CHYS - PREVIEW")
      : null;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Form */}
      <div className="space-y-5 rounded border border-line bg-white p-6">
        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-ink">Bật chuyển khoản</p>
            <p className="text-xs text-muted">Hiện mục "Chuyển khoản" ở trang thanh toán</p>
          </div>
          <button
            type="button"
            onClick={() => set("enabled", !form.enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              form.enabled ? "bg-gold" : "bg-line"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                form.enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Bank selector */}
        <div>
          <label className="text-xs font-medium text-muted">Ngân hàng</label>
          <select
            value={form.bankCode}
            onChange={(e) => set("bankCode", e.target.value)}
            className="mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-gold focus:outline-none"
          >
            {BANKS.map((b) => (
              <option key={b.code} value={b.code}>{b.name} ({b.code})</option>
            ))}
          </select>
        </div>

        {/* Account number */}
        <div>
          <label className="text-xs font-medium text-muted">Số tài khoản</label>
          <input
            value={form.accountNumber}
            onChange={(e) => set("accountNumber", e.target.value.trim())}
            placeholder="VD: 0123456789"
            className="mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-gold focus:outline-none"
          />
        </div>

        {/* Account name */}
        <div>
          <label className="text-xs font-medium text-muted">Tên chủ tài khoản</label>
          <input
            value={form.accountName}
            onChange={(e) => set("accountName", e.target.value.toUpperCase())}
            placeholder="VD: NGUYEN VAN A"
            className="mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-gold focus:outline-none"
          />
          <p className="mt-1 text-[11px] text-muted">Nhập IN HOA, không dấu</p>
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

      {/* QR Preview */}
      <div className="flex flex-col items-center justify-center rounded border border-line bg-surface p-6">
        <p className="mb-4 text-xs font-medium uppercase tracking-label text-muted">
          Xem trước mã QR
        </p>
        {previewUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="VietQR Preview"
              className="h-64 w-64 object-contain"
            />
            <p className="mt-3 text-center text-xs text-muted">
              {form.bankCode} · {form.accountNumber}
              <br />
              {form.accountName}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted">
            Nhập số tài khoản và tên chủ tài khoản để xem trước mã QR.
          </p>
        )}
      </div>
    </div>
  );
}
