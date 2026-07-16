"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { Pencil, ImageIcon, GripVertical, ChevronsUp } from "lucide-react";
import { Product } from "@/lib/types";
import { formatVnd } from "@/lib/utils";
import { DeleteProductButton } from "./delete-product-button";
import { VariantImagesModal } from "./variant-images-modal";
import { reorderProducts } from "@/lib/products-actions";

interface Props {
  products: Product[];
  allSortedIds: string[];
}

export function ProductsTable({ products, allSortedIds }: Props) {
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [localProducts, setLocalProducts] = useState<Product[]>(products);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dropAbove, setDropAbove] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Sync local state when server revalidates
  useEffect(() => {
    if (!isPending) setLocalProducts(products);
  }, [products, isPending]);

  function commitReorder(newPageOrder: Product[], newFullOrder: string[]) {
    setLocalProducts(newPageOrder);
    startTransition(async () => {
      await reorderProducts(newFullOrder);
    });
  }

  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDropAbove(e.clientY < rect.top + rect.height / 2);
    setDragOverId(id);
  }

  function handleDragEnd() {
    setDraggedId(null);
    setDragOverId(null);
  }

  function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) { handleDragEnd(); return; }

    const pageIds = localProducts.map((p) => p.id);
    const fromIdx = pageIds.indexOf(draggedId);
    if (fromIdx === -1) { handleDragEnd(); return; }

    // New page order after drag
    const newPageIds = [...pageIds];
    newPageIds.splice(fromIdx, 1);
    const targetIdxInNew = newPageIds.indexOf(targetId);
    newPageIds.splice(dropAbove ? targetIdxInNew : targetIdxInNew + 1, 0, draggedId);

    // Rebuild full sorted order — keep non-page items in place
    const pagePositionsInFull = pageIds
      .map((id) => allSortedIds.indexOf(id))
      .sort((a, b) => a - b);
    const newFullOrder = [...allSortedIds];
    newPageIds.forEach((id, i) => { newFullOrder[pagePositionsInFull[i]] = id; });

    handleDragEnd();
    commitReorder(
      newPageIds.map((id) => localProducts.find((p) => p.id === id)!),
      newFullOrder
    );
  }

  function handleMoveToTop(id: string) {
    const newFullOrder = [id, ...allSortedIds.filter((sid) => sid !== id)];

    // Optimistic: move to front of visible page
    const idx = localProducts.findIndex((p) => p.id === id);
    const newPageOrder = [...localProducts];
    if (idx > 0) {
      const [item] = newPageOrder.splice(idx, 1);
      newPageOrder.unshift(item);
    }

    commitReorder(newPageOrder, newFullOrder);
  }

  return (
    <>
      <div className="overflow-x-auto border border-line bg-surface">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-label text-muted">
              <th className="w-10 px-2 py-3" />
              <th className="px-4 py-3">Sản phẩm</th>
              <th className="px-4 py-3">Danh mục</th>
              <th className="px-4 py-3">Giá</th>
              <th className="px-4 py-3">Tồn kho</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {localProducts.map((p) => {
              const globalIdx = allSortedIds.indexOf(p.id);
              const isDragging = draggedId === p.id;
              const isTarget = dragOverId === p.id && !isDragging;

              return (
                <tr
                  key={p.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, p.id)}
                  onDragOver={(e) => handleDragOver(e, p.id)}
                  onDragLeave={() => setDragOverId(null)}
                  onDrop={(e) => handleDrop(e, p.id)}
                  onDragEnd={handleDragEnd}
                  className={[
                    "border-b border-line last:border-0 transition-opacity",
                    isDragging ? "opacity-30" : "",
                    isTarget && dropAbove ? "border-t-[2px] border-t-[#a9843f]" : "",
                    isTarget && !dropAbove ? "border-b-[2px] border-b-[#a9843f]" : "",
                  ].join(" ")}
                >
                  {/* Drag handle */}
                  <td className="w-10 px-2 py-3">
                    <div className="flex flex-col items-center gap-0.5">
                      <GripVertical
                        size={16}
                        className="cursor-grab text-muted/40 hover:text-muted active:cursor-grabbing"
                      />
                      <span className="text-[10px] text-muted/60">{globalIdx + 1}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-ink">{p.name}</td>
                  <td className="px-4 py-3 text-muted">{p.categoryLabel}</td>
                  <td className="px-4 py-3 text-ink">{formatVnd(p.price)}</td>

                  <td className="px-4 py-3">
                    {p.stock === 0 ? (
                      <span className="rounded-full bg-error/15 px-2.5 py-1 text-[11px] font-medium uppercase text-error">
                        Hết hàng
                      </span>
                    ) : p.stock <= 5 ? (
                      <span className="rounded-full bg-gold/15 px-2.5 py-1 text-[11px] font-medium text-gold-dark">
                        Còn {p.stock}
                      </span>
                    ) : (
                      <span className="text-ink">{p.stock}</span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {p.isNew && (
                        <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] uppercase text-paper">
                          Mới
                        </span>
                      )}
                      {p.isBestSeller && (
                        <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] uppercase text-paper">
                          Bán chạy
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {globalIdx !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleMoveToTop(p.id)}
                          disabled={isPending}
                          title="Lên Top 1"
                          className="flex items-center gap-1 px-2 py-1.5 text-xs text-muted hover:text-gold-dark disabled:opacity-40"
                        >
                          <ChevronsUp size={14} />
                          <span className="hidden sm:inline">Top 1</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setModalProduct(p)}
                        title="Ảnh biến thể"
                        className="flex items-center gap-1 px-2 py-1.5 text-xs text-muted hover:text-gold-dark"
                      >
                        <ImageIcon size={14} />
                        <span className="hidden sm:inline">Ảnh biến thể</span>
                      </button>
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="p-1.5 text-muted hover:text-gold-dark"
                        aria-label={`Sửa ${p.name}`}
                      >
                        <Pencil size={16} />
                      </Link>
                      <DeleteProductButton id={p.id} name={p.name} />
                    </div>
                  </td>
                </tr>
              );
            })}
            {localProducts.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted">
                  Chưa có sản phẩm nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isPending && (
        <p className="mt-2 text-center text-xs text-muted">Đang lưu thứ tự…</p>
      )}

      {modalProduct && (
        <VariantImagesModal
          productId={modalProduct.id}
          productName={modalProduct.name}
          colors={modalProduct.colors}
          onClose={() => setModalProduct(null)}
        />
      )}
    </>
  );
}
