import { getAllOrders } from "@/lib/orders";
import { getAllProducts } from "@/lib/products";
import { formatVnd } from "@/lib/utils";
import { Order, OrderItem } from "@/lib/types";
import Link from "next/link";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

type Period = "7d" | "30d" | "all";

const PERIOD_LABELS: Record<Period, string> = {
  "7d": "7 ngày qua",
  "30d": "30 ngày qua",
  "all": "Tất cả",
};

function periodCutoff(period: Period): Date {
  if (period === "all") return new Date(0);
  return new Date(Date.now() - (period === "7d" ? 7 : 30) * 86400000);
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDayLabel(key: string): string {
  const [, m, d] = key.split("-");
  return `${d}/${m}`;
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: rawPeriod = "30d" } = await searchParams;
  const period = (["7d", "30d", "all"].includes(rawPeriod) ? rawPeriod : "30d") as Period;

  const [allOrders, products] = await Promise.all([getAllOrders(), getAllProducts()]);

  // Cost price lookup: productId → { "color__size": costPrice }
  const variantCostMap: Record<string, Record<string, number>> = {};
  const productCostMap: Record<string, number> = {};
  const productNameMap: Record<string, string> = {};
  let missingCostCount = 0;

  for (const p of products) {
    productNameMap[p.id] = p.name;
    const pCost = p.costPrice ?? 0;
    productCostMap[p.id] = pCost;
    variantCostMap[p.id] = {};
    for (const v of p.variants) {
      variantCostMap[p.id][`${v.color}__${v.size}`] = v.costPrice ?? pCost;
    }
    if (!p.costPrice && !p.variants.some((v) => v.costPrice)) missingCostCount++;
  }

  const cutoff = periodCutoff(period);
  const activeOrders = allOrders.filter(
    (o) => o.status !== "da_huy" && new Date(o.createdAt) >= cutoff
  );

  // ── Helpers ────────────────────────────────────────────────────────────────
  function itemCost(item: OrderItem): number {
    const key = `${item.color}__${item.size}`;
    return (variantCostMap[item.productId]?.[key] ?? productCostMap[item.productId] ?? 0) * item.quantity;
  }

  // Product revenue per order = subtotal - discount (excludes shipping)
  function orderProductRevenue(order: Order): number {
    return order.subtotal - (order.discount ?? 0);
  }

  // Profit = product revenue - COGS (shipping is pass-through, not counted)
  function orderProfit(order: Order): number {
    const cogs = order.items.reduce((s, i) => s + itemCost(i), 0);
    return orderProductRevenue(order) - cogs;
  }

  function orderHasCost(order: Order): boolean {
    return order.items.every(
      (i) => (variantCostMap[i.productId]?.[`${i.color}__${i.size}`] ?? productCostMap[i.productId] ?? 0) > 0
    );
  }

  // ── Aggregates ─────────────────────────────────────────────────────────────
  const productRevenue = activeOrders.reduce((s, o) => s + orderProductRevenue(o), 0);
  const totalShipping  = activeOrders.reduce((s, o) => s + (o.shipping ?? 0), 0);
  const totalDiscount  = activeOrders.reduce((s, o) => s + (o.discount ?? 0), 0);
  const totalReceived  = activeOrders.reduce((s, o) => s + o.total, 0); // = productRevenue + shipping
  const totalCOGS      = activeOrders.reduce((s, o) => s + o.items.reduce((si, i) => si + itemCost(i), 0), 0);
  const totalProfit    = productRevenue - totalCOGS;
  const margin         = productRevenue > 0 ? Math.round((totalProfit / productRevenue) * 100) : 0;
  const costDataAvailable = totalCOGS > 0;
  const avgOrderValue  = activeOrders.length > 0 ? Math.round(productRevenue / activeOrders.length) : 0;

  // ── Top products ───────────────────────────────────────────────────────────
  const productRevMap: Record<string, { revenue: number; profit: number; qty: number }> = {};
  for (const order of activeOrders) {
    for (const item of order.items) {
      if (!productRevMap[item.productId])
        productRevMap[item.productId] = { revenue: 0, profit: 0, qty: 0 };
      const lineRev = item.price * item.quantity;
      const lineCost = itemCost(item);
      productRevMap[item.productId].revenue += lineRev;
      productRevMap[item.productId].profit  += lineRev - lineCost;
      productRevMap[item.productId].qty     += item.quantity;
    }
  }
  const topProducts = Object.entries(productRevMap)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 8);

  // ── Daily chart ────────────────────────────────────────────────────────────
  const chartDays = period === "7d" ? 7 : 30;
  const dailyData: { key: string; productRev: number; shipping: number; profit: number }[] = [];
  for (let i = chartDays - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    dailyData.push({ key: dayKey(d), productRev: 0, shipping: 0, profit: 0 });
  }
  if (period !== "all") {
    for (const order of activeOrders) {
      const k = dayKey(new Date(order.createdAt));
      const entry = dailyData.find((d) => d.key === k);
      if (entry) {
        entry.productRev += orderProductRevenue(order);
        entry.shipping   += order.shipping ?? 0;
        entry.profit     += orderProfit(order);
      }
    }
  }
  const maxBar = Math.max(...dailyData.map((d) => d.productRev + d.shipping), 1);

  const recentOrders = activeOrders.slice(0, 10);

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-ink">Phân tích lợi nhuận</h1>
          <p className="mt-0.5 text-sm text-muted">Doanh thu sản phẩm, phí vận chuyển và lợi nhuận ước tính.</p>
        </div>
        <div className="flex gap-1 border border-line">
          {(["7d", "30d", "all"] as Period[]).map((p) => (
            <Link
              key={p}
              href={`/admin/analytics?period=${p}`}
              className={`px-4 py-2 text-xs tracking-wide transition-colors ${
                period === p ? "bg-ink text-paper" : "text-muted hover:text-ink"
              }`}
            >
              {PERIOD_LABELS[p]}
            </Link>
          ))}
        </div>
      </div>

      {missingCostCount > 0 && (
        <div className="mt-4 flex items-start gap-2.5 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p>
            <span className="font-semibold">{missingCostCount} sản phẩm</span> chưa nhập giá vốn —
            lợi nhuận sẽ không chính xác.{" "}
            <Link href="/admin/products" className="underline hover:no-underline">Cập nhật giá vốn</Link>
          </p>
        </div>
      )}

      {/* ── Revenue breakdown ── */}
      <div className="mt-6">
        <p className="text-[11px] font-semibold uppercase tracking-label text-muted">Doanh thu</p>
        <div className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Doanh thu sản phẩm" value={formatVnd(productRevenue)}
            sub={`${activeOrders.length} đơn · giá bán – giảm giá`} color="blue" />
          <StatCard label="Phí vận chuyển thu" value={formatVnd(totalShipping)}
            sub="Khách trả ship" color="purple" />
          <StatCard label="Giảm giá / voucher" value={formatVnd(totalDiscount)}
            sub="Đã khấu trừ" color="amber" />
          <StatCard label="Tổng tiền thu về" value={formatVnd(totalReceived)}
            sub="SP + ship – giảm giá" color="slate" />
        </div>
      </div>

      {/* ── Profit breakdown ── */}
      <div className="mt-5">
        <p className="text-[11px] font-semibold uppercase tracking-label text-muted">Lợi nhuận (tính trên doanh thu sản phẩm)</p>
        <div className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Lợi nhuận gộp" value={costDataAvailable ? formatVnd(totalProfit) : "Chưa có dữ liệu"}
            sub={costDataAvailable ? `Biên ${margin}%` : "Nhập giá vốn để xem"}
            color={totalProfit >= 0 ? "green" : "red"}
            icon={costDataAvailable ? (totalProfit >= 0 ? TrendingUp : TrendingDown) : undefined} />
          <StatCard label="Giá vốn (COGS)" value={costDataAvailable ? formatVnd(totalCOGS) : "—"}
            sub="Tổng chi phí hàng bán" color="amber" />
          <StatCard label="Giá trị đơn TB" value={activeOrders.length > 0 ? formatVnd(avgOrderValue) : "—"}
            sub="Doanh thu SP / đơn" color="blue" />
          <div className="border border-line bg-surface p-5">
            <p className="text-[11px] uppercase tracking-label text-muted">Biên lợi nhuận</p>
            <p className={`mt-1.5 text-2xl font-bold ${costDataAvailable ? (margin >= 0 ? "text-emerald-600" : "text-red-600") : "text-muted"}`}>
              {costDataAvailable ? `${margin}%` : "—"}
            </p>
            {costDataAvailable && (
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line">
                <div
                  className={`h-full rounded-full ${margin >= 0 ? "bg-emerald-500" : "bg-red-500"}`}
                  style={{ width: `${Math.min(100, Math.max(0, margin))}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Chart ── */}
      {period !== "all" && dailyData.length > 0 && (
        <div className="mt-8">
          <h2 className="font-serif text-lg text-ink">Biểu đồ theo ngày</h2>
          <div className="mt-3 border border-line bg-surface p-5">
            <div className="flex items-end gap-0.5" style={{ height: 160 }}>
              {dailyData.map((day) => {
                const revH  = Math.round((day.productRev / maxBar) * 140);
                const shipH = Math.round((day.shipping / maxBar) * 140);
                const profH = costDataAvailable
                  ? Math.max(0, Math.round((day.profit / maxBar) * 140))
                  : 0;
                const total = day.productRev + day.shipping;
                return (
                  <div key={day.key} className="group relative flex flex-1 flex-col items-center justify-end" style={{ height: 160 }}>
                    {/* Tooltip */}
                    {total > 0 && (
                      <div className="pointer-events-none absolute bottom-full mb-2 hidden min-w-[130px] rounded bg-ink px-2.5 py-2 text-[11px] text-paper shadow group-hover:block z-10 left-1/2 -translate-x-1/2">
                        <p className="font-semibold">{formatDayLabel(day.key)}</p>
                        <p className="mt-0.5 text-blue-300">SP: {formatVnd(day.productRev)}</p>
                        <p className="text-purple-300">Ship: {formatVnd(day.shipping)}</p>
                        {costDataAvailable && <p className="text-emerald-300">LN: {formatVnd(day.profit)}</p>}
                      </div>
                    )}
                    <div className="flex w-full flex-col justify-end gap-0" style={{ height: 140 }}>
                      {/* Profit overlay (green, on top of product bar) */}
                      {costDataAvailable && profH > 0 && (
                        <div className="w-full bg-emerald-400 opacity-70" style={{ height: profH }} />
                      )}
                      {/* Product revenue (blue) */}
                      {revH > 0 && (
                        <div className="w-full bg-blue-400" style={{ height: Math.max(0, revH - profH) }} />
                      )}
                      {/* Shipping (purple, bottom) */}
                      {shipH > 0 && (
                        <div className="w-full bg-purple-300" style={{ height: shipH }} />
                      )}
                      {total === 0 && <div className="w-full bg-line" style={{ height: 2 }} />}
                    </div>
                    <span className="mt-1 text-[9px] text-muted">{formatDayLabel(day.key)}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-blue-400"/>Doanh thu SP</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-purple-300"/>Phí vận chuyển</span>
              {costDataAvailable && <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-400 opacity-70"/>Lợi nhuận</span>}
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Top products */}
        <div>
          <h2 className="font-serif text-lg text-ink">Sản phẩm bán chạy</h2>
          <div className="mt-3 border border-line bg-surface">
            {topProducts.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">Chưa có dữ liệu</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] uppercase tracking-label text-muted">
                    <th className="px-4 py-3">Sản phẩm</th>
                    <th className="px-4 py-3 text-right">SL</th>
                    <th className="px-4 py-3 text-right">Doanh thu SP</th>
                    <th className="px-4 py-3 text-right">Lợi nhuận</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map(([pid, data]) => (
                    <tr key={pid} className="border-b border-line last:border-0">
                      <td className="px-4 py-3 text-ink line-clamp-1 max-w-[180px]">{productNameMap[pid] ?? pid}</td>
                      <td className="px-4 py-3 text-right text-muted">{data.qty}</td>
                      <td className="px-4 py-3 text-right font-medium text-ink">{formatVnd(data.revenue)}</td>
                      <td className="px-4 py-3 text-right">
                        {data.profit > 0
                          ? <span className="font-medium text-emerald-600">{formatVnd(data.profit)}</span>
                          : <span className="text-muted">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent orders */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg text-ink">Đơn hàng gần đây</h2>
            <Link href="/admin/orders" className="text-xs text-gold-dark hover:underline">Xem tất cả</Link>
          </div>
          <div className="mt-3 border border-line bg-surface">
            {recentOrders.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">Chưa có đơn hàng</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] uppercase tracking-label text-muted">
                    <th className="px-4 py-3">Mã đơn</th>
                    <th className="px-4 py-3 text-right">DT sản phẩm</th>
                    <th className="px-4 py-3 text-right">Ship</th>
                    <th className="px-4 py-3 text-right">Lợi nhuận</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => {
                    const pRev   = orderProductRevenue(order);
                    const profit = orderProfit(order);
                    const hasCost = orderHasCost(order);
                    return (
                      <tr key={order.id} className="border-b border-line last:border-0">
                        <td className="px-4 py-3">
                          <Link href={`/admin/orders/${order.id}`} className="font-medium text-ink hover:text-gold-dark">
                            {order.orderCode}
                          </Link>
                          <p className="text-[11px] text-muted">{order.fullName}</p>
                        </td>
                        <td className="px-4 py-3 text-right text-ink">{formatVnd(pRev)}</td>
                        <td className="px-4 py-3 text-right text-muted">{formatVnd(order.shipping ?? 0)}</td>
                        <td className="px-4 py-3 text-right">
                          {hasCost
                            ? <span className={`font-medium ${profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatVnd(profit)}</span>
                            : <span className="text-[11px] text-muted">Chưa có GV</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Stat card ───────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, color, icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  color: "blue" | "green" | "red" | "purple" | "amber" | "slate";
  icon?: React.ElementType;
}) {
  const iconMap: Record<string, string> = {
    blue:   "bg-blue-50 text-blue-600",
    green:  "bg-emerald-50 text-emerald-600",
    red:    "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
    amber:  "bg-amber-50 text-amber-600",
    slate:  "bg-slate-50 text-slate-600",
  };
  return (
    <div className="border border-line bg-surface p-5">
      <p className="text-[11px] uppercase tracking-label text-muted">{label}</p>
      <p className="mt-1.5 text-xl font-bold text-ink">{value}</p>
      {sub && (
        <div className="mt-1.5 flex items-center gap-1.5">
          {Icon && (
            <span className={`inline-flex items-center rounded-full p-0.5 ${iconMap[color]}`}>
              <Icon size={11} />
            </span>
          )}
          <p className="text-xs text-muted">{sub}</p>
        </div>
      )}
    </div>
  );
}
