import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, ThreatClass } from "@/lib/types";

interface AlertItemProps {
  alert: Alert;
  compact?: boolean;
}

const classIcons: Record<ThreatClass, string> = {
  gun: "🔫",
  knife: "🔪",
};

export function AlertItem({ alert, compact = false }: AlertItemProps) {
  const isHighConfidence = alert.confidence > 0.85;
  const timeAgo = getTimeAgo(alert.timestamp);
  const icon = classIcons[alert.class] ?? "⚠️";

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg p-3 border transition-all",
          isHighConfidence
            ? "bg-danger/10 border-danger/30"
            : "bg-surface-light border-border"
        )}
      >
        <span className="text-lg">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white capitalize">
              {alert.class}
            </span>
            <span
              className={cn(
                "text-xs font-medium",
                isHighConfidence ? "text-danger" : "text-warning"
              )}
            >
              {(alert.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-xs text-muted truncate">{timeAgo}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative rounded-xl border p-4 transition-all duration-300",
        alert.status === "active"
          ? isHighConfidence
            ? "bg-danger/5 border-danger/30 shadow-glow-danger"
            : "bg-warning/5 border-warning/30"
          : "bg-surface border-border opacity-60"
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-lg text-2xl",
            alert.status === "active"
              ? isHighConfidence
                ? "bg-danger/20"
                : "bg-warning/20"
              : "bg-surface-light"
          )}
        >
          {icon}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white capitalize">
              {alert.class} Detected
            </h3>
            {alert.status === "active" && (
              <span className="flex items-center gap-1 rounded-full bg-danger/20 px-2 py-0.5 text-xs font-medium text-danger">
                <span className="h-1.5 w-1.5 rounded-full bg-danger animate-pulse" />
                Active
              </span>
            )}
            {alert.status === "resolved" && (
              <span className="rounded-full bg-success/20 px-2 py-0.5 text-xs font-medium text-success">
                Resolved
              </span>
            )}
          </div>

          <div className="mt-2 flex items-center gap-4 text-sm text-muted">
            <span>{alert.camera}</span>
            <span>&bull;</span>
            <span>{timeAgo}</span>
          </div>

          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted">Confidence</span>
              <span
                className={cn(
                  "font-semibold",
                  isHighConfidence ? "text-danger" : "text-warning"
                )}
              >
                {(alert.confidence * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-light">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isHighConfidence ? "bg-danger" : "bg-warning"
                )}
                style={{ width: `${alert.confidence * 100}%` }}
              />
            </div>
          </div>
        </div>

        {alert.status === "active" && (
          <button className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-light hover:text-white">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
