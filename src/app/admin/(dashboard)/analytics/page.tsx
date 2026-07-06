import { getAllOrders } from "@/lib/orders";
import { getAllProducts } from "@/lib/products";
import { formatVnd } from "@/lib/utils";
import { Order, OrderItem } from "@/lib/types";
import Link from "next/link";
import { TrendingUp, TrendingDown, Package, ShoppingBag, BarChart3, AlertCircle } from "lucide-react";

type Period = "7d" | "30d" | "all";

const PERIOD_LABELS: Record<Period, string> = {
  "7d": "7 ngày qua",
  "30d": "30 ngày qua",
  "all": "Tất cả",
};

function periodCutoff(period: Period): Date {
  if (period === "all") return new Date(0);
  const days = period === "7d" ? 7 : 30;
  return new Date(Date.now() - days * 86400000);
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

  // Build cost price lookup: productId → { "color__size": costPrice }
  const variantCostMap: Record<string, Record<string, number>> = {};
  const productCostMap: Record<string, number> = {};
  let missingCostCount = 0;
  const productNameMap: Record<string, string> = {};

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

  // Profit per order item
  function itemCost(item: OrderItem): number {
    const key = `${item.color}__${item.size}`;
    return (variantCostMap[item.productId]?.[key] ?? productCostMap[item.productId] ?? 0) * item.quantity;
  }

  function orderProfit(order: Order): number {
    const cogs = order.items.reduce((s, i) => s + itemCost(i), 0);
    return order.total - cogs;
  }

  function orderHasCost(order: Order): boolean {
    return order.items.every(
      (i) => (variantCostMap[i.productId]?.[`${i.color}__${i.size}`] ?? productCostMap[i.productId] ?? 0) > 0
    );
  }

  const totalRevenue = activeOrders.reduce((s, o) => s + o.total, 0);
  const totalCOGS = activeOrders.reduce((s, o) => s + o.items.reduce((si, i) => si + itemCost(i), 0), 0);
  const totalProfit = totalRevenue - totalCOGS;
  const margin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;
  const costDataAvailable = totalCOGS > 0;
  const avgOrderValue = activeOrders.length > 0 ? Math.round(totalRevenue / activeOrders.length) : 0;

  // Product revenue map for top products
  const productRevMap: Record<string, { revenue: number; profit: number; qty: number }> = {};
  for (const order of activeOrders) {
    for (const item of order.items) {
      if (!productRevMap[item.productId]) {
        productRevMap[item.productId] = { revenue: 0, profit: 0, qty: 0 };
      }
      const lineRevenue = item.price * item.quantity;
      const lineCost = itemCost(item);
      productRevMap[item.productId].revenue += lineRevenue;
      productRevMap[item.productId].profit += lineRevenue - lineCost;
      productRevMap[item.productId].qty += item.quantity;
    }
  }
  const topProducts = Object.entries(productRevMap)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 8);

  // Daily chart data (last N days)
  const chartDays = period === "7d" ? 7 : period === "30d" ? 30 : Math.min(30, activeOrders.length > 0 ? 30 : 0);
  const dailyData: { key: string; revenue: number; profit: number }[] = [];

  if (chartDays > 0) {
    for (let i = chartDays - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      dailyData.push({ key: dayKey(d), revenue: 0, profit: 0 });
    }
    for (const order of activeOrders) {
      const k = dayKey(new Date(order.createdAt));
      const entry = dailyData.find((d) => d.key === k);
      if (entry) {
        entry.revenue += order.total;
        entry.profit += orderProfit(order);
      }
    }
  }

  const maxRevenue = Math.max(...dailyData.map((d) => d.revenue), 1);

  // Recent orders with profit
  const recentOrders = activeOrders.slice(0, 10);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-ink">Phân tích lợi nhuận</h1>
          <p className="mt-0.5 text-sm text-muted">Doanh thu và lợi nhuận ước tính theo giá vốn đã nhập.</p>
        </div>

        {/* Period filter */}
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

      {/* Missing cost price warning */}
      {missingCostCount > 0 && (
        <div className="mt-4 flex items-start gap-2.5 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p>
            <span className="font-semibold">{missingCostCount} sản phẩm</span> chưa nhập giá vốn — lợi nhuận của các sản phẩm này sẽ không chính xác.{" "}
            <Link href="/admin/products" className="underline hover:no-underline">
              Cập nhật giá vốn
            </Link>
          </p>
        </div>
      )}

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Doanh thu"
          value={formatVnd(totalRevenue)}
          sub={`${activeOrders.length} đơn hàng`}
          color="blue"
        />
        <StatCard
          label="Lợi nhuận ước tính"
          value={costDataAvailable ? formatVnd(totalProfit) : "Chưa có dữ liệu"}
          sub={costDataAvailable ? `Biên ${margin}%` : "Nhập giá vốn để xem"}
          color={totalProfit >= 0 ? "green" : "red"}
          icon={totalProfit >= 0 ? TrendingUp : TrendingDown}
        />
        <StatCard
          label="Giá trị đơn TB"
          value={activeOrders.length > 0 ? formatVnd(avgOrderValue) : "—"}
          sub="Trung bình / đơn"
          color="purple"
        />
        <StatCard
          label="Tổng giá vốn"
          value={costDataAvailable ? formatVnd(totalCOGS) : "—"}
          sub="COGS ước tính"
          color="amber"
        />
      </div>

      {/* Chart */}
      {dailyData.length > 0 && (
        <div className="mt-8">
          <h2 className="font-serif text-lg text-ink">Doanh thu theo ngày</h2>
          <div className="mt-3 border border-line bg-surface p-5">
            <div className="flex items-end gap-1" style={{ height: 160 }}>
              {dailyData.map((day) => {
                const revH = Math.round((day.revenue / maxRevenue) * 140);
                const profH = costDataAvailable
                  ? Math.max(0, Math.round((day.profit / maxRevenue) * 140))
                  : 0;
                return (
                  <div key={day.key} className="group relative flex flex-1 flex-col items-center justify-end gap-0.5" style={{ height: 160 }}>
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden min-w-[110px] rounded bg-ink px-2 py-1.5 text-[11px] text-paper shadow group-hover:block z-10 left-1/2 -translate-x-1/2">
                      <p className="font-medium">{formatDayLabel(day.key)}</p>
                      <p>DT: {formatVnd(day.revenue)}</p>
                      {costDataAvailable && <p>LN: {formatVnd(day.profit)}</p>}
                    </div>
                    {/* Profit bar */}
                    {costDataAvailable && profH > 0 && (
                      <div className="w-full rounded-t-sm bg-emerald-400" style={{ height: profH }} />
                    )}
                    {/* Revenue bar behind/below */}
                    {revH > profH && (
                      <div className="w-full rounded-t-sm bg-blue-400" style={{ height: revH - profH }} />
                    )}
                    {revH === 0 && <div className="w-full bg-line" style={{ height: 2 }} />}
                    <span className="mt-1 rotate-0 text-[9px] text-muted">{formatDayLabel(day.key)}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-muted">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-blue-400" />Doanh thu</span>
              {costDataAvailable && <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" />Lợi nhuận</span>}
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
                    <th className="px-4 py-3 text-right">Doanh thu</th>
                    <th className="px-4 py-3 text-right">Lợi nhuận</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map(([pid, data]) => (
                    <tr key={pid} className="border-b border-line last:border-0">
                      <td className="px-4 py-3">
                        <p className="line-clamp-1 text-ink">{productNameMap[pid] ?? pid}</p>
                      </td>
                      <td className="px-4 py-3 text-right text-muted">{data.qty}</td>
                      <td className="px-4 py-3 text-right font-medium text-ink">{formatVnd(data.revenue)}</td>
                      <td className="px-4 py-3 text-right">
                        {data.profit > 0 ? (
                          <span className="font-medium text-emerald-600">{formatVnd(data.profit)}</span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
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
                    <th className="px-4 py-3 text-right">Doanh thu</th>
                    <th className="px-4 py-3 text-right">Lợi nhuận</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => {
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
                        <td className="px-4 py-3 text-right text-ink">{formatVnd(order.total)}</td>
                        <td className="px-4 py-3 text-right">
                          {hasCost ? (
                            <span className={`font-medium ${profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                              {formatVnd(profit)}
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted">Chưa có GV</span>
                          )}
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
  label,
  value,
  sub,
  color,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  color: "blue" | "green" | "red" | "purple" | "amber";
  icon?: React.ElementType;
}) {
  const colorMap = {
    blue:   "bg-blue-50 text-blue-600",
    green:  "bg-emerald-50 text-emerald-600",
    red:    "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
    amber:  "bg-amber-50 text-amber-600",
  };
  return (
    <div className="border border-line bg-surface p-5">
      <p className="text-[11px] uppercase tracking-label text-muted">{label}</p>
      <p className="mt-1.5 text-xl font-bold text-ink">{value}</p>
      {sub && (
        <div className="mt-1.5 flex items-center gap-1.5">
          {Icon && (
            <span className={`inline-flex items-center rounded-full p-0.5 ${colorMap[color]}`}>
              <Icon size={11} />
            </span>
          )}
          <p className="text-xs text-muted">{sub}</p>
        </div>
      )}
    </div>
  );
}
