"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateCategoryBannerImage } from "@/lib/categories-actions";
import type { Category } from "@/lib/categories";

interface Props {
  banners: Category[]; // top 3 featured categories
}

export function HomepageCollectionBanners({ banners }: Props) {
  const [images, setImages] = useState<Record<string, string>>(
    Object.fromEntries(banners.map((b) => [b.id, b.bannerImageUrl ?? ""]))
  );
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function handleUpload(cat: Category, file: File) {
    setUploading((p) => ({ ...p, [cat.id]: true }));
    setErrors((p) => ({ ...p, [cat.id]: "" }));
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
      setImages((p) => ({ ...p, [cat.id]: url }));
    } catch (err) {
      setErrors((p) => ({
        ...p,
        [cat.id]: err instanceof Error ? err.message : "Upload thất bại",
      }));
    } finally {
      setUploading((p) => ({ ...p, [cat.id]: false }));
      const ref = fileRefs.current[cat.id];
      if (ref) ref.value = "";
    }
  }

  if (banners.length === 0) {
    return (
      <p className="text-sm text-muted">
        Chưa có danh mục nổi bật nào. Hãy thêm danh mục ở mục trên trước.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        Ảnh banner nên có tỷ lệ ngang (~16:5) để hiển thị đẹp nhất. Kích thước khuyến nghị: 1440×450px.
      </p>
      {banners.map((cat, idx) => {
        const imgUrl = images[cat.id];
        const isUploading = uploading[cat.id];
        const err = errors[cat.id];
        return (
          <div key={cat.id} className="border border-line bg-white">
            {/* Banner preview */}
            <button
              type="button"
              onClick={() => fileRefs.current[cat.id]?.click()}
              className="group relative flex w-full items-end overflow-hidden bg-slate-100"
              style={{ aspectRatio: "16/5" }}
              title="Click để đổi ảnh banner"
            >
              {imgUrl ? (
                <Image
                  src={imgUrl}
                  alt={cat.label}
                  fill
                  className="object-cover"
                  sizes="(min-width: 768px) 700px, 100vw"
                />
              ) : null}
              {/* Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera size={22} className="text-white" />
                <span className="text-xs font-medium text-white">
                  {imgUrl ? "Đổi ảnh banner" : "Upload ảnh banner"}
                </span>
              </div>
              {/* Position badge */}
              <div className="absolute left-3 top-3 rounded bg-ink/70 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                Banner {idx + 1} — {cat.label}
              </div>
              {/* Loading spinner */}
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Loader2 size={28} className="animate-spin text-white" />
                </div>
              )}
              {/* Empty state */}
              {!imgUrl && !isUploading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Camera size={28} />
                  <span className="text-xs">Chưa có ảnh — Click để upload</span>
                </div>
              )}
            </button>

            {err && (
              <p className="px-3 py-1.5 text-xs text-error">{err}</p>
            )}

            <input
              ref={(el) => { fileRefs.current[cat.id] = el; }}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(cat, file);
              }}
            />
          </div>
        );
      })}

      <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        <strong>SQL cần chạy:</strong>
        <code className="ml-2 font-mono">
          ALTER TABLE categories ADD COLUMN IF NOT EXISTS banner_image_url TEXT;
        </code>
      </div>
    </div>
  );
}
