import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface Trend {
  direction: "up" | "down" | "neutral";
  text: string;
}

const ACCENT = {
  gold:    { stripe: "bg-[#a9843f]",  icon: "bg-[#a9843f]/10 text-[#8a6b31]" },
  amber:   { stripe: "bg-amber-400",  icon: "bg-amber-50 text-amber-600" },
  blue:    { stripe: "bg-blue-400",   icon: "bg-blue-50 text-blue-600" },
  emerald: { stripe: "bg-emerald-500", icon: "bg-emerald-50 text-emerald-700" },
  slate:   { stripe: "bg-slate-400",  icon: "bg-slate-50 text-slate-600" },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  accent = "gold",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: Trend;
  accent?: keyof typeof ACCENT;
}) {
  const { stripe, icon: iconStyle } = ACCENT[accent];

  return (
    <div className="overflow-hidden rounded-sm bg-white shadow-[0_1px_4px_rgba(0,0,0,0.07),0_0_0_1px_rgba(0,0,0,0.04)]">
      {/* Top accent stripe */}
      <div className={`h-[3px] w-full ${stripe}`} />
      <div className="p-5">
        <div className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${iconStyle}`}>
          <Icon size={16} strokeWidth={1.75} />
        </div>
        <p className="mt-3 text-2xl font-semibold tracking-tight text-ink">{value}</p>
        <p className="mt-0.5 text-xs text-muted">{label}</p>
        {trend && (
          <div
            className={`mt-2.5 flex items-center gap-1 text-xs ${
              trend.direction === "up"
                ? "text-success"
                : trend.direction === "down"
                  ? "text-error"
                  : "text-muted"
            }`}
          >
            {trend.direction === "up" && <ArrowUpRight size={12} />}
            {trend.direction === "down" && <ArrowDownRight size={12} />}
            <span>{trend.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}
