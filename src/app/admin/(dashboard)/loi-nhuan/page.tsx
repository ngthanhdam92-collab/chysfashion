import { getAllOrders } from "@/lib/orders";
import { todayStrVN, dayKeyVN, monthKeyVN } from "@/lib/date-vn";
import { getAllProducts } from "@/lib/products";
import { getCostEntries } from "@/lib/costs";
import { getCostSettings } from "@/lib/cost-settings";
import { ProfitReportClient, type ProfitRow, type ProfitSummary } from "@/components/admin/profit-report-client";
import type { OrderItem } from "@/lib/types";

export const metadata = { title: "Báo cáo lợi nhuận — Admin CHYS" };

// ── Date helpers ──────────────────────────────────────────────────────────────

function todayStr(): string {
  return todayStrVN();
}

function pad(n: number) { return String(n).padStart(2, "0"); }

function addMonths(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

function monthRange(ym: string): { from: string; to: string } {
  const [y, m] = ym.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return { from: `${ym}-01`, to: `${ym}-${pad(lastDay)}` };
}

function dayKey(date: Date): string {
  return dayKeyVN(date);
}

function monthKey(date: Date): string {
  return monthKeyVN(date);
}

// ISO week key e.g. "2025-W27"
function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${pad(weekNum)}`;
}

// Get Mon-Sun range for a given week key
function weekRange(weekKey: string): { from: Date; to: Date } {
  const [yearStr, wStr] = weekKey.split("-W");
  const year = Number(yearStr);
  const weekNum = Number(wStr);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const monday = new Date(jan4.getTime() - ((jan4.getUTCDay() || 7) - 1) * 86400000);
  const weekMonday = new Date(monday.getTime() + (weekNum - 1) * 7 * 86400000);
  const weekSunday = new Date(weekMonday.getTime() + 6 * 86400000);
  return { from: weekMonday, to: weekSunday };
}

function fmtDateShort(d: Date): string {
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}`;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default async function LoiNhuanPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; month?: string; year?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const today = todayStr();
  const [ty, tm] = today.split("-");
  const currentMonthDefault = `${ty}-${tm}`;
  const currentYearDefault  = ty;

  const rawView = params.view ?? "month";
  const view = (["day", "week", "month", "custom"].includes(rawView) ? rawView : "month") as
    "day" | "week" | "month" | "custom";

  // Navigation values
  const currentMonth = /^\d{4}-\d{2}$/.test(params.month ?? "") ? params.month! : currentMonthDefault;
  const currentYear  = /^\d{4}$/.test(params.year ?? "") ? params.year! : currentYearDefault;
  const prevMonth    = addMonths(currentMonth, -1);
  const nextMonth    = addMonths(currentMonth, 1);
  const prevYear     = String(Number(currentYear) - 1);
  const nextYear     = String(Number(currentYear) + 1);

  const customTo   = /^\d{4}-\d{2}-\d{2}$/.test(params.to ?? "") ? params.to! : today;
  const customFrom = /^\d{4}-\d{2}-\d{2}$/.test(params.from ?? "") ? params.from! : (() => {
    const d = new Date(customTo); d.setDate(d.getDate() - 29);
    return dayKey(d);
  })();

  // Determine fetch range (slightly wider for week view)
  let fetchFrom: string;
  let fetchTo: string;

  if (view === "day") {
    const r = monthRange(currentMonth);
    fetchFrom = r.from; fetchTo = r.to;
  } else if (view === "week") {
    // Cover full weeks overlapping the month
    const r = monthRange(currentMonth);
    const firstDay = new Date(r.from);
    const lastDay  = new Date(r.to);
    firstDay.setDate(firstDay.getDate() - 6);
    lastDay.setDate(lastDay.getDate() + 6);
    fetchFrom = dayKey(firstDay); fetchTo = dayKey(lastDay);
  } else if (view === "month") {
    fetchFrom = `${currentYear}-01-01`; fetchTo = `${currentYear}-12-31`;
  } else {
    fetchFrom = customFrom; fetchTo = customTo;
  }

  // ── Fetch data ───────────────────────────────────────────────────────────────
  const [allOrders, products, costEntries, settings] = await Promise.all([
    getAllOrders(),
    getAllProducts(),
    getCostEntries(fetchFrom, fetchTo),
    getCostSettings(),
  ]);

  // ── Cost lookup maps ─────────────────────────────────────────────────────────
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
        productCostMap[item.productId] ?? 0) * item.quantity
    );
  }

  function orderHasCogs(items: OrderItem[]): boolean {
    return items.every(
      (i) => (variantCostMap[i.productId]?.[`${i.color}__${i.size}`] ?? productCostMap[i.productId] ?? 0) > 0
    );
  }

  // ── Period key function ──────────────────────────────────────────────────────
  function getPeriodKey(order: { createdAt: string }): string {
    const d = new Date(order.createdAt);
    if (view === "month") return monthKey(d);
    if (view === "week")  return isoWeekKey(d);
    return dayKey(d);
  }

  // ── Filter active orders in range ────────────────────────────────────────────
  const activeOrders = allOrders.filter((o) => {
    if (o.status === "da_huy") return false;
    const dk = dayKey(new Date(o.createdAt));
    return dk >= fetchFrom && dk <= fetchTo;
  });

  // ── Cost entries by period key ───────────────────────────────────────────────
  const adByKey: Record<string, number>          = {};
  const incidentalByKey: Record<string, number>  = {};

  for (const entry of costEntries) {
    const d = new Date(entry.date);
    let k: string;
    if (view === "month")       k = monthKey(d);
    else if (view === "week")   k = isoWeekKey(d);
    else                        k = dayKey(d);

    if (entry.category.startsWith("ad_")) {
      adByKey[k] = (adByKey[k] ?? 0) + entry.amount;
    } else if (entry.category === "incidental") {
      incidentalByKey[k] = (incidentalByKey[k] ?? 0) + entry.amount;
    }
  }

  // ── Order data by period key ─────────────────────────────────────────────────
  interface PeriodData {
    orderCount: number;
    revenue: number;
    cogs: number;
    hasCogs: boolean;
  }
  const byKey: Record<string, PeriodData> = {};

  for (const order of activeOrders) {
    const k = getPeriodKey(order);
    if (!byKey[k]) byKey[k] = { orderCount: 0, revenue: 0, cogs: 0, hasCogs: true };
    const rev  = order.subtotal - (order.discount ?? 0);
    const cogs = order.items.reduce((s, i) => s + itemCost(i), 0);
    byKey[k].orderCount++;
    byKey[k].revenue += rev;
    byKey[k].cogs    += cogs;
    if (!orderHasCogs(order.items)) byKey[k].hasCogs = false;
  }

  // ── Build ordered list of period keys ────────────────────────────────────────
  function buildPeriodKeys(): string[] {
    if (view === "month") {
      return Array.from({ length: 12 }, (_, i) => `${currentYear}-${pad(i + 1)}`);
    }
    if (view === "day") {
      const [y, m] = currentMonth.split("-").map(Number);
      const days = new Date(y, m, 0).getDate();
      return Array.from({ length: days }, (_, i) => `${currentMonth}-${pad(i + 1)}`);
    }
    if (view === "week") {
      // All unique week keys that overlap the month, ordered
      const weekSet = new Set<string>();
      const r = monthRange(currentMonth);
      let cur = new Date(r.from);
      const end = new Date(r.to);
      while (cur <= end) {
        weekSet.add(isoWeekKey(cur));
        cur.setDate(cur.getDate() + 1);
      }
      return Array.from(weekSet).sort();
    }
    // custom: all days in range
    const keys: string[] = [];
    let cur = new Date(fetchFrom);
    const end = new Date(fetchTo);
    while (cur <= end) {
      keys.push(dayKey(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return keys;
  }

  const periodKeys = buildPeriodKeys();

  // ── Build row label ──────────────────────────────────────────────────────────
  function rowLabel(key: string): { label: string; subLabel?: string } {
    if (view === "month") {
      const [, m] = key.split("-");
      return { label: `Tháng ${Number(m)}` };
    }
    if (view === "day" || view === "custom") {
      const [, m, d] = key.split("-");
      return { label: `${d}/${m}` };
    }
    // week: "W27"
    const [, wStr] = key.split("-W");
    const { from, to } = weekRange(key);
    return {
      label: `Tuần ${Number(wStr)}`,
      subLabel: `${fmtDateShort(from)} – ${fmtDateShort(to)}`,
    };
  }

  // ── Build ProfitRow[] ─────────────────────────────────────────────────────────
  const rows: ProfitRow[] = periodKeys.map((key) => {
    const data = byKey[key] ?? { orderCount: 0, revenue: 0, cogs: 0, hasCogs: false };
    const adCost = adByKey[key] ?? 0;

    // Return cost estimated from settings × orders in this period
    const estimatedReturns = Math.round((data.orderCount * settings.returnRatePct) / 100);
    const returnCost       = estimatedReturns * settings.returnCostPerUnit;
    const shippingCost     = data.orderCount * settings.shippingCostPerOrder;
    const otherCost        = (incidentalByKey[key] ?? 0) + returnCost + shippingCost;

    const grossProfit = data.revenue - data.cogs;
    const netProfit   = grossProfit - adCost - otherCost;

    const { label, subLabel } = rowLabel(key);

    return {
      key,
      label,
      subLabel,
      orderCount: data.orderCount,
      revenue:     data.revenue,
      cogs:        data.cogs,
      grossProfit,
      adCost,
      otherCost,
      netProfit,
      hasCogs: data.orderCount > 0 ? data.hasCogs : false,
    };
  });

  // ── Summary ──────────────────────────────────────────────────────────────────
  const summary: ProfitSummary = rows.reduce<ProfitSummary>(
    (acc, r) => ({
      totalOrders:      acc.totalOrders      + r.orderCount,
      totalRevenue:     acc.totalRevenue     + r.revenue,
      totalCogs:        acc.totalCogs        + r.cogs,
      totalGrossProfit: acc.totalGrossProfit + r.grossProfit,
      totalAdCost:      acc.totalAdCost      + r.adCost,
      totalOtherCost:   acc.totalOtherCost   + r.otherCost,
      totalNetProfit:   acc.totalNetProfit   + r.netProfit,
      hasCogs:          acc.hasCogs && (r.orderCount === 0 || r.hasCogs),
    }),
    {
      totalOrders: 0, totalRevenue: 0, totalCogs: 0,
      totalGrossProfit: 0, totalAdCost: 0, totalOtherCost: 0,
      totalNetProfit: 0, hasCogs: true,
    }
  );

  // If no orders at all, hasCogs should be false
  if (summary.totalOrders === 0) summary.hasCogs = false;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-ink">Báo cáo lợi nhuận</h1>
        <p className="mt-0.5 text-sm text-muted">
          Thống kê doanh thu, chi phí và lợi nhuận theo kỳ, kèm tỉ lệ % phân bổ
        </p>
      </div>

      <ProfitReportClient
        rows={rows}
        summary={summary}
        view={view}
        currentMonth={currentMonth}
        currentYear={currentYear}
        prevMonth={prevMonth}
        nextMonth={nextMonth}
        prevYear={prevYear}
        nextYear={nextYear}
        customFrom={customFrom}
        customTo={customTo}
        today={today}
      />
    </div>
  );
}
