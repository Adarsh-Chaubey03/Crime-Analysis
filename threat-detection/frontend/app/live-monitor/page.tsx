"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { LiveDetection } from "@/components/LiveDetection";
import { AlertItem } from "@/components/AlertItem";
import { API_URL } from "@/lib/api";
import {
  appendSessionDetections,
  getSessionStats,
  readSessionData,
  SessionData,
} from "@/lib/session-store";
import { Detection, DetectionSource, HealthResponse } from "@/lib/types";

export default function LiveMonitorPage() {
  const [sessionData, setSessionData] = useState<SessionData>({
    alerts: [],
    logs: [],
  });
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const lastEventRef = useRef({ signature: "", timestamp: 0 });

  const stats = getSessionStats(sessionData);
  const recentAlerts = sessionData.alerts.slice(0, 5);

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

        if (!isActive) return;

        setHealth(data);
        setHealthError(null);
      } catch (error) {
        if (!isActive) return;

        setHealth(null);
        setHealthError(
          error instanceof Error ? error.message : "Backend unavailable"
        );
      }
    };

    loadHealth();
    const interval = window.setInterval(loadHealth, 5000);

    return () => {
      isActive = false;
      window.clearInterval(interval);
    };
  }, []);

  const handleDetectionsCaptured = useCallback(
    (detections: Detection[], source: DetectionSource) => {
      if (detections.length === 0) {
        return;
      }

      const signature = detections
        .map(
          (detection) =>
            `${detection.class_name}:${detection.confidence.toFixed(2)}:${detection.box.join(",")}`
        )
        .join("|");
      const now = Date.now();

      if (
        source === "webcam" &&
        signature === lastEventRef.current.signature &&
        now - lastEventRef.current.timestamp < 2500
      ) {
        return;
      }

      lastEventRef.current = { signature, timestamp: now };
      setSessionData(appendSessionDetections(detections, source));
    },
    []
  );

  const isBackendReady = health?.status === "ok" && health.model_loaded;

  return (
    <div className="min-h-screen">
      <Navbar title="Live Monitor" subtitle="Real-time threat detection" />

      <div className="p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <LiveDetection onDetectionsCaptured={handleDetectionsCaptured} />
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-20 rounded-xl border border-border bg-surface p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  Recent Alerts
                </h2>
                <span className="text-xs text-muted">
                  {stats.activeAlerts > 0
                    ? `${stats.activeAlerts} active`
                    : "No active alerts"}
                </span>
              </div>

              <div className="space-y-3">
                {recentAlerts.length === 0 ? (
                  <div className="rounded-lg border border-border bg-surface-light p-4 text-sm text-muted">
                    No real alerts yet. Run a live webcam or upload detection to
                    populate this panel.
                  </div>
                ) : (
                  recentAlerts.map((alert) => (
                    <AlertItem key={alert.id} alert={alert} compact />
                  ))
                )}
              </div>

              <div className="mt-6 border-t border-border pt-4">
                <h3 className="mb-3 text-sm font-medium text-muted">
                  Session Stats
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-surface-light p-3 text-center">
                    <p className="text-2xl font-bold text-white">
                      {stats.totalDetections}
                    </p>
                    <p className="text-xs text-muted">Detections</p>
                  </div>
                  <div className="rounded-lg bg-surface-light p-3 text-center">
                    <p className="text-2xl font-bold text-primary">
                      {stats.totalDetections === 0
                        ? "--"
                        : `${(stats.avgConfidence * 100).toFixed(0)}%`}
                    </p>
                    <p className="text-xs text-muted">Avg Conf.</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-border pt-4">
                <h3 className="mb-3 text-sm font-medium text-muted">
                  Backend Status
                </h3>
                <div
                  className={`rounded-lg border p-3 ${
                    isBackendReady
                      ? "border-success/30 bg-success/10"
                      : "border-danger/30 bg-danger/10"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isBackendReady ? "bg-success" : "bg-danger"
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        isBackendReady ? "text-success" : "text-danger"
                      }`}
                    >
                      {isBackendReady
                        ? `Connected (${health?.device ?? "unknown"})`
                        : "Disconnected"}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted">
                  {healthError ?? API_URL}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
