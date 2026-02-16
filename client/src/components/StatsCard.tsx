import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color: "blue" | "green" | "purple" | "orange";
}

export function StatsCard({ title, value, icon: Icon, trend, color }: StatsCardProps) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-emerald-50 text-emerald-600 border-emerald-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
  };

  const iconColorMap = {
    blue: "text-blue-600",
    green: "text-emerald-600",
    purple: "text-purple-600",
    orange: "text-orange-600",
  };

  return (
    <Card className="border shadow-sm hover:shadow-md transition-all duration-300 group">
      <CardContent className="p-6 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
          {trend && (
            <p className="text-xs font-medium text-emerald-600 flex items-center mt-2 bg-emerald-50 w-fit px-2 py-0.5 rounded-full">
              <span>+</span>
              {trend}
              <span className="text-emerald-400 ml-1">this month</span>
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorMap[color]} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`w-6 h-6 ${iconColorMap[color]}`} />
        </div>
      </CardContent>
    </Card>
  );
}
