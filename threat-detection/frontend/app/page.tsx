"use client";

import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { StatCard } from "@/components/StatCard";
import { AlertItem } from "@/components/AlertItem";
import { API_URL } from "@/lib/api";
import {
  getSessionStats,
  readSessionData,
  SessionData,
} from "@/lib/session-store";
import { HealthResponse } from "@/lib/types";
import {
  Crosshair,
  Percent,
  AlertTriangle,
  Cpu,
  Activity,
  Database,
  ShieldCheck,
  Server,
} from "lucide-react";

export default function DashboardPage() {
  const [sessionData, setSessionData] = useState<SessionData>({
    alerts: [],
    logs: [],
  });
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    setSessionData(readSessionData());
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadHealth = async () => {
      try {
        const response = await fetch(`${API_URL}/health`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data: HealthResponse = await response.json();
        if (isActive) {
          setHealth(data);
        }
      } catch {
        if (isActive) {
          setHealth(null);
        }
      }
    };

    loadHealth();

    return () => {
      isActive = false;
    };
  }, []);

  const stats = getSessionStats(sessionData);
  const recentAlerts = sessionData.alerts.slice(0, 3);
  const detectionSummary = useMemo(() => {
    return sessionData.logs.reduce<Record<string, number>>((summary, log) => {
      summary[log.class] = (summary[log.class] ?? 0) + 1;
      return summary;
    }, {});
  }, [sessionData.logs]);

  const totalSummary = Object.values(detectionSummary).reduce(
    (sum, count) => sum + count,
    0
  );

  return (
    <div className="min-h-screen">
      <Navbar title="Dashboard" subtitle="System overview and statistics" />

      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Detections"
            value={stats.totalDetections}
            icon={Crosshair}
          />
          <StatCard
            title="Avg Confidence"
            value={
              stats.totalDetections === 0
                ? "--"
                : `${(stats.avgConfidence * 100).toFixed(1)}%`
            }
            icon={Percent}
          />
          <StatCard
            title="Active Alerts"
            value={stats.activeAlerts}
            icon={AlertTriangle}
            variant="danger"
          />
          <StatCard
            title="Inference Device"
            value={health?.device ?? "--"}
            icon={Cpu}
            variant={health?.model_loaded ? "success" : "default"}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface p-6 lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                Recent Alerts
              </h2>
              <a href="/alerts" className="text-sm text-primary hover:underline">
                View all
              </a>
            </div>
            <div className="space-y-4">
              {recentAlerts.length === 0 ? (
                <div className="rounded-xl border border-border bg-surface-light p-6 text-sm text-muted">
                  No real alerts recorded yet. Start a live or upload detection
                  session to populate the dashboard.
                </div>
              ) : (
                recentAlerts.map((alert) => (
                  <AlertItem key={alert.id} alert={alert} />
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-6">
            <h2 className="mb-6 text-lg font-semibold text-white">
              Detection Summary
            </h2>
            <div className="space-y-6">
              {totalSummary === 0 ? (
                <p className="text-sm text-muted">
                  No real detection history available yet.
                </p>
              ) : (
                Object.entries(detectionSummary).map(([label, count]) => (
                  <div key={label}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium capitalize text-white">
                        {label}
                      </span>
                      <span className="text-sm font-semibold text-white">
                        {count}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-light">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(count / totalSummary) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}

              <div className="border-t border-border pt-4">
                <div className="flex items-center gap-2 text-muted">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-sm">
                    {health?.model_loaded
                      ? "Model loaded and ready for inference"
                      : "Backend model status unavailable"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="mb-6 text-lg font-semibold text-white">
            System Status
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-lg bg-surface-light p-4">
              <div className="mb-3 flex items-center gap-2 text-white">
                <Server className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">API</span>
              </div>
              <p className="text-sm text-muted">
                {health?.status === "ok" ? "Online" : "Offline"}
              </p>
            </div>
            <div className="rounded-lg bg-surface-light p-4">
              <div className="mb-3 flex items-center gap-2 text-white">
                <Activity className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Model</span>
              </div>
              <p className="text-sm text-muted">
                {health?.model_loaded ? "Loaded" : "Not loaded"}
              </p>
            </div>
            <div className="rounded-lg bg-surface-light p-4">
              <div className="mb-3 flex items-center gap-2 text-white">
                <Database className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Session Records</span>
              </div>
              <p className="text-sm text-muted">{sessionData.logs.length} stored</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
