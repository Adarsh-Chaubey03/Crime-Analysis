"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { mockLogs, ThreatClass } from "@/lib/mock-data";
import { formatTimestamp, formatDate, cn } from "@/lib/utils";
import { Filter, Download, ChevronDown } from "lucide-react";

const classFilters: { label: string; value: ThreatClass | "all" }[] = [
  { label: "All Classes", value: "all" },
  { label: "Gun", value: "gun" },
  { label: "Knife", value: "knife" },
];

export default function LogsPage() {
  const [classFilter, setClassFilter] = useState<ThreatClass | "all">("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filteredLogs = mockLogs.filter((log) => {
    if (classFilter === "all") return true;
    return log.class === classFilter;
  });

  return (
    <div className="min-h-screen">
      <Navbar title="Detection Logs" subtitle="Historical detection records" />

      <div className="p-6 space-y-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 rounded-lg bg-surface border border-border px-4 py-2.5 text-sm font-medium text-white hover:bg-surface-light transition-colors"
            >
              <Filter className="h-4 w-4 text-muted" />
              {classFilters.find((f) => f.value === classFilter)?.label}
              <ChevronDown className="h-4 w-4 text-muted" />
            </button>

            {isFilterOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 rounded-lg bg-surface border border-border shadow-lg z-10">
                {classFilters.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => {
                      setClassFilter(filter.value);
                      setIsFilterOpen(false);
                    }}
                    className={cn(
                      "w-full px-4 py-2.5 text-left text-sm transition-colors",
                      classFilter === filter.value
                        ? "bg-primary/10 text-primary"
                        : "text-white hover:bg-surface-light"
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export Button */}
          <button className="flex items-center gap-2 rounded-lg bg-primary/20 border border-primary/30 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/30 transition-colors">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>

        {/* Logs Table */}
        <div className="rounded-xl bg-surface border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-light">
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                  Confidence
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                  Source
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLogs.map((log) => {
                const isHighConfidence = log.confidence > 0.85;

                return (
                  <tr
                    key={log.id}
                    className="hover:bg-surface-light/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {formatTimestamp(log.timestamp)}
                        </p>
                        <p className="text-xs text-muted">
                          {formatDate(log.timestamp)}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {log.class === "gun" ? "🔫" : "🔪"}
                        </span>
                        <span className="text-sm font-medium text-white capitalize">
                          {log.class}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 rounded-full bg-surface-light overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              isHighConfidence ? "bg-danger" : "bg-warning"
                            )}
                            style={{ width: `${log.confidence * 100}%` }}
                          />
                        </div>
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            isHighConfidence ? "text-danger" : "text-warning"
                          )}
                        >
                          {(log.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-md bg-surface-light px-2.5 py-1 text-xs font-medium text-white">
                        {log.source}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredLogs.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-muted">No logs found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">
            Showing {filteredLogs.length} of {mockLogs.length} entries
          </p>
          <div className="flex gap-2">
            <button className="rounded-lg bg-surface border border-border px-4 py-2 text-sm font-medium text-muted hover:text-white hover:bg-surface-light transition-colors">
              Previous
            </button>
            <button className="rounded-lg bg-surface border border-border px-4 py-2 text-sm font-medium text-muted hover:text-white hover:bg-surface-light transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
