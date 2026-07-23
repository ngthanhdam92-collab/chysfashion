import { getAllOrders } from "@/lib/orders";
import { startOfDayVN, dayKeyVN } from "@/lib/date-vn";
import { getAllProducts } from "@/lib/products";
import { getTrafficData } from "@/lib/analytics";
import { getCostEntries } from "@/lib/costs";
import { getCostSettings } from "@/lib/cost-settings";
import { formatVnd } from "@/lib/utils";
import { Order, OrderItem } from "@/lib/types";
import Link from "next/link";
import { TrendingUp, TrendingDown, AlertCircle, Globe, ShoppingCart, Package, CreditCard } from "lucide-react";
import { AnalyticsPeriodPicker } from "@/components/admin/analytics-period-picker";
import { GaRealtimeWidget } from "@/components/admin/ga-realtime-widget";

type Period = "today" | "yesterday" | "7d" | "custom";
type View   = "revenue" | "traffic";

function periodRange(period: Period, fromParam?: string, toParam?: string): { from: Date; to: Date } {
  const now = new Date();
  const todayStart = startOfDayVN(now);

  if (period === "today") {
    return { from: todayStart, to: now };
  }
  if (period === "yesterday") {
    const yStart = new Date(todayStart.getTime() - 86400000);
    return { from: yStart, to: todayStart };
  }
  if (period === "custom" && fromParam && toParam) {
    const from = new Date(fromParam);
    const to   = new Date(toParam);
    to.setHours(23, 59, 59, 999);
    if (!isNaN(from.getTime()) && !isNaN(to.getTime())) return { from, to };
  }
  // default: 7d
  return { from: new Date(now.getTime() - 7 * 86400000), to: now };
}

function periodLabel(period: Period, from?: string, to?: string): string {
  if (period === "today")     return "Hôm nay";
  if (period === "yesterday") return "Hôm qua";
  if (period === "custom" && from && to) return `${formatDate(from)} – ${formatDate(to)}`;
  return "7 ngày qua";
}

function formatDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function dayKey(date: Date): string {
  return dayKeyVN(date);
}

function formatDayLabel(key: string): string {
  const [, m, d] = key.split("-");
  return `${d}/${m}`;
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; view?: string; from?: string; to?: string }>;
}) {
  const { period: rawPeriod = "7d", view: rawView = "revenue", from: fromParam, to: toParam } = await searchParams;
  const period = (["today", "yesterday", "7d", "custom"].includes(rawPeriod) ? rawPeriod : "7d") as Period;
  const view   = (["revenue", "traffic"].includes(rawView) ? rawView : "revenue") as View;

  const range = periodRange(period, fromParam, toParam);

  // ── Tab helpers ────────────────────────────────────────────────────────────
  function tabHref(v: View) {
    const p = new URLSearchParams({ view: v, period });
    if (period === "custom" && fromParam && toParam) { p.set("from", fromParam); p.set("to", toParam); }
    return `/admin/analytics?${p.toString()}`;
  }

  // ── Load data ──────────────────────────────────────────────────────────────
  const [allOrders, products, traffic, costEntries, costSettings] = await Promise.all([
    getAllOrders(),
    getAllProducts(),
    view === "traffic" ? getTrafficData(range) : Promise.resolve(null),
    view === "revenue" ? getCostEntries(dayKeyVN(range.from), dayKeyVN(range.to)) : Promise.resolve([]),
    view === "revenue" ? getCostSettings() : Promise.resolve(null),
  ]);

  // ── Revenue / profit data ──────────────────────────────────────────────────
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

  const activeOrders = allOrders.filter((o) => {
    const d = new Date(o.createdAt);
    return o.status !== "da_huy" && o.status !== "da_hoan" && d >= range.from && d <= range.to;
  });

  function itemCost(item: OrderItem): number {
    const key = `${item.color}__${item.size}`;
    return (variantCostMap[item.productId]?.[key] ?? productCostMap[item.productId] ?? 0) * item.quantity;
  }
  function orderProductRevenue(order: Order): number {
    return order.subtotal - (order.discount ?? 0);
  }
  function orderProfit(order: Order): number {
    return orderProductRevenue(order) - order.items.reduce((s, i) => s + itemCost(i), 0);
  }
  function orderHasCost(order: Order): boolean {
    return order.items.every(
      (i) => (variantCostMap[i.productId]?.[`${i.color}__${i.size}`] ?? productCostMap[i.productId] ?? 0) > 0
    );
  }

  const productRevenue  = activeOrders.reduce((s, o) => s + orderProductRevenue(o), 0);
  const totalShipping   = activeOrders.reduce((s, o) => s + (o.shipping ?? 0), 0);
  const totalDiscount   = activeOrders.reduce((s, o) => s + (o.discount ?? 0), 0);
  const totalReceived   = activeOrders.reduce((s, o) => s + o.total, 0);
  const totalCOGS       = activeOrders.reduce((s, o) => s + o.items.reduce((si, i) => si + itemCost(i), 0), 0);
  const totalProfit     = productRevenue - totalCOGS;
  const margin          = productRevenue > 0 ? Math.round((totalProfit / productRevenue) * 100) : 0;
  const costDataAvailable = totalCOGS > 0;
  const avgOrderValue   = activeOrders.length > 0 ? Math.round(productRevenue / activeOrders.length) : 0;

  // ── External costs ─────────────────────────────────────────────────────────
  // Ad costs: daily entries summed over the period
  const totalAdCost = costEntries
    .filter((e) => e.category.startsWith("ad_"))
    .reduce((s, e) => s + e.amount, 0);
  // Operational costs: settings × total order count
  const opPerOrder = costSettings
    ? costSettings.packagingPerOrder + costSettings.printingPerOrder
    : 0;
  const totalOpCost = opPerOrder * activeOrders.length;
  // Return costs: estimated from return rate setting
  const estimatedReturns = costSettings
    ? Math.round((activeOrders.length * costSettings.returnRatePct) / 100)
    : 0;
  const totalRetCost = costSettings
    ? estimatedReturns * costSettings.returnCostPerUnit
    : 0;
  const totalIncidentalCost = costEntries
    .filter((e) => e.category === "incidental")
    .reduce((s, e) => s + e.amount, 0);
  const totalShipCost = costSettings
    ? costSettings.shippingCostPerOrder * activeOrders.length
    : 0;
  const totalExternalCost = totalAdCost + totalOpCost + totalRetCost + totalIncidentalCost + totalShipCost;
  const netProfit = totalProfit - totalExternalCost;
  const hasExternalCosts = totalExternalCost > 0;

  const productRevMap: Record<string, { revenue: number; profit: number; qty: number }> = {};
  for (const order of activeOrders) {
    for (const item of order.items) {
      if (!productRevMap[item.productId])
        productRevMap[item.productId] = { revenue: 0, profit: 0, qty: 0 };
      const lineRev = item.price * item.quantity;
      productRevMap[item.productId].revenue += lineRev;
      productRevMap[item.productId].profit  += lineRev - itemCost(item);
      productRevMap[item.productId].qty     += item.quantity;
    }
  }
  const topProducts = Object.entries(productRevMap).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 8);

  const chartDays = Math.min(62, Math.max(1, Math.ceil((range.to.getTime() - range.from.getTime()) / 86400000) + 1));
  const dailyRevData: { key: string; productRev: number; shipping: number; profit: number }[] = [];
  for (let i = 0; i < chartDays; i++) {
    const d = new Date(range.from.getTime() + i * 86400000);
    dailyRevData.push({ key: dayKey(d), productRev: 0, shipping: 0, profit: 0 });
  }
  for (const order of activeOrders) {
    const k = dayKey(new Date(order.createdAt));
    const entry = dailyRevData.find((d) => d.key === k);
    if (entry) {
      entry.productRev += orderProductRevenue(order);
      entry.shipping   += order.shipping ?? 0;
      entry.profit     += orderProfit(order);
    }
  }
  const maxRevBar = Math.max(...dailyRevData.map((d) => d.productRev + d.shipping), 1);
  const recentOrders = activeOrders.slice(0, 10);

  // ── Traffic conversion funnel ──────────────────────────────────────────────
  const convRate = traffic && traffic.uniqueSessions > 0
    ? ((activeOrders.length / traffic.uniqueSessions) * 100).toFixed(1)
    : null;
  const cartRate = traffic && traffic.uniqueSessions > 0
    ? ((traffic.cartSessions / traffic.uniqueSessions) * 100).toFixed(1)
    : null;
  const maxTrafficBar = traffic
    ? Math.max(...traffic.dailyStats.map((d) => d.sessions), 1)
    : 1;

  // ── Shared header ──────────────────────────────────────────────────────────
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl text-ink">Phân tích</h1>
          <p className="mt-0.5 text-sm text-muted">
            {periodLabel(period, fromParam, toParam)}
          </p>
        </div>
        <AnalyticsPeriodPicker
          currentPeriod={period}
          currentFrom={fromParam}
          currentTo={toParam}
          view={view}
        />
      </div>

      {/* View tabs */}
      <div className="mt-4 flex gap-0 overflow-x-auto border-b border-line">
        {([["revenue", "Doanh thu & Lợi nhuận"], ["traffic", "Truy cập & Chuyển đổi"]] as [View, string][]).map(([v, label]) => (
          <Link key={v} href={tabHref(v)}
            className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              view === v ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"
            }`}>
            {label}
          </Link>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB: DOANH THU & LỢI NHUẬN
      ════════════════════════════════════════════════════════════════════════ */}
      {view === "revenue" && (
        <div className="mt-6">
          {missingCostCount > 0 && (
            <div className="mb-5 flex items-start gap-2.5 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <p>
                <span className="font-semibold">{missingCostCount} sản phẩm</span> chưa nhập giá vốn.{" "}
                <Link href="/admin/products" className="underline hover:no-underline">Cập nhật giá vốn</Link>
              </p>
            </div>
          )}

          {/* Revenue breakdown */}
          <p className="text-[11px] font-semibold uppercase tracking-label text-muted">Doanh thu</p>
          <div className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Doanh thu sản phẩm" value={formatVnd(productRevenue)} sub={`${activeOrders.length} đơn · giá bán – giảm giá`} color="blue" />
            <StatCard label="Phí vận chuyển thu" value={formatVnd(totalShipping)} sub="Khách trả ship" color="purple" />
            <StatCard label="Giảm giá / voucher"  value={formatVnd(totalDiscount)} sub="Đã khấu trừ" color="amber" />
            <StatCard label="Tổng tiền thu về"    value={formatVnd(totalReceived)} sub="SP + ship – giảm giá" color="slate" />
          </div>

          {/* Profit breakdown */}
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-label text-muted">Lợi nhuận (tính trên doanh thu sản phẩm)</p>
          <div className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Lợi nhuận gộp" value={costDataAvailable ? formatVnd(totalProfit) : "Chưa có dữ liệu"}
              sub={costDataAvailable ? `Biên ${margin}%` : "Nhập giá vốn để xem"}
              color={totalProfit >= 0 ? "green" : "red"}
              icon={costDataAvailable ? (totalProfit >= 0 ? TrendingUp : TrendingDown) : undefined} />
            <StatCard label="Giá vốn (COGS)" value={costDataAvailable ? formatVnd(totalCOGS) : "—"} sub="Tổng chi phí hàng bán" color="amber" />
            <StatCard label="Giá trị đơn TB" value={activeOrders.length > 0 ? formatVnd(avgOrderValue) : "—"} sub="Doanh thu SP / đơn" color="blue" />
            <div className="border border-line bg-surface p-5">
              <p className="text-[11px] uppercase tracking-label text-muted">Biên lợi nhuận</p>
              <p className={`mt-1.5 text-2xl font-bold ${costDataAvailable ? (margin >= 0 ? "text-emerald-600" : "text-red-600") : "text-muted"}`}>
                {costDataAvailable ? `${margin}%` : "—"}
              </p>
              {costDataAvailable && (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line">
                  <div className={`h-full rounded-full ${margin >= 0 ? "bg-emerald-500" : "bg-red-500"}`}
                    style={{ width: `${Math.min(100, Math.max(0, margin))}%` }} />
                </div>
              )}
            </div>
          </div>

          {/* Net profit after external costs */}
          {costDataAvailable && (
            <div className="mt-5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-label text-muted">
                  Lợi nhuận ròng {hasExternalCosts ? "(sau chi phí ngoài)" : "— chưa có chi phí quảng cáo / vận hành"}
                </p>
                <Link href="/admin/chi-phi" className="text-xs text-gold-dark hover:underline">
                  Nhập chi phí →
                </Link>
              </div>
              {hasExternalCosts ? (
                <div className="mt-2 rounded border border-line bg-surface p-5">
                  <div className="flex flex-wrap items-start gap-6">
                    <div>
                      <p className="text-xs text-muted">Lợi nhuận ròng</p>
                      <p className={`mt-0.5 text-2xl font-bold ${netProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {formatVnd(netProfit)}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        = {formatVnd(totalProfit)} (gộp) − {formatVnd(totalExternalCost)} (chi phí ngoài)
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1 text-sm">
                      {totalAdCost > 0 && (
                        <div>
                          <p className="text-xs text-muted">Quảng cáo</p>
                          <p className="font-medium text-blue-600">−{formatVnd(totalAdCost)}</p>
                        </div>
                      )}
                      {totalOpCost > 0 && (
                        <div>
                          <p className="text-xs text-muted">Vận hành</p>
                          <p className="font-medium text-amber-600">−{formatVnd(totalOpCost)}</p>
                        </div>
                      )}
                      {totalShipCost > 0 && (
                        <div>
                          <p className="text-xs text-muted">Giao hàng</p>
                          <p className="font-medium text-orange-500">−{formatVnd(totalShipCost)}</p>
                        </div>
                      )}
                      {totalRetCost > 0 && (
                        <div>
                          <p className="text-xs text-muted">Hoàn hàng</p>
                          <p className="font-medium text-red-600">−{formatVnd(totalRetCost)}</p>
                        </div>
                      )}
                      {totalIncidentalCost > 0 && (
                        <div>
                          <p className="text-xs text-muted">Chi phí phát sinh</p>
                          <p className="font-medium text-violet-600">−{formatVnd(totalIncidentalCost)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-3 rounded border border-dashed border-line px-4 py-3 text-sm text-muted">
                  <span>Chưa nhập chi phí cho kỳ này.</span>
                  <Link href="/admin/chi-phi" className="text-gold-dark hover:underline">Nhập ngay</Link>
                </div>
              )}
            </div>
          )}

          {/* Revenue chart */}
          {chartDays <= 62 && (
            <div className="mt-8">
              <h2 className="font-serif text-lg text-ink">Biểu đồ doanh thu theo ngày</h2>
              <div className="mt-3 border border-line bg-surface p-5">
                <div className="flex items-end gap-0.5" style={{ height: 160 }}>
                  {dailyRevData.map((day) => {
                    const revH  = Math.round((day.productRev / maxRevBar) * 140);
                    const shipH = Math.round((day.shipping / maxRevBar) * 140);
                    const profH = costDataAvailable ? Math.max(0, Math.round((day.profit / maxRevBar) * 140)) : 0;
                    const total = day.productRev + day.shipping;
                    return (
                      <div key={day.key} className="group relative flex flex-1 flex-col items-center justify-end" style={{ height: 160 }}>
                        {total > 0 && (
                          <div className="pointer-events-none absolute bottom-full mb-2 hidden min-w-[130px] rounded bg-ink px-2.5 py-2 text-[11px] text-paper shadow group-hover:block z-10 left-1/2 -translate-x-1/2">
                            <p className="font-semibold">{formatDayLabel(day.key)}</p>
                            <p className="mt-0.5 text-blue-300">SP: {formatVnd(day.productRev)}</p>
                            <p className="text-purple-300">Ship: {formatVnd(day.shipping)}</p>
                            {costDataAvailable && <p className="text-emerald-300">LN: {formatVnd(day.profit)}</p>}
                          </div>
                        )}
                        <div className="flex w-full flex-col justify-end" style={{ height: 140 }}>
                          {costDataAvailable && profH > 0 && <div className="w-full bg-emerald-400 opacity-70" style={{ height: profH }} />}
                          {revH > 0 && <div className="w-full bg-blue-400" style={{ height: Math.max(0, revH - profH) }} />}
                          {shipH > 0 && <div className="w-full bg-purple-300" style={{ height: shipH }} />}
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

          {/* Tables */}
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div>
              <h2 className="font-serif text-lg text-ink">Sản phẩm bán chạy</h2>
              <div className="mt-3 border border-line bg-surface">
                {topProducts.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-muted">Chưa có dữ liệu</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[440px] text-sm">
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
                            <td className="px-4 py-3 text-ink max-w-[160px] truncate">{productNameMap[pid] ?? pid}</td>
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
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-lg text-ink">Đơn hàng gần đây</h2>
                <Link href="/admin/orders" className="text-xs text-gold-dark hover:underline">Xem tất cả</Link>
              </div>
              <div className="mt-3 border border-line bg-surface">
                {recentOrders.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-muted">Chưa có đơn hàng</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[380px] text-sm">
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
                                <Link href={`/admin/orders/${order.id}`} className="font-medium text-ink hover:text-gold-dark">{order.orderCode}</Link>
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
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB: TRUY CẬP & CHUYỂN ĐỔI
      ════════════════════════════════════════════════════════════════════════ */}
      {view === "traffic" && traffic && (
        <div className="mt-6">
          <GaRealtimeWidget />

          {traffic.uniqueSessions === 0 && (
            <div className="mb-5 flex items-start gap-2.5 rounded border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <p>Chưa có dữ liệu truy cập trong kỳ này. Dữ liệu sẽ xuất hiện sau khi khách hàng ghé thăm website.</p>
            </div>
          )}

          {/* Traffic stats */}
          <p className="text-[11px] font-semibold uppercase tracking-label text-muted">Lượng truy cập</p>
          <div className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Lượt xem trang" value={traffic.totalPageViews.toLocaleString("vi-VN")} sub="Page views" color="blue" icon={Globe} />
            <StatCard label="Xem sản phẩm" value={traffic.productViewSessions.toLocaleString("vi-VN")} sub="Phiên vào trang SP" color="amber" icon={Package} />
            <StatCard label="Thêm vào giỏ" value={traffic.cartSessions.toLocaleString("vi-VN")} sub="Phiên bấm add to cart" color="green" icon={ShoppingCart} />
            <StatCard label="Đến thanh toán" value={traffic.checkoutSessions.toLocaleString("vi-VN")} sub="Phiên vào /thanh-toan" color="slate" icon={CreditCard} />
          </div>

          {/* Conversion funnel */}
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-label text-muted">Phễu chuyển đổi</p>
          <div className="mt-2 border border-line bg-surface p-5">
            {traffic.uniqueSessions === 0 ? (
              <p className="py-4 text-center text-sm text-muted">Chưa có dữ liệu</p>
            ) : (
              <div className="space-y-3">
                {[
                  { label: "Phiên truy cập", value: traffic.uniqueSessions, pct: 100, color: "bg-blue-500" },
                  { label: "Xem sản phẩm", value: traffic.productViewSessions, pct: traffic.uniqueSessions > 0 ? Math.round((traffic.productViewSessions / traffic.uniqueSessions) * 100) : 0, color: "bg-indigo-500" },
                  { label: "Thêm vào giỏ", value: traffic.cartSessions, pct: traffic.uniqueSessions > 0 ? Math.round((traffic.cartSessions / traffic.uniqueSessions) * 100) : 0, color: "bg-amber-500" },
                  { label: "Đến trang TT", value: traffic.checkoutSessions, pct: traffic.uniqueSessions > 0 ? Math.round((traffic.checkoutSessions / traffic.uniqueSessions) * 100) : 0, color: "bg-orange-500" },
                  { label: "Đặt hàng", value: activeOrders.length, pct: traffic.uniqueSessions > 0 ? Math.round((activeOrders.length / traffic.uniqueSessions) * 100) : 0, color: "bg-emerald-500" },
                ].map((step) => (
                  <div key={step.label} className="flex items-center gap-2">
                    <span className="w-28 shrink-0 text-xs text-ink sm:w-36 sm:text-sm">{step.label}</span>
                    <div className="flex-1">
                      <div className="h-6 overflow-hidden rounded-sm bg-line sm:h-7">
                        <div className={`h-full ${step.color} flex items-center px-2 text-[11px] font-medium text-white`}
                          style={{ width: `${Math.max(step.pct, step.value > 0 ? 4 : 0)}%` }}>
                          {step.pct > 10 ? `${step.pct}%` : ""}
                        </div>
                      </div>
                    </div>
                    <span className="w-12 shrink-0 text-right text-xs font-medium text-ink sm:w-16 sm:text-sm">{step.value.toLocaleString("vi-VN")}</span>
                    <span className="hidden w-10 shrink-0 text-right text-xs text-muted sm:block">{step.pct}%</span>
                  </div>
                ))}
              </div>
            )}
            {convRate !== null && (
              <p className="mt-4 border-t border-line pt-3 text-sm text-muted">
                Tỉ lệ chuyển đổi tổng:{" "}
                <span className="font-semibold text-ink">{convRate}%</span>
                {cartRate !== null && (
                  <> &nbsp;·&nbsp; Tỉ lệ thêm vào giỏ: <span className="font-semibold text-ink">{cartRate}%</span></>
                )}
              </p>
            )}
          </div>

          {/* Daily traffic chart */}
          {traffic.dailyStats.length > 0 && (
            <div className="mt-8">
              <h2 className="font-serif text-lg text-ink">Lượt truy cập theo ngày</h2>
              <div className="mt-3 border border-line bg-surface p-5">
                <div className="flex items-end gap-0.5" style={{ height: 140 }}>
                  {traffic.dailyStats.map((day) => {
                    const h = Math.round((day.sessions / maxTrafficBar) * 120);
                    return (
                      <div key={day.date} className="group relative flex flex-1 flex-col items-center justify-end" style={{ height: 140 }}>
                        {day.sessions > 0 && (
                          <div className="pointer-events-none absolute bottom-full mb-2 hidden rounded bg-ink px-2.5 py-1.5 text-[11px] text-paper shadow group-hover:block z-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
                            <p>{formatDayLabel(day.date)}</p>
                            <p className="text-purple-300">{day.sessions} phiên</p>
                            <p className="text-blue-300">{day.pageViews} lượt xem</p>
                          </div>
                        )}
                        <div className="w-full rounded-t-sm bg-purple-400" style={{ height: Math.max(h, day.sessions > 0 ? 2 : 0) }} />
                        <span className="mt-1 text-[9px] text-muted">{formatDayLabel(day.date)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-muted">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-purple-400"/>Phiên truy cập</span>
                </div>
              </div>
            </div>
          )}

          {/* Sources + Campaigns + Top pages */}
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Traffic sources */}
            <div>
              <h2 className="font-serif text-lg text-ink">Nguồn truy cập</h2>
              <p className="mt-0.5 text-xs text-muted">Phát hiện tự động qua UTM hoặc referrer</p>
              <div className="mt-3 border border-line bg-surface">
                {traffic.sourceBreakdown.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-muted">Chưa có dữ liệu</p>
                ) : (
                  <div className="divide-y divide-line">
                    {traffic.sourceBreakdown.map((src) => (
                      <div key={src.source} className="flex items-center gap-3 px-4 py-3">
                        <span className="flex-1 text-sm text-ink">{src.source}</span>
                        <div className="w-32">
                          <div className="h-1.5 overflow-hidden rounded-full bg-line">
                            <div className="h-full rounded-full bg-purple-500" style={{ width: `${src.pct}%` }} />
                          </div>
                        </div>
                        <span className="w-12 text-right text-sm font-medium text-ink">{src.sessions}</span>
                        <span className="w-8 text-right text-xs text-muted">{src.pct}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* UTM Campaigns */}
            <div>
              <h2 className="font-serif text-lg text-ink">Chiến dịch quảng cáo (UTM)</h2>
              <p className="mt-0.5 text-xs text-muted">Chỉ hiển thị khi link có tham số utm_campaign</p>
              <div className="mt-3 border border-line bg-surface">
                {traffic.campaignBreakdown.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-muted">Chưa có dữ liệu chiến dịch</p>
                    <p className="mt-2 text-xs text-muted">Thêm <code className="rounded bg-line px-1 py-0.5">?utm_source=zalo&utm_campaign=ten-chien-dich</code> vào link quảng cáo</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[320px] text-sm">
                      <thead>
                        <tr className="border-b border-line text-left text-[11px] uppercase tracking-label text-muted">
                          <th className="px-4 py-3">Chiến dịch</th>
                          <th className="px-4 py-3">Kênh</th>
                          <th className="px-4 py-3 text-right">Phiên</th>
                          <th className="px-4 py-3 text-right">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {traffic.campaignBreakdown.map((c) => (
                          <tr key={c.campaign} className="border-b border-line last:border-0">
                            <td className="px-4 py-3 font-medium text-ink max-w-[140px] truncate">{c.campaign}</td>
                            <td className="px-4 py-3">
                              <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">{c.source}</span>
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-ink">{c.sessions}</td>
                            <td className="px-4 py-3 text-right text-xs text-muted">{c.pct}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Top pages */}
            <div>
              <h2 className="font-serif text-lg text-ink">Trang xem nhiều nhất</h2>
              <div className="mt-3 border border-line bg-surface">
                {traffic.topPages.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-muted">Chưa có dữ liệu</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[260px] text-sm">
                      <thead>
                        <tr className="border-b border-line text-left text-[11px] uppercase tracking-label text-muted">
                          <th className="px-4 py-3">Trang</th>
                          <th className="px-4 py-3 text-right">Lượt xem</th>
                        </tr>
                      </thead>
                      <tbody>
                        {traffic.topPages.map((page) => (
                          <tr key={page.path} className="border-b border-line last:border-0">
                            <td className="px-4 py-3 font-mono text-xs text-muted max-w-[200px] truncate">{page.path}</td>
                            <td className="px-4 py-3 text-right font-medium text-ink">{page.views.toLocaleString("vi-VN")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shared stat card ─────────────────────────────────────────────────────────
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
      <div className="flex items-start justify-between">
        <p className="text-[11px] uppercase tracking-label text-muted">{label}</p>
        {Icon && <span className={`inline-flex items-center rounded-full p-1.5 ${iconMap[color]}`}><Icon size={13} /></span>}
      </div>
      <p className="mt-1.5 text-xl font-bold text-ink">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
}
