"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { DEFAULT_SIZE_CHART } from "@/lib/size-chart";
import type { SizeChartTemplate } from "@/lib/size-chart-templates";

type CellState = Record<string, string>;

const FIELDS = [
  { key: "heightMin",    label: "Cao min (cm)" },
  { key: "heightMax",    label: "Cao max (cm)" },
  { key: "weightMin",    label: "Nặng min (kg)" },
  { key: "weightMax",    label: "Nặng max (kg)" },
  { key: "bodyLength",   label: "Dài thân" },
  { key: "chest",        label: "½ Ngực" },
  { key: "sleeveLength", label: "Dài tay" },
  { key: "bicep",        label: "Bắp tay" },
  { key: "cuff",         label: "Cửa tay" },
  { key: "neck",         label: "Ngang cổ" },
];

interface Props {
  template?: SizeChartTemplate;
  action: (formData: FormData) => Promise<{ error: string } | void>;
}

export function SizeChartForm({ template, action }: Props) {
  const [name, setName] = useState(template?.name ?? "");
  const [sizes, setSizes] = useState<string[]>(Object.keys(template?.data ?? {}));
  const [cells, setCells] = useState<Record<string, CellState>>(() => {
    const init: Record<string, CellState> = {};
    for (const s of Object.keys(template?.data ?? {})) {
      const custom = (template?.data[s] ?? {}) as Record<string, number | undefined>;
      const def = DEFAULT_SIZE_CHART[s] ?? {};
      init[s] = {
        heightMin:    String(custom.heightMin    ?? def.heightMin    ?? ""),
        heightMax:    String(custom.heightMax    ?? def.heightMax    ?? ""),
        weightMin:    String(custom.weightMin    ?? def.weightMin    ?? ""),
        weightMax:    String(custom.weightMax    ?? def.weightMax    ?? ""),
        bodyLength:   String(custom.bodyLength   ?? def.bodyLength   ?? ""),
        chest:        String(custom.chest        ?? def.chest        ?? ""),
        sleeveLength: String(custom.sleeveLength ?? def.sleeveLength ?? ""),
        bicep:        String(custom.bicep        ?? def.bicep        ?? ""),
        cuff:         String(custom.cuff         ?? def.cuff         ?? ""),
        neck:         String(custom.neck         ?? def.neck         ?? ""),
      };
    }
    return init;
  });
  const [newSize, setNewSize] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function addSize() {
    const s = newSize.trim().toUpperCase();
    if (!s || sizes.includes(s)) { setNewSize(""); return; }
    const def = DEFAULT_SIZE_CHART[s] ?? {};
    setSizes((prev) => [...prev, s]);
    setCells((prev) => ({
      ...prev,
      [s]: {
        heightMin:    String(def.heightMin    ?? ""),
        heightMax:    String(def.heightMax    ?? ""),
        weightMin:    String(def.weightMin    ?? ""),
        weightMax:    String(def.weightMax    ?? ""),
        bodyLength:   String(def.bodyLength   ?? ""),
        chest:        String(def.chest        ?? ""),
        sleeveLength: String(def.sleeveLength ?? ""),
        bicep:        String(def.bicep        ?? ""),
        cuff:         String(def.cuff         ?? ""),
        neck:         String(def.neck         ?? ""),
      },
    }));
    setNewSize("");
  }

  function removeSize(s: string) {
    setSizes((prev) => prev.filter((x) => x !== s));
    setCells((prev) => { const next = { ...prev }; delete next[s]; return next; });
  }

  function setCell(size: string, field: string, value: string) {
    setCells((prev) => ({
      ...prev,
      [size]: { ...(prev[size] ?? {}), [field]: value },
    }));
  }

  const dataJson = JSON.stringify(
    Object.fromEntries(
      sizes.map((s) => {
        const row = cells[s] ?? {};
        return [
          s,
          {
            heightMin:    Number(row.heightMin)    || 0,
            heightMax:    Number(row.heightMax)    || 0,
            weightMin:    Number(row.weightMin)    || 0,
            weightMax:    Number(row.weightMax)    || 0,
            bodyLength:   Number(row.bodyLength)   || 0,
            chest:        Number(row.chest)        || 0,
            sleeveLength: Number(row.sleeveLength) || 0,
            bicep:        Number(row.bicep)        || 0,
            cuff:         Number(row.cuff)         || 0,
            neck:         Number(row.neck)         || 0,
          },
        ];
      })
    )
  );

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);
    const result = await action(formData);
    if (result && "error" in result) {
      setError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-8">
      <input type="hidden" name="data" value={dataJson} />

      {/* Tên bảng */}
      <div>
        <label className="text-xs text-muted" htmlFor="sc-name">
          Tên bảng size *
        </label>
        <input
          id="sc-name"
          name="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="VD: Áo thun nam, Áo khoác nữ..."
          className="mt-1 w-full max-w-sm border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
        />
      </div>

      {/* Thêm size */}
      <div>
        <p className="mb-3 text-xs font-medium uppercase tracking-label text-muted">
          Các size trong bảng
        </p>
        <div className="flex items-center gap-2">
          <input
            value={newSize}
            onChange={(e) => setNewSize(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); addSize(); }
            }}
            placeholder="Nhập size (S, M, L, XL, 2XL...)"
            className="w-52 border border-line bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
          <button
            type="button"
            onClick={addSize}
            className="flex items-center gap-1.5 border border-line bg-white px-4 py-2 text-sm text-ink hover:border-gold hover:text-gold-dark"
          >
            <Plus size={14} /> Thêm
          </button>
        </div>
        {sizes.length === 0 && (
          <p className="mt-2 text-xs text-muted">
            Thêm ít nhất một size. Nếu nhập S / M / L / XL / 2XL / 3XL sẽ tự điền số đo mặc định.
          </p>
        )}
      </div>

      {/* Bảng thông số */}
      {sizes.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-label text-muted">
            Thông số chi tiết
          </p>
          <div className="overflow-x-auto border border-line bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-line bg-cream/50 text-[10px] uppercase tracking-label text-muted">
                  <th className="px-3 py-2.5 text-left w-32">Thông số</th>
                  {sizes.map((s) => (
                    <th key={s} className="px-2 py-2.5 text-center whitespace-nowrap">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className="font-bold text-ink text-xs">{s}</span>
                        <button
                          type="button"
                          onClick={() => removeSize(s)}
                          className="text-muted hover:text-error"
                          title={`Xóa size ${s}`}
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FIELDS.map(({ key, label }, rowIdx) => (
                  <tr
                    key={key}
                    className={`border-b border-line last:border-0 ${rowIdx % 2 === 0 ? "" : "bg-cream/30"}`}
                  >
                    <td className="px-3 py-2 text-xs text-muted whitespace-nowrap">{label}</td>
                    {sizes.map((s) => (
                      <td key={s} className="px-2 py-1.5 text-center">
                        <input
                          type="number"
                          step="0.1"
                          min={0}
                          value={(cells[s] ?? {})[key] ?? ""}
                          onChange={(e) => setCell(s, key, e.target.value)}
                          className="w-16 border border-line bg-white px-1.5 py-1 text-xs focus:border-gold focus:outline-none"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-1.5 text-xs text-muted">
            Chiều cao và cân nặng dùng để tính gợi ý size. Các thông số còn lại hiển thị trong bảng hướng dẫn.
          </p>
        </div>
      )}

      {error && <p className="text-sm text-error">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="bg-ink px-6 py-3 text-[12px] tracking-label uppercase text-paper transition-colors hover:bg-ink/85 disabled:opacity-50"
      >
        {submitting ? "Đang lưu..." : "Lưu bảng size"}
      </button>
    </form>
  );
}
