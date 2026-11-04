import { LucideIcon } from "lucide-react";

interface MetricsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  color?: "blue" | "emerald" | "amber" | "purple" | "rose" | "indigo";
}

export function MetricsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "blue",
}: MetricsCardProps) {
  const colorMap = {
    blue: {
      bg: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
      border: "border-blue-100",
    },
    emerald: {
      bg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
      border: "border-emerald-100",
    },
    amber: {
      bg: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
      border: "border-amber-100",
    },
    purple: {
      bg: "bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400",
      border: "border-purple-100",
    },
    rose: {
      bg: "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400",
      border: "border-rose-100",
    },
    indigo: {
      bg: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400",
      border: "border-indigo-100",
    },
  };

  const currentTheme = colorMap[color];

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</span>
        <div className={`p-2 rounded-lg ${currentTheme.bg}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
        {trend && (
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
            {trend}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
}

