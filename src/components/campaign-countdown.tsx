"use client";

import { useEffect, useState } from "react";

interface Props {
  countdownHours: number;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function getLoopingTimeLeft(hours: number) {
  const totalSeconds = hours * 3600;
  const elapsed = Math.floor(Date.now() / 1000) % totalSeconds;
  const remaining = totalSeconds - elapsed;
  return {
    hours: Math.floor(remaining / 3600),
    minutes: Math.floor((remaining % 3600) / 60),
    seconds: remaining % 60,
  };
}

export function CampaignCountdown({ countdownHours }: Props) {
  const [t, setT] = useState(() => getLoopingTimeLeft(countdownHours));

  useEffect(() => {
    const id = setInterval(() => setT(getLoopingTimeLeft(countdownHours)), 1000);
    return () => clearInterval(id);
  }, [countdownHours]);

  const units = [
    { label: "Giờ", value: t.hours },
    { label: "Phút", value: t.minutes },
    { label: "Giây", value: t.seconds },
  ];

  return (
    <div className="flex justify-center gap-3 py-2">
      {units.map(({ label, value }) => (
        <div key={label} className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded bg-red-600 text-2xl font-bold tabular-nums text-white shadow">
            {pad(value)}
          </div>
          <span className="mt-1 text-[11px] text-gray-500">{label}</span>
        </div>
      ))}
    </div>
  );
}
