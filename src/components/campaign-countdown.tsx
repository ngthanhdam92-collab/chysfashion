"use client";

import { useEffect, useState } from "react";

interface Props {
  endsAt: string;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function getTimeLeft(endsAt: string) {
  const total = Math.max(0, new Date(endsAt).getTime() - Date.now());
  return {
    total,
    days: Math.floor(total / 86400000),
    hours: Math.floor((total % 86400000) / 3600000),
    minutes: Math.floor((total % 3600000) / 60000),
    seconds: Math.floor((total % 60000) / 1000),
  };
}

export function CampaignCountdown({ endsAt }: Props) {
  const [t, setT] = useState(() => getTimeLeft(endsAt));

  useEffect(() => {
    const id = setInterval(() => setT(getTimeLeft(endsAt)), 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (t.total <= 0) {
    return (
      <div className="bg-red-600 py-2 text-center text-sm font-semibold text-white">
        Chương trình đã kết thúc
      </div>
    );
  }

  const units = [
    { label: "Ngày", value: t.days },
    { label: "Giờ", value: t.hours },
    { label: "Phút", value: t.minutes },
    { label: "Giây", value: t.seconds },
  ];

  return (
    <div className="bg-red-600 py-3 text-white">
      <p className="mb-2 text-center text-xs font-medium tracking-wide opacity-90">
        🔥 KHUYẾN MÃI KẾT THÚC SAU
      </p>
      <div className="flex justify-center gap-2">
        {units.map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded bg-white text-xl font-bold tabular-nums text-red-600">
              {pad(value)}
            </div>
            <span className="mt-1 text-[10px] opacity-80">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
