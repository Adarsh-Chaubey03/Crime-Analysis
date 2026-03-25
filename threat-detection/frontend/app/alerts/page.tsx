"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { AlertItem } from "@/components/AlertItem";
import { mockAlerts, AlertStatus } from "@/lib/mock-data";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";

const statusFilters: { label: string; value: AlertStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Resolved", value: "resolved" },
];

export default function AlertsPage() {
  const [statusFilter, setStatusFilter] = useState<AlertStatus | "all">("all");

  const filteredAlerts = mockAlerts.filter((alert) => {
    if (statusFilter === "all") return true;
    return alert.status === statusFilter;
  });

  const activeCount = mockAlerts.filter((a) => a.status === "active").length;
  const resolvedCount = mockAlerts.filter(
    (a) => a.status === "resolved"
  ).length;

  return (
    <div className="min-h-screen">
      <Navbar title="Alerts" subtitle="Manage threat alerts" />

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl bg-surface border border-border p-4">
            <p className="text-sm text-muted">Total Alerts</p>
            <p className="text-2xl font-bold text-white mt-1">
              {mockAlerts.length}
            </p>
          </div>
          <div className="rounded-xl bg-danger/10 border border-danger/30 p-4">
            <p className="text-sm text-danger/80">Active</p>
            <p className="text-2xl font-bold text-danger mt-1">{activeCount}</p>
          </div>
          <div className="rounded-xl bg-success/10 border border-success/30 p-4">
            <p className="text-sm text-success/80">Resolved</p>
            <p className="text-2xl font-bold text-success mt-1">
              {resolvedCount}
            </p>
          </div>
        </div>

        {/* Filter Bar */}
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
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "text-muted hover:text-white hover:bg-surface-light"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <button className="rounded-lg bg-surface-light px-4 py-2 text-sm font-medium text-white hover:bg-border transition-colors">
            Clear All Resolved
          </button>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <div className="rounded-xl bg-surface border border-border p-12 text-center">
              <p className="text-muted">No alerts found</p>
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
