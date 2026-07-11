"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { formatVnd } from "@/lib/utils";
import { addCostEntry, deleteCostEntry } from "@/lib/costs";
import type { CostEntry } from "@/lib/costs";

interface Props {
  entries: CostEntry[];
  currentMonth: string; // "YYYY-MM"
}

function parseNum(raw: string): number {
  return Math.round(Number(raw.replace(/\./g, "").replace(/,/g, "")) || 0);
}

function fmtDateVi(dateStr: string) {
  const [, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

export function IncidentalCostPanel({ entries, currentMonth }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [date, setDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  });
  const [desc, setDesc] = useState("");
  const [amt, setAmt] = useState("");
  const [error, setError] = useState<string | null>(null);

  const total = entries.reduce((s, e) => s + e.amount, 0);

  function handleAdd() {
    const amount = parseNum(amt);
    if (!amount) { setError("Nhập số tiền"); return; }
    if (!desc.trim()) { setError("Nhập mô tả"); return; }
    setError(null);
    startTransition(async () => {
      const res = await addCostEntry(date, "incidental", amount, desc.trim());
      if ("error" in res) { setError(res.error ?? "Lỗi"); return; }
      setAmt("");
      setDesc("");
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteCostEntry(id);
      router.refresh();
    });
  }

  const [y, m] = currentMonth.split("-");
  const monthLabel = `Tháng ${m}/${y}`;

  return (
    <div className="rounded border border-line bg-surface p-5">
      <div className="mb-1 flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-base text-ink">Chi phí phát sinh</h2>
            <span className="rounded bg-line px-2 py-0.5 text-[10px] font-medium uppercase tracking-label text-muted">
              {monthLabel}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted">
            Mua thiết bị, đồ dùng, phần mềm, sửa chữa... Dùng để tính lợi nhuận tháng chính xác.
          </p>
        </div>
        {total > 0 && (
          <span className="font-mono text-sm font-semibold text-violet-600">{formatVnd(total)}</span>
        )}
      </div>

      {/* Entry list */}
      {entries.length > 0 && (
        <div className="my-4 divide-y divide-line border border-line">
          {entries.map((e) => (
            <div key={e.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="w-10 shrink-0 text-xs font-medium text-muted">
                {fmtDateVi(e.date)}
              </span>
              <span className="flex-1 text-sm text-ink">{e.note || "—"}</span>
              <span className="shrink-0 font-mono text-sm font-semibold text-violet-600">
                {formatVnd(e.amount)}
              </span>
              <button
                onClick={() => handleDelete(e.id)}
                disabled={pending}
                className="shrink-0 rounded p-1 text-muted hover:text-red-600 disabled:opacity-40"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <div className="flex items-center gap-3 bg-cream/40 px-4 py-2.5">
            <span className="flex-1 text-xs font-medium text-muted">Tổng tháng này</span>
            <span className="font-mono text-sm font-bold text-violet-600">{formatVnd(total)}</span>
            <span className="w-6" />
          </div>
        </div>
      )}

      {/* Add form */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1.5 block text-xs text-muted">Ngày phát sinh</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-line bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
        </div>
        <div className="flex-1 min-w-40">
          <label className="mb-1.5 block text-xs text-muted">Mô tả</label>
          <input
            type="text"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Mua máy dán băng keo, phần mềm..."
            className="w-full border border-line bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-muted">Số tiền</label>
          <input
            type="text"
            inputMode="numeric"
            value={amt}
            onChange={(e) => {
              const raw = e.target.value.replace(/\./g, "").replace(/[^0-9]/g, "");
              setAmt(raw ? Number(raw).toLocaleString("vi-VN") : "");
            }}
            placeholder="0"
            className="w-32 border border-line bg-white px-3 py-2 text-right font-mono text-sm focus:border-gold focus:outline-none"
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={pending}
          className="flex items-center gap-1.5 rounded border border-violet-500 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100 disabled:opacity-50"
        >
          <Plus size={14} /> Thêm
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
