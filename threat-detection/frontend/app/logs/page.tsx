"use client";

import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { readSessionData, SessionData } from "@/lib/session-store";
import { ThreatClass } from "@/lib/types";
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
  const [sessionData, setSessionData] = useState<SessionData>({
    alerts: [],
    logs: [],
  });

  useEffect(() => {
    setSessionData(readSessionData());
  }, []);

  const filteredLogs = useMemo(() => {
    return sessionData.logs.filter((log) => {
      if (classFilter === "all") return true;
      return log.class === classFilter;
    });
  }, [classFilter, sessionData.logs]);

  const exportCsv = () => {
    if (filteredLogs.length === 0) {
      return;
    }

    const csv = [
      ["timestamp", "class", "confidence", "source"].join(","),
      ...filteredLogs.map((log) =>
        [
          log.timestamp.toISOString(),
          log.class,
          log.confidence.toFixed(4),
          log.source,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "threatscan-logs.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen">
      <Navbar title="Detection Logs" subtitle="Historical detection records" />

      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-surface-light"
            >
              <Filter className="h-4 w-4 text-muted" />
              {classFilters.find((filter) => filter.value === classFilter)?.label}
              <ChevronDown className="h-4 w-4 text-muted" />
            </button>

            {isFilterOpen && (
              <div className="absolute left-0 top-full z-10 mt-2 w-48 rounded-lg border border-border bg-surface shadow-lg">
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

          <button
            onClick={exportCsv}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/20 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-light">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                  Timestamp
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                  Class
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">
                  Confidence
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">
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
                    className="transition-colors hover:bg-surface-light/50"
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {formatTimestamp(log.timestamp)}
                        </p>
                        <p className="text-xs text-muted">
                          {formatDate(log.timestamp)}
                        </p>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {log.class === "gun"
                            ? "🔫"
                            : log.class === "knife"
                              ? "🔪"
                              : "⚠️"}
                        </span>
                        <span className="text-sm font-medium capitalize text-white">
                          {log.class}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-surface-light">
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
                    <td className="whitespace-nowrap px-6 py-4">
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
              <p className="text-muted">
                No real logs found. Run detection first to populate this page.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">
            Showing {filteredLogs.length} of {sessionData.logs.length} entries
          </p>
          <div className="flex gap-2">
            <button className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-light hover:text-white">
              Previous
            </button>
            <button className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-light hover:text-white">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
