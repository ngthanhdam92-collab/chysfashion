"use client";

import { useState, useTransition } from "react";
import { Check, ExternalLink, Globe, Search } from "lucide-react";
import { PageSeo, STATIC_PAGES } from "@/lib/seo";
import { upsertPageSeo } from "@/lib/seo-actions";

interface PageState {
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
}

interface SaveState {
  pending: boolean;
  saved: boolean;
  error: string;
}

function charCount(s: string, max: number) {
  const n = s.length;
  return (
    <span className={`text-[10px] tabular-nums ${n > max ? "text-red-500" : "text-muted"}`}>
      {n}/{max}
    </span>
  );
}

function PageSeoCard({
  page,
  initial,
}: {
  page: (typeof STATIC_PAGES)[number];
  initial: PageSeo | undefined;
}) {
  const [, startTransition] = useTransition();
  const [state, setState] = useState<PageState>({
    metaTitle: initial?.metaTitle ?? "",
    metaDescription: initial?.metaDescription ?? "",
    ogImage: initial?.ogImage ?? "",
  });
  const [save, setSave] = useState<SaveState>({ pending: false, saved: false, error: "" });

  const isCustomized = !!(initial?.metaTitle || initial?.metaDescription || initial?.ogImage);

  function handleSave() {
    setSave({ pending: true, saved: false, error: "" });
    startTransition(async () => {
      const result = await upsertPageSeo(page.key, state);
      if (result?.error) {
        setSave({ pending: false, saved: false, error: result.error });
      } else {
        setSave({ pending: false, saved: true, error: "" });
        setTimeout(() => setSave((s) => ({ ...s, saved: false })), 3000);
      }
    });
  }

  return (
    <div className="rounded border border-line bg-white">
      {/* Card header */}
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <div className="flex items-center gap-2.5">
          <span
            className={`h-2 w-2 rounded-full ${isCustomized ? "bg-emerald-500" : "bg-gray-300"}`}
            title={isCustomized ? "Đã tuỳ chỉnh SEO" : "Đang dùng mặc định"}
          />
          <span className="font-medium text-sm text-ink">{page.label}</span>
          <a
            href={page.path}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-0.5 text-[11px] text-muted hover:text-gold-dark"
          >
            <span>{page.path}</span>
            <ExternalLink size={10} />
          </a>
        </div>
      </div>

      {/* Fields */}
      <div className="px-5 py-4 space-y-3">
        {/* Meta title */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-[11px] font-semibold uppercase tracking-label text-muted">
              Meta Title
            </label>
            {charCount(state.metaTitle, 60)}
          </div>
          <input
            type="text"
            value={state.metaTitle}
            onChange={(e) => setState((s) => ({ ...s, metaTitle: e.target.value }))}
            maxLength={80}
            placeholder="Để trống sẽ dùng tiêu đề mặc định của trang"
            className="w-full border border-line bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
        </div>

        {/* Meta description */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-[11px] font-semibold uppercase tracking-label text-muted">
              Meta Description
            </label>
            {charCount(state.metaDescription, 160)}
          </div>
          <textarea
            value={state.metaDescription}
            onChange={(e) => setState((s) => ({ ...s, metaDescription: e.target.value }))}
            maxLength={200}
            rows={2}
            placeholder="Mô tả ngắn hiển thị trên kết quả Google (khuyến nghị 120–160 ký tự)"
            className="w-full resize-none border border-line bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
        </div>

        {/* OG image */}
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-label text-muted">
            OG Image URL
          </label>
          <input
            type="url"
            value={state.ogImage}
            onChange={(e) => setState((s) => ({ ...s, ogImage: e.target.value }))}
            placeholder="https://... (ảnh hiển thị khi chia sẻ link, khuyến nghị 1200×630)"
            className="w-full border border-line bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={save.pending}
            className="flex items-center gap-1.5 bg-ink px-4 py-2 text-[11px] tracking-label uppercase text-paper hover:bg-ink/85 disabled:opacity-50"
          >
            {save.pending ? (
              "Đang lưu..."
            ) : save.saved ? (
              <>
                <Check size={12} /> Đã lưu
              </>
            ) : (
              "Lưu"
            )}
          </button>
          {save.error && <p className="text-xs text-red-600">{save.error}</p>}
        </div>
      </div>

      {/* Google preview */}
      {(state.metaTitle || state.metaDescription) && (
        <div className="border-t border-line bg-[#faf9f7] px-5 py-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-label text-muted">
            Xem trước Google
          </p>
          <div className="flex items-center gap-1 text-xs text-muted mb-0.5">
            <Globe size={10} />
            <span>chysfashion.com{page.path}</span>
          </div>
          <p className="text-[15px] text-[#1a0dab] leading-snug truncate">
            {state.metaTitle || `${page.label} — CHYS Fashion`}
          </p>
          {state.metaDescription && (
            <p className="mt-0.5 text-xs text-[#4d5156] leading-relaxed line-clamp-2">
              {state.metaDescription}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function SeoClient({ seoData }: { seoData: PageSeo[] }) {
  const [search, setSearch] = useState("");

  const seoMap = Object.fromEntries(seoData.map((s) => [s.pageKey, s]));

  const filtered = STATIC_PAGES.filter(
    (p) =>
      !search.trim() ||
      p.label.toLowerCase().includes(search.trim().toLowerCase()) ||
      p.path.includes(search.trim().toLowerCase())
  );

  const customizedCount = seoData.filter(
    (s) => s.metaTitle || s.metaDescription || s.ogImage
  ).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-ink">SEO Settings</h1>
          <p className="mt-0.5 text-sm text-muted">
            Tuỳ chỉnh meta title, description và ảnh OG cho từng trang.{" "}
            <span className="text-emerald-600 font-medium">{customizedCount}</span>
            /{STATIC_PAGES.length} trang đã cấu hình.
          </p>
        </div>
        <div className="relative shrink-0">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm trang..."
            className="w-44 border border-line bg-white pl-8 pr-3 py-2 text-xs focus:border-gold focus:outline-none"
          />
        </div>
      </div>

      {/* Tip */}
      <div className="mb-5 rounded border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
        <strong>Ghi chú:</strong> SEO cho trang sản phẩm cụ thể chỉnh trong phần{" "}
        <a href="/admin/products" className="underline hover:no-underline">
          Sản phẩm
        </a>{" "}
        → chỉnh sửa sản phẩm → mục SEO ở cuối form.
        <span className="ml-1.5">Để trống = dùng mặc định.</span>
      </div>

      <div className="space-y-4">
        {filtered.map((page) => (
          <PageSeoCard key={page.key} page={page} initial={seoMap[page.key]} />
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted">Không tìm thấy trang nào.</p>
        )}
      </div>
    </div>
  );
}
