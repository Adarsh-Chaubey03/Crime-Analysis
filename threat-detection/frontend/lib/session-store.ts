import {
  Alert,
  Detection,
  DetectionSource,
  LogEntry,
  Stats,
} from "@/lib/types";

const STORAGE_KEY = "threatscan-session-data";
const MAX_ALERTS = 50;
const MAX_LOGS = 200;

interface StoredAlert extends Omit<Alert, "timestamp"> {
  timestamp: string;
}

interface StoredLogEntry extends Omit<LogEntry, "timestamp"> {
  timestamp: string;
}

interface StoredSessionData {
  alerts: StoredAlert[];
  logs: StoredLogEntry[];
}

export interface SessionData {
  alerts: Alert[];
  logs: LogEntry[];
}

const EMPTY_SESSION: SessionData = {
  alerts: [],
  logs: [],
};

function serialize(data: SessionData): StoredSessionData {
  return {
    alerts: data.alerts.map((alert) => ({
      ...alert,
      timestamp: alert.timestamp.toISOString(),
    })),
    logs: data.logs.map((log) => ({
      ...log,
      timestamp: log.timestamp.toISOString(),
    })),
  };
}

function deserialize(data: StoredSessionData): SessionData {
  return {
    alerts: data.alerts.map((alert) => ({
      ...alert,
      timestamp: new Date(alert.timestamp),
    })),
    logs: data.logs.map((log) => ({
      ...log,
      timestamp: new Date(log.timestamp),
    })),
  };
}

export function readSessionData(): SessionData {
  if (typeof window === "undefined") {
    return EMPTY_SESSION;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return EMPTY_SESSION;
  }

  try {
    return deserialize(JSON.parse(raw) as StoredSessionData);
  } catch {
    return EMPTY_SESSION;
  }
}

function writeSessionData(data: SessionData) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serialize(data)));
}

export function appendSessionDetections(
  detections: Detection[],
  source: DetectionSource
): SessionData {
  const existing = readSessionData();

  if (detections.length === 0) {
    return existing;
  }

  const timestamp = Date.now();
  const camera = source === "webcam" ? "WEBCAM" : "UPLOAD";

  const nextAlerts: Alert[] = detections.map((detection, index) => ({
    id: `${timestamp}-alert-${index}`,
    class: detection.class_name,
    confidence: detection.confidence,
    timestamp: new Date(timestamp + index),
    status: "active",
    camera,
    source,
  }));

  const nextLogs: LogEntry[] = detections.map((detection, index) => ({
    id: `${timestamp}-log-${index}`,
    class: detection.class_name,
    confidence: detection.confidence,
    timestamp: new Date(timestamp + index),
    source: camera,
  }));

  const updated: SessionData = {
    alerts: [...nextAlerts, ...existing.alerts].slice(0, MAX_ALERTS),
    logs: [...nextLogs, ...existing.logs].slice(0, MAX_LOGS),
  };

  writeSessionData(updated);
  return updated;
}

export function clearSessionData() {
  writeSessionData(EMPTY_SESSION);
}

export function getSessionStats(data: SessionData): Stats {
  const totalDetections = data.logs.length;
  const totalConfidence = data.logs.reduce((sum, log) => sum + log.confidence, 0);

  return {
    totalDetections,
    avgConfidence:
      totalDetections === 0 ? 0 : totalConfidence / totalDetections,
    activeAlerts: data.alerts.filter((alert) => alert.status === "active")
      .length,
  };
}
