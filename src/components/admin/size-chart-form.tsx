"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronDown } from "lucide-react";
import {
  DEFAULT_SIZE_CHART,
  DEFAULT_COLUMNS,
  COLUMN_PRESETS,
  parseSizeChartData,
  type SizeChartColumn,
} from "@/lib/size-chart";
import type { SizeChartTemplate } from "@/lib/size-chart-templates";

interface Props {
  template?: SizeChartTemplate;
  action: (formData: FormData) => Promise<{ error: string } | void>;
}

function genKey(label: string, existing: string[]) {
  const base = label
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "") || "col";
  let key = base;
  let i = 2;
  while (existing.includes(key)) { key = `${base}_${i++}`; }
  return key;
}

export function SizeChartForm({ template, action }: Props) {
  const initial = template ? parseSizeChartData(template.data) : null;

  const [name, setName] = useState(template?.name ?? "");
  const [columns, setColumns] = useState<SizeChartColumn[]>(initial?.columns ?? DEFAULT_COLUMNS);
  const [sizes, setSizes] = useState<string[]>(initial ? Object.keys(initial.rows) : []);
  const [cells, setCells] = useState<Record<string, Record<string, string>>>(() => {
    if (!initial) return {};
    const out: Record<string, Record<string, string>> = {};
    for (const [s, vals] of Object.entries(initial.rows)) {
      out[s] = {};
      for (const col of initial.columns) {
        out[s][col.key] = String((vals as Record<string, number>)[col.key] ?? "");
      }
    }
    return out;
  });

  // New column inputs
  const [newColLabel, setNewColLabel] = useState("");
  const [newColUnit, setNewColUnit] = useState("");
  // New size input
  const [newSize, setNewSize] = useState("");
  // Preset picker
  const [presetOpen, setPresetOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Column management ─────────────────────────────────────────────────────

  function addColumn() {
    const label = newColLabel.trim();
    if (!label) return;
    const existingKeys = columns.map((c) => c.key);
    const key = genKey(label, existingKeys);
    const unit = newColUnit.trim() || undefined;
    setColumns((prev) => [...prev, { key, label, unit }]);
    // Add empty cell for this column in all existing sizes
    setCells((prev) => {
      const next = { ...prev };
      for (const s of sizes) {
        next[s] = { ...(next[s] ?? {}), [key]: "" };
      }
      return next;
    });
    setNewColLabel("");
    setNewColUnit("");
  }

  function removeColumn(key: string) {
    setColumns((prev) => prev.filter((c) => c.key !== key));
    setCells((prev) => {
      const next = { ...prev };
      for (const s of Object.keys(next)) {
        const { [key]: _, ...rest } = next[s];
        next[s] = rest;
      }
      return next;
    });
  }

  function applyPreset(presetName: string) {
    const preset = COLUMN_PRESETS[presetName];
    if (!preset) return;
    setColumns(preset);
    // Re-init cells with new column keys
    setCells((prev) => {
      const next: Record<string, Record<string, string>> = {};
      for (const s of sizes) {
        next[s] = {};
        for (const col of preset) {
          // Carry over any existing value for this key
          next[s][col.key] = prev[s]?.[col.key] ?? "";
        }
      }
      return next;
    });
    setPresetOpen(false);
  }

  // ── Size management ───────────────────────────────────────────────────────

  function addSize() {
    const s = newSize.trim().toUpperCase();
    if (!s || sizes.includes(s)) { setNewSize(""); return; }
    const def = DEFAULT_SIZE_CHART[s] ?? {};
    const rowCells: Record<string, string> = {};
    for (const col of columns) {
      rowCells[col.key] = String((def as Record<string, number>)[col.key] ?? "");
    }
    setSizes((prev) => [...prev, s]);
    setCells((prev) => ({ ...prev, [s]: rowCells }));
    setNewSize("");
  }

  function removeSize(s: string) {
    setSizes((prev) => prev.filter((x) => x !== s));
    setCells((prev) => { const next = { ...prev }; delete next[s]; return next; });
  }

  function setCell(size: string, colKey: string, value: string) {
    setCells((prev) => ({
      ...prev,
      [size]: { ...(prev[size] ?? {}), [colKey]: value },
    }));
  }

  // ── Serialise ─────────────────────────────────────────────────────────────

  const dataJson = JSON.stringify({
    columns,
    rows: Object.fromEntries(
      sizes.map((s) => [
        s,
        Object.fromEntries(
          columns.map((col) => [col.key, Number((cells[s] ?? {})[col.key]) || 0])
        ),
      ])
    ),
  });

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
    <form action={handleSubmit} className="space-y-10">
      <input type="hidden" name="data" value={dataJson} />

      {/* ── Tên bảng ── */}
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
          placeholder="VD: Áo thun nam, Quần nữ..."
          className="mt-1 w-full max-w-sm border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
        />
      </div>

      {/* ── Thông số đo (columns) ── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-label text-muted">
            Thông số đo
          </p>
          {/* Preset picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setPresetOpen((v) => !v)}
              className="flex items-center gap-1.5 border border-line bg-white px-3 py-1.5 text-xs text-ink hover:border-gold hover:text-gold-dark"
            >
              Dùng mẫu có sẵn <ChevronDown size={12} />
            </button>
            {presetOpen && (
              <div className="absolute right-0 top-full z-20 mt-1 w-44 border border-line bg-white shadow-md">
                {Object.keys(COLUMN_PRESETS).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-cream"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Column list */}
        {columns.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {columns.map((col) => (
              <span
                key={col.key}
                className="flex items-center gap-1.5 rounded border border-line bg-cream/60 px-2.5 py-1 text-xs text-ink"
              >
                {col.label}
                {col.unit && <span className="text-muted">({col.unit})</span>}
                <button
                  type="button"
                  onClick={() => removeColumn(col.key)}
                  className="ml-0.5 text-muted/60 hover:text-error"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Add column form */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={newColLabel}
            onChange={(e) => setNewColLabel(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addColumn(); } }}
            placeholder="Tên thông số (VD: Vòng ngực)"
            className="w-44 border border-line bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
          <input
            value={newColUnit}
            onChange={(e) => setNewColUnit(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addColumn(); } }}
            placeholder="Đơn vị (cm, kg...)"
            className="w-28 border border-line bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
          <button
            type="button"
            onClick={addColumn}
            className="flex items-center gap-1.5 border border-line bg-white px-4 py-2 text-sm text-ink hover:border-gold hover:text-gold-dark"
          >
            <Plus size={14} /> Thêm
          </button>
        </div>
        {columns.length === 0 && (
          <p className="mt-2 text-xs text-muted">
            Chọn mẫu có sẵn hoặc thêm thủ công từng thông số đo.
          </p>
        )}
      </div>

      {/* ── Sizes ── */}
      <div>
        <p className="mb-3 text-xs font-medium uppercase tracking-label text-muted">
          Các size trong bảng
        </p>
        <div className="flex items-center gap-2">
          <input
            value={newSize}
            onChange={(e) => setNewSize(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSize(); } }}
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
            Nhập S / M / L / XL / 2XL / 3XL sẽ tự điền số đo mặc định (nếu thông số khớp).
          </p>
        )}
      </div>

      {/* ── Data table ── */}
      {sizes.length > 0 && columns.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-label text-muted">
            Thông số chi tiết
          </p>
          <div className="overflow-x-auto border border-line bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-line bg-cream/50 text-[10px] uppercase tracking-label text-muted">
                  <th className="w-36 px-3 py-2.5 text-left">Thông số</th>
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
                {columns.map((col, rowIdx) => (
                  <tr
                    key={col.key}
                    className={`border-b border-line last:border-0 ${rowIdx % 2 === 0 ? "" : "bg-cream/30"}`}
                  >
                    <td className="px-3 py-2 text-xs text-muted whitespace-nowrap">
                      {col.label}
                      {col.unit && <span className="ml-1 text-muted/60">({col.unit})</span>}
                    </td>
                    {sizes.map((s) => (
                      <td key={s} className="px-2 py-1.5 text-center">
                        <input
                          type="number"
                          step="0.1"
                          min={0}
                          value={(cells[s] ?? {})[col.key] ?? ""}
                          onChange={(e) => setCell(s, col.key, e.target.value)}
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
            Thêm thông số{" "}
            <span className="font-medium text-ink">Cao min / Cao max / Nặng min / Nặng max</span>{" "}
            (key: heightMin, heightMax, weightMin, weightMax) để bật tính năng gợi ý size tự động.
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
