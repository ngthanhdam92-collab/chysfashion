import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface Trend {
  direction: "up" | "down" | "neutral";
  text: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: Trend;
}) {
  return (
    <div className="border border-line bg-surface p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/12">
        <Icon size={18} strokeWidth={1.75} className="text-gold-dark" />
      </div>
      <p className="mt-3 text-2xl font-medium text-ink">{value}</p>
      <p className="text-xs text-muted">{label}</p>
      {trend && (
        <div
          className={`mt-2 flex items-center gap-1 text-xs ${
            trend.direction === "up"
              ? "text-success"
              : trend.direction === "down"
                ? "text-error"
                : "text-muted"
          }`}
        >
          {trend.direction === "up" && <ArrowUpRight size={13} />}
          {trend.direction === "down" && <ArrowDownRight size={13} />}
          <span>{trend.text}</span>
        </div>
      )}
    </div>
  );
}
