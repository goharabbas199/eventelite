import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: "blue" | "green" | "purple" | "orange" | "red";
  subtitle?: string;
  trend?: string;
  onClick?: () => void;
}

const colorConfig = {
  blue:   { icon: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" },
  green:  { icon: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  purple: { icon: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  orange: { icon: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  red:    { icon: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
};

export function StatsCard({ title, value, icon: Icon, color = "blue", subtitle, onClick }: StatsCardProps) {
  const cfg = colorConfig[color];

  return (
    <div
      onClick={onClick}
      className={`stat-card flex items-center justify-between gap-3 transition-all duration-200 ${onClick ? "cursor-pointer hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0" : ""}`}
    >
      <div className="min-w-0 flex-1">
        <p className="eyebrow mb-1.5">{title}</p>
        <p className="text-lg md:text-[22px] font-bold tracking-tight text-slate-900 dark:text-white leading-none transition-all duration-200">{value}</p>
        {subtitle && <p className="text-[11px] text-slate-400 font-medium mt-1.5 leading-none transition-all duration-200">{subtitle}</p>}
      </div>
      <div className={`p-2.5 rounded-xl ${cfg.icon} shrink-0 transition-all duration-200 ${onClick ? "group-hover:scale-110" : ""}`}>
        <Icon className="w-4.5 h-4.5 w-[18px] h-[18px] transition-transform duration-200" strokeWidth={1.8} />
      </div>
    </div>
  );
}
