import { getCostEntries } from "@/lib/costs";
import { getCostSettings } from "@/lib/cost-settings";
import { getAllOrders } from "@/lib/orders";
import { getAllProducts } from "@/lib/products";
import { formatVnd } from "@/lib/utils";
import { CostEntryPanel } from "@/components/admin/cost-entry-panel";
import { IncidentalCostPanel } from "@/components/admin/incidental-cost-panel";
import { CostDatePicker } from "@/components/admin/cost-date-picker";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { OrderItem } from "@/lib/types";

export const metadata = { title: "Chi phí — Admin CHYS" };

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(dateStr: string, delta: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + delta);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtDateVi(dateStr: string): string {
  const [y, m, dd] = dateStr.split("-");
  const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const dow = new Date(dateStr).getDay();
  return `${days[dow]}, ${dd}/${m}/${y}`;
}

export default async function ChiPhiPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: rawDate } = await searchParams;
  const today = todayStr();
  const date = rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : today;
  const prevDate = addDays(date, -1);
  const nextDate = addDays(date, 1);
  const isFuture = nextDate > today;

  // Month range for incidental costs
  const [dateY, dateM] = date.split("-");
  const monthStart = `${dateY}-${dateM}-01`;
  const monthEnd = `${dateY}-${dateM}-31`;
  const currentMonth = `${dateY}-${dateM}`;

  const [allEntries, monthEntries, settings, allOrders, products] = await Promise.all([
    getCostEntries(date, date),
    getCostEntries(monthStart, monthEnd),
    getCostSettings(),
    getAllOrders(),
    getAllProducts(),
  ]);

  const adEntries = allEntries.filter((e) => e.category.startsWith("ad_"));
  const incidentalEntries = monthEntries.filter((e) => e.category === "incidental");

  // Orders for this date (not cancelled)
  const dayOrders = allOrders.filter((o) => {
    const d = new Date(o.createdAt);
    const dk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return dk === date && o.status !== "da_huy";
  });
  const orderCount = dayOrders.length;

  // COGS
  const variantCostMap: Record<string, Record<string, number>> = {};
  const productCostMap: Record<string, number> = {};
  for (const p of products) {
    productCostMap[p.id] = p.costPrice ?? 0;
    variantCostMap[p.id] = {};
    for (const v of p.variants) {
      variantCostMap[p.id][`${v.color}__${v.size}`] = v.costPrice ?? (p.costPrice ?? 0);
    }
  }
  function itemCost(item: OrderItem): number {
    return (
      (variantCostMap[item.productId]?.[`${item.color}__${item.size}`] ??
        productCostMap[item.productId] ??
        0) * item.quantity
    );
  }

  const revenue = dayOrders.reduce((s, o) => s + o.subtotal - (o.discount ?? 0), 0);
  const shipping = dayOrders.reduce((s, o) => s + (o.shipping ?? 0), 0);
  const cogs = dayOrders.reduce(
    (s, o) => s + o.items.reduce((si, i) => si + itemCost(i), 0),
    0,
  );
  const grossProfit = revenue - cogs;
  const hasCogs = cogs > 0;

  // External costs from settings + daily ad entries
  const totalAd = adEntries.reduce((s, e) => s + e.amount, 0);
  const opPerOrder = settings.packagingPerOrder + settings.printingPerOrder;
  const totalOp = opPerOrder * orderCount;
  const estimatedReturns = Math.round((orderCount * settings.returnRatePct) / 100);
  const totalRet = estimatedReturns * settings.returnCostPerUnit;
  const totalExternal = totalAd + totalOp + totalRet;
  const netProfit = grossProfit - totalExternal;

  // Per-order allocation
  const perOrderAdOp = orderCount > 0 ? Math.round((totalAd + totalOp) / orderCount) : 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl text-ink">Chi phí</h1>
          <p className="mt-0.5 text-sm text-muted">
            Theo dõi chi phí quảng cáo, vận hành và hoàn hàng
          </p>
        </div>
        {/* Date navigator */}
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/chi-phi?date=${prevDate}`}
            className="rounded border border-line p-1.5 text-muted hover:border-ink/40 hover:text-ink"
          >
            <ChevronLeft size={16} />
          </Link>
          <CostDatePicker value={date} max={today} />
          <Link
            href={`/admin/chi-phi?date=${nextDate}`}
            className={`rounded border border-line p-1.5 transition-colors ${
              isFuture
                ? "pointer-events-none text-muted/30"
                : "text-muted hover:border-ink/40 hover:text-ink"
            }`}
          >
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>

      <p className="mb-5 text-sm font-medium text-muted">{fmtDateVi(date)}</p>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ProfitCard
          label="Doanh thu SP"
          value={formatVnd(revenue)}
          sub={`${orderCount} đơn`}
          color="blue"
        />
        <ProfitCard
          label="Giá vốn (COGS)"
          value={hasCogs ? formatVnd(cogs) : "Chưa có GV"}
          sub="Hàng bán ra"
          color="amber"
        />
        <ProfitCard
          label="Lợi nhuận gộp"
          value={hasCogs ? formatVnd(grossProfit) : "—"}
          sub="Doanh thu − GV"
          color={grossProfit >= 0 ? "green" : "red"}
        />
        <ProfitCard
          label="Chi phí ngoài"
          value={totalExternal > 0 ? formatVnd(totalExternal) : "Chưa nhập"}
          sub="QC + VH + hoàn hàng"
          color="slate"
        />
      </div>

      {/* Net profit banner */}
      {hasCogs && (
        <div className="mb-6 rounded border border-line bg-surface p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-label text-muted">
                Lợi nhuận ròng
              </p>
              <p
                className={`mt-1 text-3xl font-bold ${
                  netProfit >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {formatVnd(netProfit)}
              </p>
              {totalExternal > 0 && (
                <p className="mt-1 text-sm text-muted">
                  = {formatVnd(grossProfit)} (gộp) − {formatVnd(totalExternal)} (chi phí ngoài)
                </p>
              )}
            </div>
            {shipping > 0 && (
              <div className="text-right">
                <p className="text-xs text-muted">Phí ship thu về</p>
                <p className="font-semibold text-purple-600">{formatVnd(shipping)}</p>
              </div>
            )}
          </div>
          {totalExternal > 0 && (
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-4 text-sm">
              {totalAd > 0 && (
                <span className="text-muted">
                  Quảng cáo: <span className="font-medium text-blue-600">−{formatVnd(totalAd)}</span>
                </span>
              )}
              {totalOp > 0 && (
                <span className="text-muted">
                  Vận hành: <span className="font-medium text-amber-600">−{formatVnd(totalOp)}</span>
                </span>
              )}
              {totalRet > 0 && (
                <span className="text-muted">
                  Hoàn hàng (ước tính): <span className="font-medium text-red-500">−{formatVnd(totalRet)}</span>
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Per-order table */}
      {orderCount > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 font-serif text-lg text-ink">Lợi nhuận theo đơn hàng</h2>
          {(settings.returnRatePct > 0 || opPerOrder > 0 || totalAd > 0) && (
            <p className="mb-3 text-xs text-muted">
              {totalAd + totalOp > 0 && (
                <>Chi phí QC+VH chia đều: {formatVnd(perOrderAdOp)}/đơn. </>
              )}
              {settings.returnRatePct > 0 && (
                <>
                  Hoàn hàng {settings.returnRatePct}% → ước tính {estimatedReturns} đơn trong ngày.
                </>
              )}
            </p>
          )}
          <div className="overflow-x-auto border border-line bg-surface">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-label text-muted">
                  <th className="px-4 py-3">Đơn hàng</th>
                  <th className="px-4 py-3 text-right">Doanh thu SP</th>
                  <th className="px-4 py-3 text-right">COGS</th>
                  <th className="px-4 py-3 text-right">QC+VH/đơn</th>
                  <th className="px-4 py-3 text-right">LN ròng/đơn</th>
                </tr>
              </thead>
              <tbody>
                {dayOrders.map((order) => {
                  const rev = order.subtotal - (order.discount ?? 0);
                  const orderCogs = order.items.reduce((s, i) => s + itemCost(i), 0);
                  const orderNet = rev - orderCogs - perOrderAdOp;
                  const hasCost = orderCogs > 0;
                  return (
                    <tr key={order.id} className="border-b border-line last:border-0 hover:bg-cream/40">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-medium text-ink hover:text-gold-dark"
                        >
                          {order.orderCode}
                        </Link>
                        <p className="text-[11px] text-muted">{order.fullName}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-ink">
                        {formatVnd(rev)}
                      </td>
                      <td className="px-4 py-3 text-right text-muted">
                        {hasCost ? formatVnd(orderCogs) : <span className="text-[11px]">Chưa có GV</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-muted">
                        {perOrderAdOp > 0 ? formatVnd(perOrderAdOp) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {hasCost ? (
                          <span
                            className={`font-semibold ${orderNet >= 0 ? "text-emerald-600" : "text-red-600"}`}
                          >
                            {formatVnd(orderNet)}
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {orderCount > 1 && (
                <tfoot>
                  <tr className="border-t-2 border-line bg-cream/40 font-medium">
                    <td className="px-4 py-3 text-xs text-muted">Tổng {orderCount} đơn</td>
                    <td className="px-4 py-3 text-right text-ink">{formatVnd(revenue)}</td>
                    <td className="px-4 py-3 text-right text-muted">
                      {hasCogs ? formatVnd(cogs) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-muted">
                      {totalAd + totalOp > 0 ? formatVnd(totalAd + totalOp) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {hasCogs ? (
                        <span
                          className={`font-bold ${netProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}
                        >
                          {formatVnd(netProfit - totalRet)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {orderCount === 0 && (
        <div className="mb-6 rounded border border-line bg-surface px-5 py-10 text-center text-sm text-muted">
          Không có đơn hàng nào ngày {date.split("-").reverse().join("/")}
        </div>
      )}

      {/* Daily cost forms */}
      <h2 className="mb-4 font-serif text-lg text-ink">Nhập chi phí</h2>
      <CostEntryPanel
        date={date}
        adEntries={adEntries}
        settings={settings}
        orderCount={orderCount}
      />

      {/* Monthly incidental costs */}
      <div className="mt-5">
        <IncidentalCostPanel entries={incidentalEntries} currentMonth={currentMonth} />
      </div>
    </div>
  );
}

function ProfitCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color: "blue" | "green" | "red" | "amber" | "slate";
}) {
  const colors: Record<string, string> = {
    blue: "text-blue-600",
    green: "text-emerald-600",
    red: "text-red-600",
    amber: "text-amber-600",
    slate: "text-ink",
  };
  return (
    <div className="border border-line bg-surface p-4">
      <p className="text-[11px] uppercase tracking-label text-muted">{label}</p>
      <p className={`mt-1.5 text-xl font-bold ${colors[color]}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}
