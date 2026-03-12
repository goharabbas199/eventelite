import { LucideIcon } from "lucide-react";
import { TrendingUp } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color: "blue" | "green" | "purple" | "orange" | "red";
  subtitle?: string;
  onClick?: () => void;
}

const colorConfig = {
  blue: {
    icon: "bg-indigo-500/10 text-indigo-600",
    accent: "bg-indigo-500",
    value: "text-slate-900",
    trend: "text-indigo-600 bg-indigo-50",
  },
  green: {
    icon: "bg-emerald-500/10 text-emerald-600",
    accent: "bg-emerald-500",
    value: "text-slate-900",
    trend: "text-emerald-600 bg-emerald-50",
  },
  purple: {
    icon: "bg-purple-500/10 text-purple-600",
    accent: "bg-purple-500",
    value: "text-slate-900",
    trend: "text-purple-600 bg-purple-50",
  },
  orange: {
    icon: "bg-amber-500/10 text-amber-600",
    accent: "bg-amber-500",
    value: "text-slate-900",
    trend: "text-amber-600 bg-amber-50",
  },
  red: {
    icon: "bg-red-500/10 text-red-600",
    accent: "bg-red-500",
    value: "text-slate-900",
    trend: "text-red-600 bg-red-50",
  },
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  color,
  subtitle,
  onClick,
}: StatsCardProps) {
  const cfg = colorConfig[color];

  return (
    <div
      onClick={onClick}
      className={`
        stat-card group relative overflow-hidden
        ${onClick ? "cursor-pointer hover:-translate-y-1 active:scale-[0.98]" : ""}
      `}
    >
      {/* Accent strip */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${cfg.accent} opacity-60`} />

      <div className="flex items-start justify-between">
        <div className="space-y-1.5 flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 leading-none">
            {title}
          </p>
          <p className={`text-2xl font-bold tracking-tight leading-none ${cfg.value}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
          )}
          {trend && (
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.trend}`}>
              <TrendingUp className="w-2.5 h-2.5" />
              +{trend} this month
            </span>
          )}
        </div>

        <div className={`p-2.5 rounded-xl ${cfg.icon} group-hover:scale-110 transition-transform duration-200 shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
