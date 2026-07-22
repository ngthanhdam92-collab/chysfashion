"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createStory, updateStory } from "@/lib/stories-actions";
import { formatVnd } from "@/lib/utils";
import type { Story, StoryProductLink } from "@/lib/stories";
import type { Product } from "@/lib/types";
import { X, Plus, Search, Upload } from "lucide-react";

interface Props {
  story?: Story;
  products: Product[];
}

export function StoryForm({ story, products }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [imageUrl, setImageUrl] = useState(story?.imageUrl ?? "");
  const [customerName, setCustomerName] = useState(story?.customerName ?? "");
  const [position, setPosition] = useState(story?.position ?? 0);
  const [isActive, setIsActive] = useState(story?.isActive ?? true);
  const [productLinks, setProductLinks] = useState<StoryProductLink[]>(
    story?.productLinks ?? []
  );
  const [searchQ, setSearchQ] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredProducts = products.filter(
    (p) =>
      !productLinks.find((l) => l.productId === p.id) &&
      (searchQ === "" ||
        p.name.toLowerCase().includes(searchQ.toLowerCase()))
  );

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const ext = file.name.split(".").pop();
      const fd = new FormData();
      fd.set("file", file);
      fd.set("path", `stories/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? `HTTP ${res.status}`);
      setImageUrl(json.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload thất bại");
    } finally {
      setUploading(false);
    }
  }

  function addProduct(product: Product) {
    if (productLinks.length >= 3) return;
    setProductLinks((prev) => [
      ...prev,
      {
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        price: product.price,
      },
    ]);
    setSearchQ("");
  }

  function removeProduct(productId: string) {
    setProductLinks((prev) => prev.filter((l) => l.productId !== productId));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set("imageUrl", imageUrl);
    fd.set("customerName", customerName);
    fd.set("position", String(position));
    fd.set("isActive", String(isActive));
    fd.set("productLinks", JSON.stringify(productLinks));

    startTransition(async () => {
      const res = story
        ? await updateStory(story.id, fd)
        : await createStory(fd);
      if (res?.error) {
        setError(res.error);
      } else {
        router.push("/admin/stories");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Ảnh story ── */}
      <div>
        <label className="mb-2 block text-sm font-medium text-ink">
          Ảnh feedback / story <span className="text-red-500">*</span>
        </label>
        <p className="mb-3 text-xs text-muted">
          Tỉ lệ tốt nhất: 9:16 (dọc). Tối thiểu 400×700px.
        </p>

        {imageUrl ? (
          <div className="relative inline-block">
            <div className="relative h-48 w-28 overflow-hidden rounded-xl border border-line">
              <Image
                src={imageUrl}
                alt="Story preview"
                fill
                className="object-cover"
                sizes="112px"
              />
            </div>
            <button
              type="button"
              onClick={() => setImageUrl("")}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <label className="flex h-36 w-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-surface text-muted hover:border-gold hover:text-gold-dark transition-colors">
            {uploading ? (
              <span className="text-[11px]">Đang upload…</span>
            ) : (
              <>
                <Upload size={20} />
                <span className="mt-2 text-[11px]">Chọn ảnh</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        )}
      </div>

      {/* ── Tên khách hàng ── */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">
          Tên khách hàng <span className="text-xs text-muted">(tùy chọn)</span>
        </label>
        <input
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Ví dụ: Minh Anh, @username..."
          className="w-full max-w-sm border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-gold focus:outline-none"
        />
      </div>

      {/* ── Sản phẩm liên kết ── */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">
          Sản phẩm liên kết{" "}
          <span className="text-xs text-muted">(tối đa 3 sản phẩm)</span>
        </label>

        {/* Selected products */}
        {productLinks.length > 0 && (
          <div className="mb-3 space-y-2">
            {productLinks.map((link) => (
              <div
                key={link.productId}
                className="flex items-center gap-3 rounded border border-line bg-surface px-3 py-2"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">{link.productName}</p>
                  <p className="text-xs text-muted">{formatVnd(link.price)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeProduct(link.productId)}
                  className="text-muted hover:text-red-500"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Product search */}
        {productLinks.length < 3 && (
          <div className="relative max-w-sm">
            <div className="flex items-center gap-2 border border-line bg-white px-3 py-2">
              <Search size={14} className="text-muted" />
              <input
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Tìm sản phẩm để thêm..."
                className="flex-1 text-sm text-ink focus:outline-none"
              />
            </div>
            {searchQ && (
              <div className="absolute left-0 right-0 top-full z-20 max-h-48 overflow-y-auto border border-line bg-white shadow-lg">
                {filteredProducts.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-muted">Không tìm thấy</p>
                ) : (
                  filteredProducts.slice(0, 8).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addProduct(p)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-cream"
                    >
                      <Plus size={12} className="shrink-0 text-gold-dark" />
                      <div>
                        <p className="text-sm text-ink">{p.name}</p>
                        <p className="text-xs text-muted">{formatVnd(p.price)}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Vị trí & Trạng thái ── */}
      <div className="flex flex-wrap gap-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Vị trí hiển thị
          </label>
          <input
            type="number"
            min={0}
            value={position}
            onChange={(e) => setPosition(parseInt(e.target.value, 10))}
            className="w-24 border border-line bg-white px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Trạng thái
          </label>
          <button
            type="button"
            onClick={() => setIsActive((v) => !v)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-emerald-100 text-emerald-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-gray-400"}`}
            />
            {isActive ? "Đang hiển thị" : "Đã ẩn"}
          </button>
        </div>
      </div>

      {/* ── Submit ── */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending || !imageUrl}
          className="bg-ink px-6 py-2.5 text-[12px] tracking-label uppercase text-paper hover:bg-ink/85 disabled:opacity-50"
        >
          {isPending ? "Đang lưu…" : story ? "Cập nhật" : "Tạo story"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/stories")}
          className="border border-line px-6 py-2.5 text-[12px] tracking-label uppercase text-ink hover:bg-cream"
        >
          Hủy
        </button>
      </div>
    </form>
  );
}
