import { getReturnRecords } from "@/lib/return-records";
import { getCostSettings } from "@/lib/cost-settings";
import { todayStrVN } from "@/lib/date-vn";
import { formatVnd } from "@/lib/utils";
import { ReturnReceiveDialog } from "@/components/admin/return-receive-dialog";
import { DeleteReturnButton } from "@/components/admin/delete-return-button";
import Link from "next/link";
import { ChevronLeft, ChevronRight, PackageX } from "lucide-react";

export const metadata = { title: "Hàng hoàn — Admin CHYS" };

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function addMonths(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}
function fmtDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}
function fmtMonthLabel(ym: string): string {
  const [y, m] = ym.split("-");
  return `Tháng ${Number(m)}/${y}`;
}

export default async function HoanHangPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: rawMonth } = await searchParams;
  const today = todayStrVN();
  const [ty, tm] = today.split("-");
  const currentMonth =
    /^\d{4}-\d{2}$/.test(rawMonth ?? "") ? rawMonth! : `${ty}-${tm}`;

  const [y, m] = currentMonth.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const from = `${currentMonth}-01`;
  const to = `${currentMonth}-${pad(lastDay)}`;

  const prevMonth = addMonths(currentMonth, -1);
  const nextMonth = addMonths(currentMonth, 1);
  const isFutureMonth = nextMonth > `${ty}-${tm}`;

  const [records, settings] = await Promise.all([
    getReturnRecords(from, to),
    getCostSettings(),
  ]);

  const totalCost = records.reduce((s, r) => s + r.returnCost, 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl text-ink">Hàng hoàn</h1>
          <p className="mt-0.5 text-sm text-muted">
            Giao thất bại / hàng hoàn về kho — tồn kho tự cập nhật khi xác nhận
          </p>
        </div>
        <ReturnReceiveDialog defaultCost={settings.returnCostPerUnit} todayStr={today} />
      </div>

      {/* Month navigation */}
      <div className="mb-5 flex items-center gap-2">
        <Link
          href={`/admin/hoan-hang?month=${prevMonth}`}
          className="rounded border border-line p-1.5 text-muted hover:border-ink/40 hover:text-ink"
        >
          <ChevronLeft size={16} />
        </Link>
        <span className="min-w-[120px] text-center text-sm font-medium text-ink">
          {fmtMonthLabel(currentMonth)}
        </span>
        <Link
          href={`/admin/hoan-hang?month=${nextMonth}`}
          className={`rounded border border-line p-1.5 transition-colors ${
            isFutureMonth
              ? "pointer-events-none text-muted/30"
              : "text-muted hover:border-ink/40 hover:text-ink"
          }`}
        >
          <ChevronRight size={16} />
        </Link>
      </div>

      {/* Summary */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="border border-line bg-surface p-4">
          <p className="text-[11px] uppercase tracking-label text-muted">Đơn hoàn tháng này</p>
          <p className="mt-1.5 text-2xl font-bold text-orange-600">{records.length}</p>
          <p className="mt-0.5 text-xs text-muted">đơn giao thất bại</p>
        </div>
        <div className="border border-line bg-surface p-4">
          <p className="text-[11px] uppercase tracking-label text-muted">Tổng phí hoàn</p>
          <p className="mt-1.5 text-2xl font-bold text-red-600">
            {totalCost > 0 ? formatVnd(totalCost) : "—"}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {settings.returnCostPerUnit > 0
              ? `${formatVnd(settings.returnCostPerUnit)}/đơn`
              : "Chưa cài phí hoàn"}
          </p>
        </div>
        <div className="col-span-2 border border-line bg-surface p-4 sm:col-span-1">
          <p className="text-[11px] uppercase tracking-label text-muted">Tồn kho</p>
          <p className="mt-1.5 text-sm font-medium text-emerald-600">Tự động cập nhật</p>
          <p className="mt-0.5 text-xs text-muted">khi xác nhận từng đơn</p>
        </div>
      </div>

      {/* Table */}
      {records.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded border border-dashed border-line bg-surface py-16 text-center">
          <PackageX size={32} className="text-muted/40" />
          <p className="text-sm text-muted">Chưa có đơn hoàn nào trong {fmtMonthLabel(currentMonth)}</p>
          <p className="text-xs text-muted">
            Bấm <span className="font-medium text-ink">"Nhận hàng hoàn"</span> để ghi nhận đơn mới
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-line bg-surface">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-line bg-cream/50 text-left text-[11px] uppercase tracking-label text-muted">
                <th className="px-4 py-3">Ngày hoàn</th>
                <th className="px-4 py-3">Đơn hàng</th>
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3">Ghi chú</th>
                <th className="px-4 py-3 text-right">Phí hoàn</th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0 hover:bg-cream/30">
                  <td className="px-4 py-3 text-muted">{fmtDate(r.returnDate)}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${r.orderId}`}
                      className="font-mono font-medium text-ink hover:text-gold-dark"
                    >
                      {r.orderCode}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink">{r.customerName}</td>
                  <td className="px-4 py-3 max-w-[200px] truncate text-muted">
                    {r.notes || <span className="text-muted/50">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-red-600">
                    {r.returnCost > 0 ? `−${formatVnd(r.returnCost)}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <DeleteReturnButton id={r.id} />
                  </td>
                </tr>
              ))}
            </tbody>
            {records.length > 1 && (
              <tfoot>
                <tr className="border-t-2 border-line bg-cream/60 font-medium">
                  <td colSpan={4} className="px-4 py-3 text-xs text-muted">
                    Tổng {records.length} đơn hoàn
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-red-600">
                    −{formatVnd(totalCost)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {settings.returnCostPerUnit === 0 && (
        <p className="mt-4 text-xs text-muted">
          Chưa cài phí hoàn hàng.{" "}
          <Link href="/admin/chi-phi" className="text-gold-dark hover:underline">
            Cài đặt tại Chi phí →
          </Link>
        </p>
      )}
    </div>
  );
}
