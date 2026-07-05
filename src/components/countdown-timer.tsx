"use client";

import { useState, useEffect } from "react";

function getTimeLeft(endTime: string) {
  const diff = Math.max(0, new Date(endTime).getTime() - Date.now());
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { h, m, s, done: diff === 0 };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

interface Props {
  endTime: string;
  size?: "sm" | "md" | "lg";
  onExpire?: () => void;
}

export function CountdownTimer({ endTime, size = "md", onExpire }: Props) {
  const [time, setTime] = useState(() => getTimeLeft(endTime));

  useEffect(() => {
    if (time.done) {
      onExpire?.();
      return;
    }
    const id = setInterval(() => {
      const t = getTimeLeft(endTime);
      setTime(t);
      if (t.done) {
        clearInterval(id);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [endTime, onExpire, time.done]);

  if (time.done) {
    return (
      <span className="text-xs font-medium text-muted">Đã kết thúc</span>
    );
  }

  const digitCls =
    size === "lg"
      ? "flex h-10 w-10 items-center justify-center rounded bg-red-600 text-lg font-bold text-white"
      : size === "sm"
      ? "flex h-6 w-6 items-center justify-center rounded bg-red-600 text-[11px] font-bold text-white"
      : "flex h-8 w-8 items-center justify-center rounded bg-red-600 text-sm font-bold text-white";

  const sepCls =
    size === "lg"
      ? "text-red-600 font-bold text-lg mx-0.5"
      : size === "sm"
      ? "text-red-600 font-bold text-[11px] mx-0.5"
      : "text-red-600 font-bold text-sm mx-0.5";

  return (
    <div className="flex items-center gap-1">
      <div className={digitCls}>{pad(time.h)}</div>
      <span className={sepCls}>:</span>
      <div className={digitCls}>{pad(time.m)}</div>
      <span className={sepCls}>:</span>
      <div className={digitCls}>{pad(time.s)}</div>
    </div>
  );
}
