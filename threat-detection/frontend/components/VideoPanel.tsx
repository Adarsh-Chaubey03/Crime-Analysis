"use client";

import { Video, Maximize2, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPanelProps {
  showThreat?: boolean;
  cameraId?: string;
  className?: string;
}

export function VideoPanel({
  showThreat = true,
  cameraId = "CAM-01",
  className,
}: VideoPanelProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl bg-surface border border-border overflow-hidden",
        className
      )}
    >
      {/* Video placeholder with grid pattern */}
      <div className="relative aspect-video bg-black grid-pattern">
        {/* Camera info overlay */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg bg-black/60 backdrop-blur-sm px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-danger animate-pulse" />
            <span className="text-sm font-medium text-white">LIVE</span>
          </div>
          <div className="rounded-lg bg-black/60 backdrop-blur-sm px-3 py-1.5">
            <span className="text-sm font-medium text-white">{cameraId}</span>
          </div>
        </div>

        {/* Timestamp overlay */}
        <div className="absolute top-4 right-4 rounded-lg bg-black/60 backdrop-blur-sm px-3 py-1.5">
          <span className="text-sm font-mono text-white">
            {new Date().toLocaleTimeString()}
          </span>
        </div>

        {/* Center video icon placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-surface/50 p-6">
            <Video className="h-12 w-12 text-muted" />
          </div>
        </div>

        {/* Threat detected overlay */}
        {showThreat && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center pointer-events-none">
            <div className="threat-alert rounded-lg bg-danger/80 backdrop-blur-sm px-8 py-4 shadow-glow-danger">
              <p className="text-2xl font-bold text-white tracking-wider">
                THREAT DETECTED
              </p>
            </div>
          </div>
        )}

        {/* Detection box placeholder */}
        {showThreat && (
          <div className="absolute left-1/4 top-1/4 w-32 h-48 border-2 border-danger rounded-lg animate-pulse">
            <div className="absolute -top-6 left-0 rounded bg-danger px-2 py-0.5">
              <span className="text-xs font-semibold text-white">
                gun 0.94
              </span>
            </div>
          </div>
        )}

        {/* Controls overlay */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          <button className="rounded-lg bg-black/60 backdrop-blur-sm p-2 text-white hover:bg-black/80 transition-colors">
            <Volume2 className="h-5 w-5" />
          </button>
          <button className="rounded-lg bg-black/60 backdrop-blur-sm p-2 text-white hover:bg-black/80 transition-colors">
            <Maximize2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Small camera thumbnail component
export function CameraThumbnail({
  cameraId,
  isActive = false,
}: {
  cameraId: string;
  isActive?: boolean;
}) {
  return (
    <button
      className={cn(
        "relative rounded-lg overflow-hidden border-2 transition-all",
        isActive
          ? "border-primary shadow-glow-sm"
          : "border-border hover:border-primary/50"
      )}
    >
      <div className="aspect-video w-full bg-black grid-pattern">
        <div className="absolute inset-0 flex items-center justify-center">
          <Video className="h-6 w-6 text-muted" />
        </div>
        <div className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5">
          <span className="text-xs font-medium text-white">{cameraId}</span>
        </div>
        {isActive && (
          <div className="absolute top-1 right-1">
            <span className="h-2 w-2 rounded-full bg-danger animate-pulse block" />
          </div>
        )}
      </div>
    </button>
  );
}
