"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Check, X, Ruler, Flame, AlertTriangle } from "lucide-react";
import { Product } from "@/lib/types";
import { formatVnd } from "@/lib/utils";
import { useCart } from "@/context/cart-context";
import { DEFAULT_SIZE_CHART, mergeWithDefault, recommendSize, SizeChartRow } from "@/lib/size-chart";
import { CountdownTimer } from "./countdown-timer";
import type { FlashSaleWithProducts } from "@/lib/flash-sales";

interface Props {
  product: Product;
  selectedColor?: string;
  onColorChange?: (color: string) => void;
  flashSale?: FlashSaleWithProducts;
}

export function ProductPurchasePanel({ product, selectedColor, onColorChange, flashSale }: Props) {
  const router = useRouter();
  const { addItem } = useCart();
  const [color, setColor] = useState(selectedColor ?? product.colors[0]?.name ?? "");
  const [size, setSize] = useState(product.sizes[0] ?? "");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  // Sync color when parent changes it
  const activeColor = selectedColor ?? color;

  // Có phân loại hàng: giá và tồn kho tính theo tổ hợp Màu × Size đang chọn
  const hasVariants = product.variants.length > 0;
  const selectedVariant = hasVariants
    ? product.variants.find((v) => v.color === activeColor && v.size === size)
    : undefined;
  const price =
    selectedVariant && selectedVariant.price > 0 ? selectedVariant.price : product.price;
  const compareAtPrice =
    selectedVariant?.compareAtPrice ?? product.compareAtPrice;
  const flashPrice = flashSale
    ? Math.round(price * (1 - flashSale.discountPercent / 100))
    : null;
  const availableStock = hasVariants ? selectedVariant?.stock ?? 0 : product.stock;
  const outOfStock = availableStock === 0;
  const isVeryLowStock = availableStock > 0 && availableStock <= 3;
  const isLowStock = availableStock > 0 && availableStock <= 10;

  function handleColorSelect(name: string) {
    setColor(name);
    onColorChange?.(name);
  }

  function handleAddToCart() {
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price,
        color: activeColor,
        size,
        image: product.colors.find((c) => c.name === activeColor)?.images?.[0] ?? product.images[0],
      },
      quantity
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleBuyNow() {
    handleAddToCart();
    router.push("/gio-hang");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold leading-snug text-ink">{product.name}</h1>

      {/* Stars */}
      <div className="mt-2 flex items-center gap-2">
        <StarRating rating={product.rating} />
        <span className="text-sm text-muted">({product.reviewCount} đánh giá)</span>
      </div>

      {/* Flash Sale badge + timer */}
      {flashSale && flashPrice !== null && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded border border-red-200 bg-red-50 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Flame size={15} className="text-red-600" fill="#dc2626" />
            <span className="text-[11px] font-black uppercase tracking-wider text-red-600">
              Flash Sale -{flashSale.discountPercent}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted">Kết thúc sau</span>
            <CountdownTimer endTime={flashSale.endTime} size="sm" />
          </div>
        </div>
      )}

      {/* Price */}
      <div className="mt-4">
        {flashPrice !== null ? (
          <>
            <p className="text-sm text-muted line-through">{formatVnd(price)}</p>
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl font-bold text-red-600">{formatVnd(flashPrice)}</span>
              <span className="rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                -{flashSale!.discountPercent}%
              </span>
            </div>
          </>
        ) : (
          <>
            {compareAtPrice && compareAtPrice > price && (
              <p className="text-sm text-muted line-through">{formatVnd(compareAtPrice)}</p>
            )}
            <div className="flex items-center gap-2.5">
              <span className="text-2xl font-bold text-ink">{formatVnd(price)}</span>
              {compareAtPrice && compareAtPrice > price && (
                <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                  -{Math.round((1 - price / compareAtPrice) * 100)}%
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {product.colors.length > 0 && (
        <div className="mt-8">
          <p className="text-[12px] tracking-label uppercase text-ink">
            Màu sắc — <span className="normal-case font-medium text-ink">{activeColor}</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {product.colors.map((c) => {
              const isActive = activeColor === c.name;
              return (
                <button
                  key={c.name}
                  onClick={() => handleColorSelect(c.name)}
                  title={c.name}
                  className={`h-8 w-14 rounded-full border-2 transition-all ${
                    isActive
                      ? "border-gold shadow-sm ring-2 ring-gold/30"
                      : "border-transparent ring-1 ring-line hover:ring-ink"
                  }`}
                  style={{ backgroundColor: c.hex || "#cccccc" }}
                />
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-8">
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] tracking-label uppercase text-ink">
            Kích thước — <span className="normal-case font-medium">{size}</span>
          </p>
          {product.sizes.length > 0 && (
            <button
              type="button"
              onClick={() => setShowSizeGuide(true)}
              className="flex items-center gap-1.5 self-start text-sm text-blue-600 underline underline-offset-2 hover:text-blue-700 sm:self-auto"
            >
              <Ruler size={14} />
              Hướng dẫn chọn size
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {product.sizes.map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`min-w-11 border px-3 py-2 text-sm transition-colors ${
                size === s
                  ? "border-ink bg-ink text-paper"
                  : "border-line text-ink hover:border-ink"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {showSizeGuide && (
        <SizeGuideModal
          sizes={product.sizes}
          sizeChart={product.sizeChart ?? {}}
          onClose={() => setShowSizeGuide(false)}
          onSelectSize={(s) => { setSize(s); setShowSizeGuide(false); }}
        />
      )}

      <div className="mt-8">
        <p className="text-[12px] tracking-label uppercase text-ink">
          Số lượng
        </p>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex w-fit items-center border border-line">
            <button
              aria-label="Giảm số lượng"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="p-3 hover:bg-cream"
            >
              <Minus size={14} />
            </button>
            <span className="w-10 text-center text-sm">{quantity}</span>
            <button
              aria-label="Tăng số lượng"
              onClick={() => setQuantity((q) => Math.min(Math.max(1, availableStock), q + 1))}
              className="p-3 hover:bg-cream"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {isLowStock && (
          <div className={`mt-3 flex items-center gap-2 rounded border px-3 py-2 text-sm ${
            isVeryLowStock
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-amber-200 bg-amber-50 text-amber-700"
          }`}>
            <AlertTriangle size={14} className="shrink-0" />
            <span>
              {isVeryLowStock
                ? `Sắp hết hàng! Chỉ còn ${availableStock} sản phẩm`
                : `Còn ít hàng — chỉ còn ${availableStock} sản phẩm`}
            </span>
          </div>
        )}
      </div>

      {outOfStock ? (
        <div className="mt-9">
          <div className="w-full border border-line bg-cream/60 px-6 py-3.5 text-center text-[12px] tracking-label uppercase text-muted">
            {hasVariants && product.stock > 0
              ? "Phân loại này tạm hết — vui lòng chọn màu/size khác"
              : "Hết hàng — sẽ sớm có lại"}
          </div>
        </div>
      ) : (
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handleAddToCart}
            className="flex flex-1 items-center justify-center gap-2 border border-ink px-6 py-3.5 text-[12px] tracking-label uppercase text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            {added ? (
              <>
                <Check size={16} /> Đã thêm vào giỏ
              </>
            ) : (
              "Thêm vào giỏ hàng"
            )}
          </button>
          <button
            onClick={handleBuyNow}
            className="flex-1 bg-ink px-6 py-3.5 text-[12px] tracking-label uppercase text-paper transition-colors hover:bg-ink/85"
          >
            Mua ngay
          </button>
        </div>
      )}
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = rating >= star;
        const half = !filled && rating >= star - 0.5;
        return (
          <svg key={star} viewBox="0 0 20 20" className="h-4 w-4">
            <defs>
              <linearGradient id={`half-${star}`}>
                <stop offset="50%" stopColor="#FBBF24" />
                <stop offset="50%" stopColor="#E5E7EB" />
              </linearGradient>
            </defs>
            <path
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
              fill={filled ? "#FBBF24" : half ? `url(#half-${star})` : "#E5E7EB"}
            />
          </svg>
        );
      })}
    </div>
  );
}

// ── Size Guide ───────────────────────────────────────────────────────────────

interface SizeGuideModalProps {
  sizes: string[];
  sizeChart: Record<string, Partial<SizeChartRow>>;
  onClose: () => void;
  onSelectSize: (size: string) => void;
}

function SizeGuideModal({ sizes, sizeChart, onClose, onSelectSize }: SizeGuideModalProps) {
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(60);
  const [result, setResult] = useState<string | null>(null);
  const [calculated, setCalculated] = useState(false);

  // Sizes that have chart data (product custom or default fallback)
  const chartSizes = sizes.filter((s) => sizeChart[s] || DEFAULT_SIZE_CHART[s]);

  function calculate() {
    const r = recommendSize(height, weight, sizes, sizeChart);
    setResult(r);
    setCalculated(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} />

      <div className="relative z-10 max-h-[90vh] w-full overflow-y-auto bg-white sm:max-w-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white px-5 py-4">
          <h2 className="text-base font-bold text-ink">Hướng dẫn chọn size</h2>
          <button type="button" onClick={onClose} className="text-muted hover:text-ink">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 px-5 py-5">
          {/* Calculator */}
          <div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs text-muted">Chiều cao</label>
                <div className="flex items-center border border-line">
                  <input
                    type="number" value={height} min={140} max={210}
                    onChange={(e) => { setHeight(Number(e.target.value)); setCalculated(false); }}
                    className="min-w-0 flex-1 px-3 py-2.5 text-sm focus:outline-none"
                  />
                  <span className="shrink-0 border-l border-line px-3 py-2.5 text-xs text-muted">cm</span>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-muted">Cân nặng</label>
                <div className="flex items-center border border-line">
                  <input
                    type="number" value={weight} min={30} max={150}
                    onChange={(e) => { setWeight(Number(e.target.value)); setCalculated(false); }}
                    className="min-w-0 flex-1 px-3 py-2.5 text-sm focus:outline-none"
                  />
                  <span className="shrink-0 border-l border-line px-3 py-2.5 text-xs text-muted">kg</span>
                </div>
              </div>
            </div>

            <button
              type="button" onClick={calculate}
              className="mt-3 bg-ink px-5 py-2.5 text-[11px] tracking-label uppercase text-paper hover:bg-ink/85"
            >
              Tính toán
            </button>

            {calculated && (
              <div className={`mt-3 flex items-center justify-between border px-4 py-3 ${result ? "border-blue-200 bg-blue-50" : "border-line bg-cream"}`}>
                {result ? (
                  <>
                    <p className="text-sm text-ink">
                      Gợi ý size phù hợp:{" "}
                      <span className="text-base font-bold text-blue-600">{result}</span>
                    </p>
                    {sizes.includes(result) ? (
                      <button
                        type="button" onClick={() => onSelectSize(result)}
                        className="shrink-0 bg-ink px-4 py-1.5 text-[11px] tracking-label uppercase text-paper hover:bg-ink/85"
                      >
                        Chọn size này
                      </button>
                    ) : (
                      <span className="shrink-0 text-xs text-muted">Không có size này</span>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted">Không xác định được size phù hợp.</p>
                )}
              </div>
            )}
          </div>

          {/* Size chart table */}
          {chartSizes.length > 0 && (
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-ink">
                Thông số sản phẩm
              </p>
              <p className="mb-3 text-[11px] italic text-muted">
                *Thông số khi trải phẳng, có thể chênh lệch so với số đo cơ thể.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b-2 border-ink bg-cream">
                      <th className="w-36 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-label text-muted">
                        Thông số
                      </th>
                      {chartSizes.map((s) => (
                        <th key={s} className={`px-3 py-2.5 text-center text-[12px] font-bold ${result === s ? "bg-blue-600 text-white" : "text-ink"}`}>
                          {s}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      [
                        { label: "Chiều cao (cm)", key: "height" },
                        { label: "Cân nặng (kg)",  key: "weight" },
                        { label: "Dài thân trước", key: "bodyLength" },
                        { label: "1/2 ngang ngực", key: "chest" },
                        { label: "Dài tay",         key: "sleeveLength" },
                        { label: "Rộng bắp tay",    key: "bicep" },
                        { label: "Rộng cửa tay",    key: "cuff" },
                        { label: "Ngang cổ",         key: "neck" },
                      ] as { label: string; key: string }[]
                    ).map(({ label, key }, rowIdx) => (
                      <tr key={key} className={`border-b border-line ${rowIdx % 2 === 0 ? "" : "bg-cream/50"}`}>
                        <td className="px-3 py-2 text-xs text-muted">{label}</td>
                        {chartSizes.map((s) => {
                          const d = mergeWithDefault(sizeChart, s);
                          const val =
                            key === "height" ? `${d.heightMin}–${d.heightMax}`
                            : key === "weight" ? `${d.weightMin}–${d.weightMax}`
                            : (d as unknown as Record<string, unknown>)[key];
                          return (
                            <td key={s} className={`px-3 py-2 text-center text-sm ${result === s ? "font-semibold text-blue-600" : "text-ink"}`}>
                              {val as string}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="space-y-1 rounded border border-line bg-cream/60 px-4 py-3 text-xs text-muted">
            <p className="font-semibold text-ink">Trường hợp số đo nằm trong khoảng giữa các size:</p>
            <ul className="mt-1 list-inside list-disc space-y-1">
              <li>Với áo thun, hãy ưu tiên theo chiều cao</li>
              <li>Ví dụ: chiều cao theo size L nhưng cân nặng theo size M → chọn L</li>
              <li>97% khách hàng đã chọn đúng size theo cách này</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
