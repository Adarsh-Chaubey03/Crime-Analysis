export type ThreatClass = "gun" | "knife";
export type AlertStatus = "active" | "resolved";

export interface Alert {
  id: string;
  class: ThreatClass;
  confidence: number;
  timestamp: Date;
  status: AlertStatus;
  camera: string;
}

export interface LogEntry {
  id: string;
  class: ThreatClass;
  confidence: number;
  timestamp: Date;
  source: string;
}

export interface Stats {
  totalDetections: number;
  avgConfidence: number;
  activeAlerts: number;
  camerasOnline: number;
}

// Mock stats
export const mockStats: Stats = {
  totalDetections: 247,
  avgConfidence: 0.847,
  activeAlerts: 3,
  camerasOnline: 4,
};

// Mock alerts
export const mockAlerts: Alert[] = [
  {
    id: "alert-001",
    class: "gun",
    confidence: 0.94,
    timestamp: new Date(Date.now() - 1000 * 60 * 2),
    status: "active",
    camera: "CAM-01",
  },
  {
    id: "alert-002",
    class: "knife",
    confidence: 0.87,
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    status: "active",
    camera: "CAM-03",
  },
  {
    id: "alert-003",
    class: "gun",
    confidence: 0.91,
    timestamp: new Date(Date.now() - 1000 * 60 * 8),
    status: "active",
    camera: "CAM-02",
  },
  {
    id: "alert-004",
    class: "knife",
    confidence: 0.78,
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    status: "resolved",
    camera: "CAM-01",
  },
  {
    id: "alert-005",
    class: "gun",
    confidence: 0.82,
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    status: "resolved",
    camera: "CAM-04",
  },
];

// Mock logs
export const mockLogs: LogEntry[] = [
  {
    id: "log-001",
    class: "gun",
    confidence: 0.94,
    timestamp: new Date(Date.now() - 1000 * 60 * 2),
    source: "CAM-01",
  },
  {
    id: "log-002",
    class: "knife",
    confidence: 0.87,
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    source: "CAM-03",
  },
  {
    id: "log-003",
    class: "gun",
    confidence: 0.91,
    timestamp: new Date(Date.now() - 1000 * 60 * 8),
    source: "CAM-02",
  },
  {
    id: "log-004",
    class: "knife",
    confidence: 0.78,
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    source: "CAM-01",
  },
  {
    id: "log-005",
    class: "gun",
    confidence: 0.82,
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    source: "CAM-04",
  },
  {
    id: "log-006",
    class: "gun",
    confidence: 0.89,
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    source: "CAM-02",
  },
  {
    id: "log-007",
    class: "knife",
    confidence: 0.73,
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    source: "CAM-03",
  },
  {
    id: "log-008",
    class: "gun",
    confidence: 0.95,
    timestamp: new Date(Date.now() - 1000 * 60 * 90),
    source: "CAM-01",
  },
];

// Live alerts for monitor page
export const mockLiveAlerts: Alert[] = [
  {
    id: "live-001",
    class: "gun",
    confidence: 0.94,
    timestamp: new Date(),
    status: "active",
    camera: "CAM-01",
  },
  {
    id: "live-002",
    class: "knife",
    confidence: 0.87,
    timestamp: new Date(Date.now() - 1000 * 30),
    status: "active",
    camera: "CAM-01",
  },
  {
    id: "live-003",
    class: "gun",
    confidence: 0.78,
    timestamp: new Date(Date.now() - 1000 * 60),
    status: "active",
    camera: "CAM-01",
  },
];
