import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "danger" | "success";
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  variant = "default",
}: StatCardProps) {
  const variants = {
    default: {
      icon: "bg-primary/10 text-primary border-primary/30",
      glow: "hover:shadow-glow",
    },
    danger: {
      icon: "bg-danger/10 text-danger border-danger/30",
      glow: "hover:shadow-glow-danger",
    },
    success: {
      icon: "bg-success/10 text-success border-success/30",
      glow: "hover:shadow-glow",
    },
  };

  const style = variants[variant];

  return (
    <div
      className={cn(
        "relative rounded-xl bg-surface border border-border p-6 transition-all duration-300",
        style.glow,
        "glow-border"
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted">{title}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          {trend && (
            <p
              className={cn(
                "mt-2 text-sm font-medium",
                trend.isPositive ? "text-success" : "text-danger"
              )}
            >
              {trend.isPositive ? "+" : "-"}
              {Math.abs(trend.value)}%
              <span className="text-muted ml-1">vs last hour</span>
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-lg border",
            style.icon
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
