"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { formatVnd } from "@/lib/utils";
import { saveAdCost } from "@/lib/costs";
import { saveCostSettings } from "@/lib/cost-settings";
import type { CostEntry } from "@/lib/costs";
import type { CostSettings } from "@/lib/cost-settings";

const AD_CHANNELS = [
  { key: "facebook" as const, label: "Facebook", color: "text-blue-600" },
  { key: "zalo" as const, label: "Zalo", color: "text-sky-500" },
  { key: "tiktok" as const, label: "TikTok", color: "text-rose-500" },
];

function parseNum(raw: string): number {
  return Math.round(Number(raw.replace(/\./g, "").replace(/,/g, "")) || 0);
}

function fmtInput(n: number): string {
  return n > 0 ? n.toLocaleString("vi-VN") : "";
}

function numInput(val: string, setter: (v: string) => void) {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\./g, "").replace(/[^0-9]/g, "");
    setter(raw ? Number(raw).toLocaleString("vi-VN") : "");
  };
}

interface Props {
  date: string;
  adEntries: CostEntry[];
  settings: CostSettings;
  orderCount: number;
}

export function CostEntryPanel({ date, adEntries, settings, orderCount }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // ── Ad costs ──────────────────────────────────────────────────────────────
  const getAdAmt = (ch: string) => {
    const e = adEntries.find((x) => x.category === `ad_${ch}`);
    return e ? fmtInput(e.amount) : "";
  };
  const [fb, setFb] = useState(getAdAmt("facebook"));
  const [zalo, setZalo] = useState(getAdAmt("zalo"));
  const [tt, setTt] = useState(getAdAmt("tiktok"));
  const [adSaved, setAdSaved] = useState(false);

  const totalAd = parseNum(fb) + parseNum(zalo) + parseNum(tt);

  function handleSaveAd() {
    startTransition(async () => {
      await Promise.all([
        saveAdCost(date, "facebook", parseNum(fb)),
        saveAdCost(date, "zalo", parseNum(zalo)),
        saveAdCost(date, "tiktok", parseNum(tt)),
      ]);
      setAdSaved(true);
      router.refresh();
      setTimeout(() => setAdSaved(false), 2500);
    });
  }

  // ── Shipping cost per order ───────────────────────────────────────────────
  const [shipCost, setShipCost] = useState(fmtInput(settings.shippingCostPerOrder));
  const [shipSaved, setShipSaved] = useState(false);

  const totalShip = parseNum(shipCost) * orderCount;

  function handleSaveShipping() {
    startTransition(async () => {
      await saveCostSettings({
        ...settings,
        shippingCostPerOrder: parseNum(shipCost),
      });
      setShipSaved(true);
      router.refresh();
      setTimeout(() => setShipSaved(false), 2500);
    });
  }

  // ── Return rate settings ──────────────────────────────────────────────────
  const [ratePct, setRatePct] = useState(
    settings.returnRatePct > 0 ? String(settings.returnRatePct) : "",
  );
  const [retCost, setRetCost] = useState(fmtInput(settings.returnCostPerUnit));
  const [retSaved, setRetSaved] = useState(false);

  const pct = Number(ratePct) || 0;
  const costPerReturn = parseNum(retCost);
  const estimatedReturns = orderCount > 0 ? Math.round((orderCount * pct) / 100) : 0;
  const totalRet = estimatedReturns * costPerReturn;

  function handleSaveReturn() {
    startTransition(async () => {
      await saveCostSettings({
        ...settings,
        returnRatePct: pct,
        returnCostPerUnit: costPerReturn,
      });
      setRetSaved(true);
      router.refresh();
      setTimeout(() => setRetSaved(false), 2500);
    });
  }

  const grandTotal = totalAd + totalShip + totalRet;

  return (
    <div className="space-y-5">
      {/* Summary */}
      {grandTotal > 0 && (
        <div className="flex flex-wrap items-center gap-5 rounded border border-line bg-surface px-5 py-4">
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-label text-muted">Tổng chi phí ngày này</p>
            <p className="mt-0.5 text-2xl font-bold text-ink">{formatVnd(grandTotal)}</p>
          </div>
          {totalAd > 0 && (
            <div className="text-right">
              <p className="text-[11px] text-muted">Quảng cáo</p>
              <p className="font-semibold text-blue-600">{formatVnd(totalAd)}</p>
            </div>
          )}
          {totalShip > 0 && (
            <div className="text-right">
              <p className="text-[11px] text-muted">Phí giao hàng</p>
              <p className="font-semibold text-orange-500">{formatVnd(totalShip)}</p>
            </div>
          )}
          {totalRet > 0 && (
            <div className="text-right">
              <p className="text-[11px] text-muted">Hoàn hàng (ước tính)</p>
              <p className="font-semibold text-red-500">{formatVnd(totalRet)}</p>
            </div>
          )}
        </div>
      )}

      {/* ── 1. Ad costs (daily) ── */}
      <Section
        title="Chi phí quảng cáo"
        badge="Nhập theo ngày"
        total={totalAd}
        totalColor="text-blue-600"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {(
            [
              ["facebook", fb, setFb],
              ["zalo", zalo, setZalo],
              ["tiktok", tt, setTt],
            ] as [string, string, (v: string) => void][]
          ).map(([ch, val, setter]) => {
            const chan = AD_CHANNELS.find((c) => c.key === ch)!;
            return (
              <div key={ch}>
                <label className={`mb-1.5 block text-xs font-semibold ${chan.color}`}>
                  {chan.label}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={val}
                  onChange={numInput(val, setter)}
                  placeholder="0"
                  className="w-full border border-line bg-white px-3 py-2 text-right font-mono text-sm focus:border-gold focus:outline-none"
                />
                <span className="mt-0.5 block text-right text-[10px] text-muted">VND</span>
              </div>
            );
          })}
        </div>
        <SaveRow
          onSave={handleSaveAd}
          saved={adSaved}
          pending={pending}
          label="Lưu chi phí QC ngày này"
        />
      </Section>

      {/* ── 2. Shipping cost per order ── */}
      <Section
        title="Phí giao hàng cố định"
        badge="Cài đặt 1 lần"
        total={totalShip}
        totalColor="text-orange-500"
        sub={
          parseNum(shipCost) > 0 && orderCount > 0
            ? `${orderCount} đơn × ${formatVnd(parseNum(shipCost))}`
            : undefined
        }
      >
        <p className="mb-4 text-xs text-muted">
          Phí bạn trả cho đơn vị vận chuyển mỗi đơn hàng (không phải phí ship thu từ khách).
          Chỉ cần lưu 1 lần, hệ thống tự nhân với số đơn trong ngày.
        </p>
        <div className="max-w-xs">
          <label className="mb-1.5 block text-xs font-semibold text-orange-500">
            Phí ship / đơn
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={shipCost}
            onChange={numInput(shipCost, setShipCost)}
            placeholder="0"
            className="w-full border border-line bg-white px-3 py-2 text-right font-mono text-sm focus:border-gold focus:outline-none"
          />
          <span className="mt-0.5 block text-right text-[10px] text-muted">VND / đơn</span>
        </div>
        {parseNum(shipCost) > 0 && orderCount > 0 && (
          <div className="mt-3 rounded bg-orange-50 px-3 py-2.5 text-xs text-orange-700">
            {orderCount} đơn × {formatVnd(parseNum(shipCost))} ={" "}
            <strong>{formatVnd(totalShip)}</strong> phí giao hàng hôm nay
          </div>
        )}
        <SaveRow
          onSave={handleSaveShipping}
          saved={shipSaved}
          pending={pending}
          label="Lưu phí giao hàng"
        />
      </Section>

      {/* ── 3. Return rate (settings, %) ── */}
      <Section
        title="Hoàn hàng / Giao thất bại"
        badge="Ước tính theo %"
        total={totalRet}
        totalColor="text-red-500"
        sub={
          estimatedReturns > 0
            ? `~${estimatedReturns} đơn hoàn × ${formatVnd(costPerReturn)}`
            : undefined
        }
      >
        <p className="mb-4 text-xs text-muted">
          Đặt tỉ lệ hoàn và phí xử lý mỗi đơn. Hệ thống tự tính ước tính chi phí dựa trên số đơn
          trong ngày. Chỉ cần lưu 1 lần.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-red-500">
              Tỉ lệ hoàn hàng
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={ratePct}
                onChange={(e) => setRatePct(e.target.value)}
                placeholder="10"
                className="w-full border border-line bg-white px-3 py-2 text-right font-mono text-sm focus:border-gold focus:outline-none"
              />
              <span className="shrink-0 text-sm font-semibold text-muted">%</span>
            </div>
            <span className="mt-0.5 block text-right text-[10px] text-muted">
              % đơn bị hoàn / giao thất bại
            </span>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-red-500">
              Phí xử lý / đơn hoàn
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={retCost}
              onChange={numInput(retCost, setRetCost)}
              placeholder="0"
              className="w-full border border-line bg-white px-3 py-2 text-right font-mono text-sm focus:border-gold focus:outline-none"
            />
            <span className="mt-0.5 block text-right text-[10px] text-muted">VND / đơn hoàn</span>
          </div>
        </div>
        {pct > 0 && costPerReturn > 0 && orderCount > 0 && (
          <div className="mt-3 rounded bg-red-50 px-3 py-2.5 text-xs text-red-700">
            {orderCount} đơn × {pct}% = ước tính{" "}
            <strong>{estimatedReturns} đơn hoàn</strong> → chi phí ~
            <strong>{formatVnd(totalRet)}</strong>
          </div>
        )}
        <SaveRow
          onSave={handleSaveReturn}
          saved={retSaved}
          pending={pending}
          label="Lưu cài đặt hoàn hàng"
        />
      </Section>
    </div>
  );
}

/* ── Sub-components ── */

function Section({
  title,
  badge,
  total,
  totalColor,
  sub,
  children,
}: {
  title: string;
  badge?: string;
  total: number;
  totalColor: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded border border-line bg-surface p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-base text-ink">{title}</h2>
            {badge && (
              <span className="rounded bg-line px-2 py-0.5 text-[10px] font-medium uppercase tracking-label text-muted">
                {badge}
              </span>
            )}
          </div>
          {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
        </div>
        {total > 0 && (
          <span className={`font-mono text-sm font-semibold ${totalColor}`}>
            {formatVnd(total)}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function SaveRow({
  onSave,
  saved,
  pending,
  label,
}: {
  onSave: () => void;
  saved: boolean;
  pending: boolean;
  label: string;
}) {
  return (
    <div className="mt-4 flex items-center gap-3">
      <button
        onClick={onSave}
        disabled={pending}
        className="flex items-center gap-2 rounded border border-ink bg-ink px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-ink/80 disabled:opacity-50"
      >
        <Save size={13} />
        {label}
      </button>
      {saved && <span className="text-xs text-emerald-600">✓ Đã lưu</span>}
    </div>
  );
}
