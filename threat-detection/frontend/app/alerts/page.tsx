"use client";

import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { AlertItem } from "@/components/AlertItem";
import {
  clearSessionData,
  readSessionData,
  SessionData,
} from "@/lib/session-store";
import { AlertStatus } from "@/lib/types";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";

const statusFilters: { label: string; value: AlertStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Resolved", value: "resolved" },
];

export default function AlertsPage() {
  const [statusFilter, setStatusFilter] = useState<AlertStatus | "all">("all");
  const [sessionData, setSessionData] = useState<SessionData>({
    alerts: [],
    logs: [],
  });

  useEffect(() => {
    setSessionData(readSessionData());
  }, []);

  const filteredAlerts = useMemo(() => {
    return sessionData.alerts.filter((alert) => {
      if (statusFilter === "all") return true;
      return alert.status === statusFilter;
    });
  }, [sessionData.alerts, statusFilter]);

  const activeCount = sessionData.alerts.filter(
    (alert) => alert.status === "active"
  ).length;
  const resolvedCount = sessionData.alerts.filter(
    (alert) => alert.status === "resolved"
  ).length;

  return (
    <div className="min-h-screen">
      <Navbar title="Alerts" subtitle="Manage threat alerts" />

      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-sm text-muted">Total Alerts</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {sessionData.alerts.length}
            </p>
          </div>
          <div className="rounded-xl border border-danger/30 bg-danger/10 p-4">
            <p className="text-sm text-danger/80">Active</p>
            <p className="mt-1 text-2xl font-bold text-danger">{activeCount}</p>
          </div>
          <div className="rounded-xl border border-success/30 bg-success/10 p-4">
            <p className="text-sm text-success/80">Resolved</p>
            <p className="mt-1 text-2xl font-bold text-success">
              {resolvedCount}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted" />
            <span className="text-sm text-muted">Filter:</span>
            <div className="flex gap-2">
              {statusFilters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                    statusFilter === filter.value
                      ? "border border-primary/30 bg-primary/20 text-primary"
                      : "text-muted hover:bg-surface-light hover:text-white"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              clearSessionData();
              setSessionData(readSessionData());
            }}
            className="rounded-lg bg-surface-light px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-border"
          >
            Clear Session Data
          </button>
        </div>

        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface p-12 text-center">
              <p className="text-muted">
                No real alerts found. Run detection first to populate this page.
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <AlertItem key={alert.id} alert={alert} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
