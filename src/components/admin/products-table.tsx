"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, ImageIcon } from "lucide-react";
import { Product } from "@/lib/types";
import { formatVnd } from "@/lib/utils";
import { DeleteProductButton } from "./delete-product-button";
import { VariantImagesModal } from "./variant-images-modal";

interface Props {
  products: Product[];
}

export function ProductsTable({ products }: Props) {
  const [modalProduct, setModalProduct] = useState<Product | null>(null);

  return (
    <>
      <div className="overflow-x-auto border border-line bg-surface">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-label text-muted">
              <th className="px-4 py-3">Sản phẩm</th>
              <th className="px-4 py-3">Danh mục</th>
              <th className="px-4 py-3">Giá</th>
              <th className="px-4 py-3">Tồn kho</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0">
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
                    <button
                      type="button"
                      onClick={() => setModalProduct(p)}
                      className="flex items-center gap-1 px-2 py-1.5 text-xs text-muted hover:text-gold-dark"
                      title="Ảnh biến thể"
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
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  Chưa có sản phẩm nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
