export type ThreatClass = string;
export type AlertStatus = "active" | "resolved";
export type DetectionSource = "webcam" | "upload";

export interface Detection {
  class_name: string;
  confidence: number;
  box: number[];
}

export interface Alert {
  id: string;
  class: ThreatClass;
  confidence: number;
  timestamp: Date;
  status: AlertStatus;
  camera: string;
  source: DetectionSource;
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
}

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
  device: string;
}
