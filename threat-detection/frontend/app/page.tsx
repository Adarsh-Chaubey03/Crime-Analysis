import { Navbar } from "@/components/Navbar";
import { StatCard } from "@/components/StatCard";
import { AlertItem } from "@/components/AlertItem";
import { mockStats, mockAlerts } from "@/lib/mock-data";
import {
  Crosshair,
  Percent,
  AlertTriangle,
  Camera,
  TrendingUp,
} from "lucide-react";

export default function DashboardPage() {
  const recentAlerts = mockAlerts.slice(0, 3);

  return (
    <div className="min-h-screen">
      <Navbar title="Dashboard" subtitle="System overview and statistics" />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Detections"
            value={mockStats.totalDetections}
            icon={Crosshair}
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Avg Confidence"
            value={`${(mockStats.avgConfidence * 100).toFixed(1)}%`}
            icon={Percent}
            trend={{ value: 3, isPositive: true }}
          />
          <StatCard
            title="Active Alerts"
            value={mockStats.activeAlerts}
            icon={AlertTriangle}
            variant="danger"
          />
          <StatCard
            title="Cameras Online"
            value={`${mockStats.camerasOnline}/4`}
            icon={Camera}
            variant="success"
          />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Alerts */}
          <div className="lg:col-span-2 rounded-xl bg-surface border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">
                Recent Alerts
              </h2>
              <a
                href="/alerts"
                className="text-sm text-primary hover:underline"
              >
                View all
              </a>
            </div>
            <div className="space-y-4">
              {recentAlerts.map((alert) => (
                <AlertItem key={alert.id} alert={alert} />
              ))}
            </div>
          </div>

          {/* Detection Summary */}
          <div className="rounded-xl bg-surface border border-border p-6">
            <h2 className="text-lg font-semibold text-white mb-6">
              Detection Summary
            </h2>
            <div className="space-y-6">
              {/* Gun detections */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔫</span>
                    <span className="text-sm font-medium text-white">Gun</span>
                  </div>
                  <span className="text-sm font-semibold text-white">156</span>
                </div>
                <div className="h-2 rounded-full bg-surface-light overflow-hidden">
                  <div
                    className="h-full rounded-full bg-danger"
                    style={{ width: "63%" }}
                  />
                </div>
              </div>

              {/* Knife detections */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔪</span>
                    <span className="text-sm font-medium text-white">
                      Knife
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-white">91</span>
                </div>
                <div className="h-2 rounded-full bg-surface-light overflow-hidden">
                  <div
                    className="h-full rounded-full bg-warning"
                    style={{ width: "37%" }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-success">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    98.2% detection accuracy
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="rounded-xl bg-surface border border-border p-6">
          <h2 className="text-lg font-semibold text-white mb-6">
            System Status
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {["CAM-01", "CAM-02", "CAM-03", "CAM-04"].map((cam, i) => (
              <div
                key={cam}
                className="flex items-center gap-3 rounded-lg bg-surface-light p-4"
              >
                <div className="relative">
                  <Camera className="h-8 w-8 text-primary" />
                  <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-success border-2 border-surface-light" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{cam}</p>
                  <p className="text-xs text-muted">Online • 30 FPS</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
