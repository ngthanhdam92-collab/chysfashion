"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatVnd } from "@/lib/utils";

export interface ProfitRow {
  key: string;
  label: string;
  subLabel?: string;
  orderCount: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  adCost: number;
  otherCost: number;
  netProfit: number;
  hasCogs: boolean;
}

export interface ProfitSummary {
  totalOrders: number;
  totalRevenue: number;
  totalCogs: number;
  totalGrossProfit: number;
  totalAdCost: number;
  totalOtherCost: number;
  totalNetProfit: number;
  hasCogs: boolean;
}

type View = "day" | "week" | "month" | "custom";

interface Props {
  rows: ProfitRow[];
  summary: ProfitSummary;
  view: View;
  currentMonth: string;   // "YYYY-MM" — for day/week nav
  currentYear: string;    // "YYYY"    — for month nav
  prevMonth: string;
  nextMonth: string;
  prevYear: string;
  nextYear: string;
  customFrom: string;
  customTo: string;
  today: string;
}

function pct(value: number, base: number): string {
  if (base <= 0) return "—";
  return `${Math.round((value / base) * 100)}%`;
}

function pctNum(value: number, base: number): number {
  if (base <= 0) return 0;
  return Math.round((value / base) * 100);
}

function SummaryCard({
  label, value, sub, colorClass,
}: { label: string; value: string; sub?: string; colorClass: string }) {
  return (
    <div className="border border-line bg-surface p-4">
      <p className="text-[11px] uppercase tracking-label text-muted">{label}</p>
      <p className={`mt-1.5 text-xl font-bold ${colorClass}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}

export function ProfitReportClient({
  rows, summary, view,
  currentMonth, currentYear,
  prevMonth, nextMonth, prevYear, nextYear,
  customFrom, customTo, today,
}: Props) {
  const router = useRouter();

  const tabs: { key: View; label: string }[] = [
    { key: "day",    label: "Ngày" },
    { key: "week",   label: "Tuần" },
    { key: "month",  label: "Tháng" },
    { key: "custom", label: "Tùy chỉnh" },
  ];

  function tabHref(v: View): string {
    if (v === "month")  return `/admin/loi-nhuan?view=month&year=${currentYear}`;
    if (v === "custom") return `/admin/loi-nhuan?view=custom&from=${customFrom}&to=${customTo}`;
    return `/admin/loi-nhuan?view=${v}&month=${currentMonth}`;
  }

  const isDay   = view === "day";
  const isWeek  = view === "week";
  const isMonth = view === "month";

  const grossMarginPct   = pctNum(summary.totalGrossProfit, summary.totalRevenue);
  const adPct            = pctNum(summary.totalAdCost, summary.totalRevenue);
  const otherPct         = pctNum(summary.totalOtherCost, summary.totalRevenue);
  const netPct           = pctNum(summary.totalNetProfit, summary.totalRevenue);
  const cogsPct          = pctNum(summary.totalCogs, summary.totalRevenue);

  return (
    <div className="space-y-6">
      {/* ── Period tabs ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-0 border-b border-line">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={tabHref(t.key)}
              className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                view === t.key
                  ? "border-ink text-ink"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {/* ── Navigation control ── */}
        {(isDay || isWeek) && (
          <div className="flex items-center gap-1.5">
            <Link
              href={`/admin/loi-nhuan?view=${view}&month=${prevMonth}`}
              className="rounded border border-line p-1.5 text-muted hover:border-ink/40 hover:text-ink"
            >
              <ChevronLeft size={15} />
            </Link>
            <span className="min-w-[90px] text-center text-sm font-medium text-ink">
              {currentMonth.split("-").reverse().join("/")}
            </span>
            <Link
              href={`/admin/loi-nhuan?view=${view}&month=${nextMonth}`}
              className={`rounded border border-line p-1.5 transition-colors ${
                nextMonth > today.slice(0, 7)
                  ? "pointer-events-none text-muted/30"
                  : "text-muted hover:border-ink/40 hover:text-ink"
              }`}
            >
              <ChevronRight size={15} />
            </Link>
          </div>
        )}

        {isMonth && (
          <div className="flex items-center gap-1.5">
            <Link
              href={`/admin/loi-nhuan?view=month&year=${prevYear}`}
              className="rounded border border-line p-1.5 text-muted hover:border-ink/40 hover:text-ink"
            >
              <ChevronLeft size={15} />
            </Link>
            <span className="min-w-[60px] text-center text-sm font-medium text-ink">{currentYear}</span>
            <Link
              href={`/admin/loi-nhuan?view=month&year=${nextYear}`}
              className={`rounded border border-line p-1.5 transition-colors ${
                nextYear > today.slice(0, 4)
                  ? "pointer-events-none text-muted/30"
                  : "text-muted hover:border-ink/40 hover:text-ink"
              }`}
            >
              <ChevronRight size={15} />
            </Link>
          </div>
        )}

        {view === "custom" && (
          <div className="flex items-center gap-2 text-sm">
            <input
              type="date"
              defaultValue={customFrom}
              max={customTo}
              onChange={(e) => {
                if (e.target.value) router.push(`/admin/loi-nhuan?view=custom&from=${e.target.value}&to=${customTo}`);
              }}
              className="border border-line bg-white px-2 py-1.5 text-sm focus:border-gold focus:outline-none"
            />
            <span className="text-muted">–</span>
            <input
              type="date"
              defaultValue={customTo}
              max={today}
              onChange={(e) => {
                if (e.target.value) router.push(`/admin/loi-nhuan?view=custom&from=${customFrom}&to=${e.target.value}`);
              }}
              className="border border-line bg-white px-2 py-1.5 text-sm focus:border-gold focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard
          label="Doanh thu"
          value={formatVnd(summary.totalRevenue)}
          sub={`${summary.totalOrders} đơn`}
          colorClass="text-blue-600"
        />
        <SummaryCard
          label="Giá vốn (COGS)"
          value={summary.hasCogs ? formatVnd(summary.totalCogs) : "Chưa có GV"}
          sub={summary.hasCogs ? `${cogsPct}% doanh thu` : undefined}
          colorClass="text-amber-600"
        />
        <SummaryCard
          label="Tổng chi phí ngoài"
          value={formatVnd(summary.totalAdCost + summary.totalOtherCost)}
          sub={`QC + CP khác`}
          colorClass="text-slate-600"
        />
        <SummaryCard
          label="Lợi nhuận ròng"
          value={summary.hasCogs ? formatVnd(summary.totalNetProfit) : "—"}
          sub={summary.hasCogs ? `Biên ${netPct}%` : "Nhập giá vốn để xem"}
          colorClass={summary.totalNetProfit >= 0 ? "text-emerald-600" : "text-red-600"}
        />
      </div>

      {/* ── % breakdown bar (totals) ── */}
      {summary.hasCogs && summary.totalRevenue > 0 && (
        <div className="border border-line bg-surface p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-label text-muted">
            Phân bổ doanh thu (tổng kỳ)
          </p>
          <div className="flex h-7 overflow-hidden rounded text-[11px] font-medium text-white">
            {cogsPct > 0 && (
              <div className="flex items-center justify-center bg-amber-400" style={{ width: `${cogsPct}%` }} title={`Giá vốn ${cogsPct}%`}>
                {cogsPct >= 8 && `GV ${cogsPct}%`}
              </div>
            )}
            {adPct > 0 && (
              <div className="flex items-center justify-center bg-blue-500" style={{ width: `${adPct}%` }} title={`Quảng cáo ${adPct}%`}>
                {adPct >= 6 && `QC ${adPct}%`}
              </div>
            )}
            {otherPct > 0 && (
              <div className="flex items-center justify-center bg-violet-500" style={{ width: `${otherPct}%` }} title={`CP khác ${otherPct}%`}>
                {otherPct >= 6 && `Khác ${otherPct}%`}
              </div>
            )}
            {netPct > 0 && (
              <div className="flex items-center justify-center bg-emerald-500" style={{ width: `${netPct}%` }} title={`Lợi nhuận ${netPct}%`}>
                {netPct >= 6 && `LN ${netPct}%`}
              </div>
            )}
            {netPct < 0 && (
              <div className="flex items-center justify-center bg-red-500" style={{ width: `${Math.min(100, Math.abs(netPct))}%` }} title={`Lỗ ${netPct}%`}>
                Lỗ {netPct}%
              </div>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
            <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-400" />Giá vốn {cogsPct}%</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-blue-500" />Quảng cáo {adPct}%</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-violet-500" />CP khác {otherPct}%</span>
            <span className="flex items-center gap-1"><span className={`inline-block h-2.5 w-2.5 rounded-sm ${netPct >= 0 ? "bg-emerald-500" : "bg-red-500"}`} />LN ròng {netPct}%</span>
          </div>
        </div>
      )}

      {/* ── Main table ── */}
      {rows.length === 0 ? (
        <div className="border border-line bg-surface px-4 py-12 text-center text-sm text-muted">
          Không có dữ liệu cho kỳ này.
        </div>
      ) : (
        <div className="overflow-x-auto border border-line bg-surface">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-line bg-cream/50 text-left text-[11px] uppercase tracking-label text-muted">
                <th className="px-4 py-3 w-28">Kỳ</th>
                <th className="px-3 py-3 text-right w-12">Đơn</th>
                <th className="px-3 py-3 text-right">Doanh thu</th>
                <th className="px-3 py-3 text-right">Giá vốn</th>
                <th className="px-3 py-3 text-right">LN gộp</th>
                <th className="px-3 py-3 text-right">Quảng cáo</th>
                <th className="px-3 py-3 text-right">CP khác</th>
                <th className="px-3 py-3 text-right">LN ròng</th>
                <th className="px-3 py-3 w-28">Phân bổ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const rCogs    = pctNum(row.cogs, row.revenue);
                const rGross   = pctNum(row.grossProfit, row.revenue);
                const rAd      = pctNum(row.adCost, row.revenue);
                const rOther   = pctNum(row.otherCost, row.revenue);
                const rNet     = pctNum(row.netProfit, row.revenue);

                return (
                  <tr key={row.key} className="border-b border-line last:border-0 hover:bg-cream/30">
                    <td className="px-4 py-3">
                      <span className="font-medium text-ink">{row.label}</span>
                      {row.subLabel && <p className="text-[10px] text-muted leading-tight">{row.subLabel}</p>}
                    </td>
                    <td className="px-3 py-3 text-right text-muted">{row.orderCount}</td>

                    {/* Revenue */}
                    <td className="px-3 py-3 text-right">
                      <span className="font-medium text-ink">{row.revenue > 0 ? formatVnd(row.revenue) : "—"}</span>
                    </td>

                    {/* COGS */}
                    <td className="px-3 py-3 text-right">
                      {row.hasCogs ? (
                        <div>
                          <span className="text-amber-700">{formatVnd(row.cogs)}</span>
                          <p className="text-[10px] text-muted">{rCogs}%</p>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted">—</span>
                      )}
                    </td>

                    {/* Gross Profit */}
                    <td className="px-3 py-3 text-right">
                      {row.hasCogs ? (
                        <div>
                          <span className={row.grossProfit >= 0 ? "text-emerald-700" : "text-red-600"}>{formatVnd(row.grossProfit)}</span>
                          <p className="text-[10px] text-muted">{rGross}%</p>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted">—</span>
                      )}
                    </td>

                    {/* Ad Cost */}
                    <td className="px-3 py-3 text-right">
                      {row.adCost > 0 ? (
                        <div>
                          <span className="text-blue-600">{formatVnd(row.adCost)}</span>
                          <p className="text-[10px] text-muted">{pct(row.adCost, row.revenue)}</p>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted">—</span>
                      )}
                    </td>

                    {/* Other Cost */}
                    <td className="px-3 py-3 text-right">
                      {row.otherCost > 0 ? (
                        <div>
                          <span className="text-violet-600">{formatVnd(row.otherCost)}</span>
                          <p className="text-[10px] text-muted">{pct(row.otherCost, row.revenue)}</p>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted">—</span>
                      )}
                    </td>

                    {/* Net Profit */}
                    <td className="px-3 py-3 text-right">
                      {row.hasCogs ? (
                        <div>
                          <span className={`font-semibold ${row.netProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                            {formatVnd(row.netProfit)}
                          </span>
                          <p className={`text-[10px] font-medium ${row.netProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                            {rNet}%
                          </p>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted">—</span>
                      )}
                    </td>

                    {/* Mini stacked bar */}
                    <td className="px-3 py-3">
                      {row.hasCogs && row.revenue > 0 ? (
                        <div className="h-4 overflow-hidden rounded-sm flex text-[9px] text-white">
                          {rCogs > 0 && <div className="bg-amber-400" style={{ width: `${rCogs}%` }} title={`GV ${rCogs}%`} />}
                          {rAd > 0   && <div className="bg-blue-500" style={{ width: `${rAd}%` }} title={`QC ${rAd}%`} />}
                          {rOther > 0 && <div className="bg-violet-500" style={{ width: `${rOther}%` }} title={`Khác ${rOther}%`} />}
                          {rNet > 0  && <div className="bg-emerald-500" style={{ width: `${rNet}%` }} title={`LN ${rNet}%`} />}
                          {rNet < 0  && <div className="bg-red-500" style={{ width: `${Math.min(Math.abs(rNet), 100)}%` }} title={`Lỗ ${rNet}%`} />}
                        </div>
                      ) : (
                        <div className="h-4 rounded-sm bg-line" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Totals row */}
            <tfoot>
              <tr className="border-t-2 border-line bg-cream/60 font-medium">
                <td className="px-4 py-3 text-xs text-muted uppercase tracking-label">Tổng</td>
                <td className="px-3 py-3 text-right text-ink">{summary.totalOrders}</td>
                <td className="px-3 py-3 text-right font-bold text-ink">{formatVnd(summary.totalRevenue)}</td>
                <td className="px-3 py-3 text-right">
                  {summary.hasCogs ? (
                    <div>
                      <span className="text-amber-700">{formatVnd(summary.totalCogs)}</span>
                      <p className="text-[10px] text-muted">{cogsPct}%</p>
                    </div>
                  ) : "—"}
                </td>
                <td className="px-3 py-3 text-right">
                  {summary.hasCogs ? (
                    <div>
                      <span className={summary.totalGrossProfit >= 0 ? "text-emerald-700" : "text-red-600"}>{formatVnd(summary.totalGrossProfit)}</span>
                      <p className="text-[10px] text-muted">{grossMarginPct}%</p>
                    </div>
                  ) : "—"}
                </td>
                <td className="px-3 py-3 text-right">
                  {summary.totalAdCost > 0 ? (
                    <div>
                      <span className="text-blue-600">{formatVnd(summary.totalAdCost)}</span>
                      <p className="text-[10px] text-muted">{adPct}%</p>
                    </div>
                  ) : "—"}
                </td>
                <td className="px-3 py-3 text-right">
                  {summary.totalOtherCost > 0 ? (
                    <div>
                      <span className="text-violet-600">{formatVnd(summary.totalOtherCost)}</span>
                      <p className="text-[10px] text-muted">{otherPct}%</p>
                    </div>
                  ) : "—"}
                </td>
                <td className="px-3 py-3 text-right">
                  {summary.hasCogs ? (
                    <div>
                      <span className={`font-bold ${summary.totalNetProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {formatVnd(summary.totalNetProfit)}
                      </span>
                      <p className={`text-[10px] font-semibold ${summary.totalNetProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {netPct}%
                      </p>
                    </div>
                  ) : "—"}
                </td>
                <td className="px-3 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Legend note */}
      <p className="text-[11px] text-muted">
        % tính trên doanh thu sản phẩm (subtotal − giảm giá). QC = quảng cáo (Facebook/Zalo/TikTok). CP khác = chi phí phát sinh + phí giao hàng + ước tính hoàn hàng.
      </p>
    </div>
  );
}
