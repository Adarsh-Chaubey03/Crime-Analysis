import { Navbar } from "@/components/Navbar";
import { VideoPanel, CameraThumbnail } from "@/components/VideoPanel";
import { AlertItem } from "@/components/AlertItem";
import { mockLiveAlerts } from "@/lib/mock-data";

export default function LiveMonitorPage() {
  return (
    <div className="min-h-screen">
      <Navbar title="Live Monitor" subtitle="Real-time camera feed" />

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Video Panel */}
          <div className="lg:col-span-3 space-y-4">
            <VideoPanel showThreat={true} cameraId="CAM-01" />

            {/* Camera Thumbnails */}
            <div className="grid grid-cols-4 gap-4">
              <CameraThumbnail cameraId="CAM-01" isActive={true} />
              <CameraThumbnail cameraId="CAM-02" />
              <CameraThumbnail cameraId="CAM-03" />
              <CameraThumbnail cameraId="CAM-04" />
            </div>
          </div>

          {/* Live Alerts Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 rounded-xl bg-surface border border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">
                  Live Alerts
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

              {/* Controls */}
              <div className="mt-6 pt-4 border-t border-border">
                <button className="w-full rounded-lg bg-danger/20 border border-danger/30 py-2.5 text-sm font-medium text-danger hover:bg-danger/30 transition-colors">
                  Pause Detection
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
