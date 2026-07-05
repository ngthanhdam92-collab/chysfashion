"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateCategoryBannerImage } from "@/lib/categories-actions";
import { saveCollectionBanners } from "@/lib/homepage-settings-actions";
import type { Category } from "@/lib/categories";

interface Props {
  categories: Category[];
  selectedValues: string[]; // current 3 banner category values
}

const SLOTS = [1, 2, 3];

export function HomepageCollectionBanners({ categories, selectedValues }: Props) {
  // Slots: array of 3 category values (empty string = none selected)
  const [slots, setSlots] = useState<string[]>([
    selectedValues[0] ?? "",
    selectedValues[1] ?? "",
    selectedValues[2] ?? "",
  ]);
  const [uploading, setUploading] = useState<Record<number, boolean>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<number, string>>({});
  // Local banner image overrides after upload
  const [bannerImages, setBannerImages] = useState<Record<string, string>>(
    Object.fromEntries(categories.map((c) => [c.value, c.bannerImageUrl ?? ""]))
  );
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  function getCat(value: string): Category | undefined {
    return categories.find((c) => c.value === value);
  }

  function handleSlotChange(idx: number, value: string) {
    setSlots((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
    setSaved(false);
  }

  function handleSave() {
    setSaveError(null);
    startTransition(async () => {
      const res = await saveCollectionBanners(slots.filter(Boolean));
      if (res && "error" in res) setSaveError(res.error ?? "Lỗi không xác định");
      else setSaved(true);
    });
  }

  async function handleUpload(slotIdx: number, file: File) {
    const catValue = slots[slotIdx];
    const cat = getCat(catValue);
    if (!cat) return;

    setUploading((p) => ({ ...p, [slotIdx]: true }));
    setUploadErrors((p) => ({ ...p, [slotIdx]: "" }));
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `banners/collection-${cat.id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("product-media")
        .upload(path, file, { upsert: true });
      if (upErr) throw new Error(upErr.message);
      const { data } = supabase.storage.from("product-media").getPublicUrl(path);
      const url = data.publicUrl;
      const result = await updateCategoryBannerImage(cat.id, url);
      if (result && "error" in result) throw new Error(result.error);
      setBannerImages((p) => ({ ...p, [catValue]: url }));
    } catch (err) {
      setUploadErrors((p) => ({
        ...p,
        [slotIdx]: err instanceof Error ? err.message : "Upload thất bại",
      }));
    } finally {
      setUploading((p) => ({ ...p, [slotIdx]: false }));
      const ref = fileRefs.current[slotIdx];
      if (ref) ref.value = "";
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted">
        Ảnh banner nên có tỷ lệ ngang (~16:5). Kích thước khuyến nghị: 1440×450px.
      </p>

      {SLOTS.map((_, idx) => {
        const catValue = slots[idx];
        const cat = getCat(catValue);
        const imgUrl = catValue ? (bannerImages[catValue] || cat?.imageUrl || "") : "";
        const isUploading = uploading[idx];
        const err = uploadErrors[idx];

        return (
          <div key={idx} className="border border-line bg-white">
            {/* Category selector */}
            <div className="flex items-center gap-3 border-b border-line px-4 py-3">
              <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-muted">
                Banner {idx + 1}
              </span>
              <select
                value={catValue}
                onChange={(e) => handleSlotChange(idx, e.target.value)}
                className="flex-1 border border-line bg-white px-3 py-1.5 text-sm text-ink focus:border-gold focus:outline-none"
              >
                <option value="">— Chọn danh mục —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Banner image preview */}
            <button
              type="button"
              onClick={() => {
                if (!catValue) return;
                fileRefs.current[idx]?.click();
              }}
              disabled={!catValue}
              className="group relative flex w-full items-end overflow-hidden bg-slate-100 disabled:cursor-not-allowed"
              style={{ aspectRatio: "16/5" }}
              title={catValue ? "Click để đổi ảnh banner" : "Chọn danh mục trước"}
            >
              {imgUrl && (
                <Image
                  src={imgUrl}
                  alt={cat?.label ?? ""}
                  fill
                  className="object-cover"
                  sizes="(min-width: 768px) 700px, 100vw"
                />
              )}
              {/* Hover overlay */}
              {catValue && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera size={22} className="text-white" />
                  <span className="text-xs font-medium text-white">
                    {imgUrl ? "Đổi ảnh banner" : "Upload ảnh banner"}
                  </span>
                </div>
              )}
              {/* Loading */}
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Loader2 size={28} className="animate-spin text-white" />
                </div>
              )}
              {/* Empty state */}
              {!imgUrl && !isUploading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Camera size={28} />
                  <span className="text-xs">
                    {catValue ? "Chưa có ảnh — Click để upload" : "Chọn danh mục để upload ảnh"}
                  </span>
                </div>
              )}
            </button>

            {err && <p className="px-3 py-1.5 text-xs text-error">{err}</p>}

            <input
              ref={(el) => { fileRefs.current[idx] = el; }}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(idx, file);
              }}
            />
          </div>
        );
      })}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="bg-ink px-5 py-2 text-[12px] uppercase tracking-label text-paper hover:bg-ink/85 disabled:opacity-50"
        >
          {isPending ? "Đang lưu…" : "Lưu banner"}
        </button>
        {saved && <span className="text-xs text-emerald-600">Đã lưu ✓</span>}
        {saveError && <span className="text-xs text-error">{saveError}</span>}
      </div>

    </div>
  );
}
