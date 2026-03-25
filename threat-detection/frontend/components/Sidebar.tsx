"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Video,
  AlertTriangle,
  FileText,
  Shield,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/live-monitor", label: "Live Monitor", icon: Video },
  { href: "/alerts", label: "Alerts", icon: AlertTriangle },
  { href: "/logs", label: "Logs", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-surface border-r border-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/30">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">ThreatScan</h1>
            <p className="text-xs text-primary">AI Security</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary border border-primary/30 shadow-glow-sm"
                        : "text-muted hover:text-white hover:bg-surface-light"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Status */}
        <div className="border-t border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Activity className="h-5 w-5 text-success" />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-success animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">System Active</p>
              <p className="text-xs text-muted">All cameras online</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
