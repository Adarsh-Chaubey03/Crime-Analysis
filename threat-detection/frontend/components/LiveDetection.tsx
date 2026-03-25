"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Scan, AlertTriangle, CheckCircle, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

interface Detection {
  class_name: string;
  confidence: number;
  box: number[];
}

interface DetectionResponse {
  detections: Detection[];
  count: number;
}

type Status = "idle" | "loading" | "success" | "error";

// =============================================================================
// CONFIG
// =============================================================================

const API_URL = "http://localhost:8000";
const THREAT_THRESHOLD = 0.6;

// =============================================================================
// COMPONENT
// =============================================================================

export function LiveDetection() {
  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Computed
  const hasThreat = detections.some((d) => d.confidence > THREAT_THRESHOLD);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setDetections([]);
    setStatus("idle");
    setError(null);
  }, []);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleClear = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setDetections([]);
    setStatus("idle");
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleDetect = useCallback(async () => {
    if (!selectedFile) return;

    setStatus("loading");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(`${API_URL}/detect`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const data: DetectionResponse = await response.json();
      setDetections(data.detections);
      setStatus("success");

      // Draw bounding boxes
      drawDetections(data.detections);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Detection failed");
      setStatus("error");
    }
  }, [selectedFile]);

  // ==========================================================================
  // DRAWING
  // ==========================================================================

  const drawDetections = useCallback((detections: Detection[]) => {
    const canvas = canvasRef.current;
    const image = imageRef.current;

    if (!canvas || !image) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match image
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each detection
    detections.forEach((det) => {
      const [x1, y1, x2, y2] = det.box;
      const width = x2 - x1;
      const height = y2 - y1;

      const isHighConfidence = det.confidence > THREAT_THRESHOLD;
      const color = isHighConfidence ? "#ef4444" : "#f59e0b";

      // Draw box
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(x1, y1, width, height);

      // Draw label background
      const label = `${det.class_name} ${(det.confidence * 100).toFixed(1)}%`;
      ctx.font = "bold 16px sans-serif";
      const textMetrics = ctx.measureText(label);
      const textHeight = 20;
      const padding = 6;

      ctx.fillStyle = color;
      ctx.fillRect(
        x1,
        y1 - textHeight - padding * 2,
        textMetrics.width + padding * 2,
        textHeight + padding * 2
      );

      // Draw label text
      ctx.fillStyle = "#ffffff";
      ctx.fillText(label, x1 + padding, y1 - padding - 4);
    });
  }, []);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="rounded-xl bg-surface border border-border p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Upload Image</h2>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!previewUrl ? (
          <button
            onClick={handleUploadClick}
            className="w-full rounded-xl border-2 border-dashed border-border hover:border-primary/50 p-12 transition-colors group"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-surface-light p-4 group-hover:bg-primary/10 transition-colors">
                <Upload className="h-8 w-8 text-muted group-hover:text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white">
                  Click to upload image
                </p>
                <p className="text-xs text-muted mt-1">
                  JPEG, PNG, WebP supported
                </p>
              </div>
            </div>
          </button>
        ) : (
          <div className="space-y-4">
            {/* Image Preview with Canvas Overlay */}
            <div className="relative rounded-lg overflow-hidden bg-black">
              <img
                ref={imageRef}
                src={previewUrl}
                alt="Preview"
                className="w-full h-auto max-h-[500px] object-contain"
                onLoad={() => {
                  if (detections.length > 0) {
                    drawDetections(detections);
                  }
                }}
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ objectFit: "contain" }}
              />

              {/* Clear button */}
              <button
                onClick={handleClear}
                className="absolute top-2 right-2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleUploadClick}
                className="flex-1 rounded-lg bg-surface-light border border-border py-3 text-sm font-medium text-white hover:bg-border transition-colors"
              >
                Change Image
              </button>
              <button
                onClick={handleDetect}
                disabled={status === "loading"}
                className={cn(
                  "flex-1 rounded-lg py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2",
                  status === "loading"
                    ? "bg-primary/50 text-white/70 cursor-not-allowed"
                    : "bg-primary text-white hover:bg-primary/90"
                )}
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Detecting...
                  </>
                ) : (
                  <>
                    <Scan className="h-4 w-4" />
                    Detect Threats
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Alert Banner */}
      {status === "success" && (
        <div
          className={cn(
            "rounded-xl p-6 border",
            hasThreat
              ? "bg-danger/10 border-danger/30 shadow-glow-danger"
              : "bg-success/10 border-success/30"
          )}
        >
          <div className="flex items-center gap-4">
            {hasThreat ? (
              <>
                <div className="rounded-full bg-danger/20 p-3">
                  <AlertTriangle className="h-8 w-8 text-danger" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-danger">
                    THREAT DETECTED
                  </h3>
                  <p className="text-sm text-danger/80 mt-1">
                    {detections.filter((d) => d.confidence > THREAT_THRESHOLD).length} high-confidence detection(s) found
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-full bg-success/20 p-3">
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-success">
                    No Threat Detected
                  </h3>
                  <p className="text-sm text-success/80 mt-1">
                    {detections.length === 0
                      ? "No objects detected in image"
                      : "All detections below threat threshold"}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {status === "error" && error && (
        <div className="rounded-xl bg-danger/10 border border-danger/30 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-danger" />
            <p className="text-sm text-danger">{error}</p>
          </div>
        </div>
      )}

      {/* Detection Results */}
      {status === "success" && detections.length > 0 && (
        <div className="rounded-xl bg-surface border border-border p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Detection Results ({detections.length})
          </h2>

          <div className="space-y-3">
            {detections.map((det, index) => {
              const isHighConfidence = det.confidence > THREAT_THRESHOLD;

              return (
                <div
                  key={index}
                  className={cn(
                    "rounded-lg p-4 border",
                    isHighConfidence
                      ? "bg-danger/5 border-danger/30"
                      : "bg-surface-light border-border"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {det.class_name === "gun" ? "🔫" : "🔪"}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white capitalize">
                          {det.class_name}
                        </p>
                        <p className="text-xs text-muted">
                          Box: [{det.box.join(", ")}]
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={cn(
                          "text-lg font-bold",
                          isHighConfidence ? "text-danger" : "text-warning"
                        )}
                      >
                        {(det.confidence * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted">confidence</p>
                    </div>
                  </div>

                  {/* Confidence bar */}
                  <div className="mt-3">
                    <div className="h-2 rounded-full bg-surface overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          isHighConfidence ? "bg-danger" : "bg-warning"
                        )}
                        style={{ width: `${det.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
