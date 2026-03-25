"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { VideoPanel, CameraThumbnail } from "@/components/VideoPanel";
import { LiveDetection } from "@/components/LiveDetection";
import { AlertItem } from "@/components/AlertItem";
import { mockLiveAlerts } from "@/lib/mock-data";
import { Video, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

type TabType = "camera" | "upload";

export default function LiveMonitorPage() {
  const [activeTab, setActiveTab] = useState<TabType>("upload");

  return (
    <div className="min-h-screen">
      <Navbar title="Live Monitor" subtitle="Real-time threat detection" />

      <div className="p-6">
        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("camera")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
              activeTab === "camera"
                ? "bg-primary/20 text-primary border border-primary/30"
                : "text-muted hover:text-white hover:bg-surface-light"
            )}
          >
            <Video className="h-4 w-4" />
            Live Camera
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
              activeTab === "upload"
                ? "bg-primary/20 text-primary border border-primary/30"
                : "text-muted hover:text-white hover:bg-surface-light"
            )}
          >
            <Upload className="h-4 w-4" />
            Image Upload
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === "camera" ? (
              <div className="space-y-4">
                <VideoPanel showThreat={true} cameraId="CAM-01" />

                {/* Camera Thumbnails */}
                <div className="grid grid-cols-4 gap-4">
                  <CameraThumbnail cameraId="CAM-01" isActive={true} />
                  <CameraThumbnail cameraId="CAM-02" />
                  <CameraThumbnail cameraId="CAM-03" />
                  <CameraThumbnail cameraId="CAM-04" />
                </div>
              </div>
            ) : (
              <LiveDetection />
            )}
          </div>

          {/* Side Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 rounded-xl bg-surface border border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">
                  Recent Alerts
                </h2>
                <span className="flex items-center gap-1.5 text-xs text-danger">
                  <span className="h-2 w-2 rounded-full bg-danger animate-pulse" />
                  {mockLiveAlerts.filter((a) => a.status === "active").length}{" "}
                  active
                </span>
              </div>

              <div className="space-y-3">
                {mockLiveAlerts.map((alert) => (
                  <AlertItem key={alert.id} alert={alert} compact />
                ))}
              </div>

              {/* Detection Stats */}
              <div className="mt-6 pt-4 border-t border-border">
                <h3 className="text-sm font-medium text-muted mb-3">
                  Session Stats
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-surface-light p-3 text-center">
                    <p className="text-2xl font-bold text-white">12</p>
                    <p className="text-xs text-muted">Detections</p>
                  </div>
                  <div className="rounded-lg bg-surface-light p-3 text-center">
                    <p className="text-2xl font-bold text-primary">89%</p>
                    <p className="text-xs text-muted">Avg Conf.</p>
                  </div>
                </div>
              </div>

              {/* API Status */}
              <div className="mt-6 pt-4 border-t border-border">
                <h3 className="text-sm font-medium text-muted mb-3">
                  Backend Status
                </h3>
                <div className="flex items-center gap-2 rounded-lg bg-success/10 border border-success/30 p-3">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  <span className="text-sm text-success">API Connected</span>
                </div>
                <p className="text-xs text-muted mt-2">
                  localhost:8000
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
