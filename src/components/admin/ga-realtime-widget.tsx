"use client";

import { useEffect, useState } from "react";
import { Radio } from "lucide-react";

interface RealtimeData {
  activeUsers: number;
  topPages: { page: string; users: number }[];
  topSources: { source: string; users: number }[];
}

export function GaRealtimeWidget() {
  const [data, setData] = useState<RealtimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function fetchData() {
    try {
      const res = await fetch("/api/ga-realtime");
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastUpdated(new Date());
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const timeStr = lastUpdated
    ? lastUpdated.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  return (
    <div className="border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-sm font-semibold text-ink">Người dùng đang online</span>
          <Radio size={13} className="text-muted" />
        </div>
        {timeStr && <span className="text-[11px] text-muted">Cập nhật {timeStr}</span>}
      </div>

      {loading ? (
        <div className="px-4 py-6 text-center text-sm text-muted">Đang tải...</div>
      ) : !data ? (
        <div className="px-4 py-6 text-center text-sm text-muted">Không lấy được dữ liệu</div>
      ) : (
        <div className="p-4">
          {/* Active users count */}
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-emerald-600">{data.activeUsers}</span>
            <span className="text-sm text-muted">người trong 30 phút qua</span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Top pages */}
            {data.topPages.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-label text-muted">Trang đang xem</p>
                <div className="space-y-1.5">
                  {data.topPages.map((p) => (
                    <div key={p.page} className="flex items-center justify-between gap-2">
                      <span className="truncate font-mono text-xs text-muted max-w-[160px]" title={p.page}>{p.page}</span>
                      <span className="shrink-0 text-xs font-semibold text-ink">{p.users}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top countries */}
            {data.topSources.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-label text-muted">Quốc gia</p>
                <div className="space-y-1.5">
                  {data.topSources.map((s) => (
                    <div key={s.source} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-ink">{s.source}</span>
                      <span className="shrink-0 text-xs font-semibold text-ink">{s.users}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {data.activeUsers === 0 && (
            <p className="mt-3 text-xs text-muted">Hiện không có ai online. Widget tự cập nhật mỗi 30 giây.</p>
          )}
        </div>
      )}
    </div>
  );
}
