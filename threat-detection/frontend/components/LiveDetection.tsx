"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload,
  Scan,
  AlertTriangle,
  CheckCircle,
  Loader2,
  X,
  Video,
  VideoOff,
  Camera,
} from "lucide-react";
import { API_URL } from "@/lib/api";
import { Detection, DetectionSource } from "@/lib/types";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

interface DetectionResponse {
  detections: Detection[];
  count: number;
}

type Status = "idle" | "loading" | "success" | "error";
type Mode = "upload" | "webcam";

// =============================================================================
// CONFIG
// =============================================================================

const THREAT_THRESHOLD = 0.6;
const RENDER_THRESHOLD = 0.5;
const CAPTURE_INTERVAL_MS = 800;
const CAPTURE_SIZE = 320;

// =============================================================================
// COMPONENT
// =============================================================================

interface LiveDetectionProps {
  onDetectionsCaptured?: (
    detections: Detection[],
    source: DetectionSource
  ) => void;
}

export function LiveDetection({
  onDetectionsCaptured,
}: LiveDetectionProps = {}) {
  // Mode state
  const [mode, setMode] = useState<Mode>("webcam");

  // Upload mode state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Shared state
  const [detections, setDetections] = useState<Detection[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  // Webcam state
  const [isStreaming, setIsStreaming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [frameCount, setFrameCount] = useState(0);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Webcam refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);

  // Computed
  const hasThreat = detections.some((d) => d.confidence > THREAT_THRESHOLD);

  // ==========================================================================
  // WEBCAM FUNCTIONS
  // ==========================================================================

  const startWebcam = useCallback(async () => {
    try {
      setError(null);
      setStatus("loading");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "environment",
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsStreaming(true);
      setStatus("idle");

      // Start capture loop
      startCaptureLoop();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to access camera";
      setError(`Camera error: ${message}`);
      setStatus("error");
    }
  }, []);

  const stopWebcam = useCallback(() => {
    // Stop capture loop
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Clear overlay
    if (overlayCanvasRef.current) {
      const ctx = overlayCanvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(
          0,
          0,
          overlayCanvasRef.current.width,
          overlayCanvasRef.current.height
        );
      }
    }

    isProcessingRef.current = false;
    setIsProcessing(false);
    setIsStreaming(false);
    setDetections([]);
    setFrameCount(0);
  }, []);

  const startCaptureLoop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      captureAndDetect();
    }, CAPTURE_INTERVAL_MS);
  }, []);

  const captureAndDetect = useCallback(async () => {
    // Prevent overlapping requests
    if (isProcessingRef.current) return;
    if (!videoRef.current || !captureCanvasRef.current) return;
    if (videoRef.current.readyState !== 4) return;

    isProcessingRef.current = true;
    setIsProcessing(true);

    try {
      const video = videoRef.current;
      const canvas = captureCanvasRef.current;
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      if (canvas.width !== CAPTURE_SIZE) {
        canvas.width = CAPTURE_SIZE;
      }

      if (canvas.height !== CAPTURE_SIZE) {
        canvas.height = CAPTURE_SIZE;
      }

      ctx.drawImage(video, 0, 0, CAPTURE_SIZE, CAPTURE_SIZE);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", 0.7);
      });

      if (!blob) return;

      // Send to backend
      const formData = new FormData();
      formData.append("file", blob, "frame.jpg");

      const response = await fetch(`${API_URL}/detect`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: DetectionResponse = await response.json();
      if (!streamRef.current) return;

      const visibleDetections = data.detections.filter(
        (det) => det.confidence > RENDER_THRESHOLD
      );

      setDetections(visibleDetections);
      setFrameCount((prev) => prev + 1);
      onDetectionsCaptured?.(visibleDetections, "webcam");

      drawWebcamDetections(visibleDetections);
    } catch (err) {
      // Silently handle errors during streaming
      console.error("Detection error:", err);
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  }, [onDetectionsCaptured]);

  const drawWebcamDetections = useCallback((detections: Detection[]) => {
    const video = videoRef.current;
    const canvas = overlayCanvasRef.current;

    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Match canvas size to video display size
    const rect = video.getBoundingClientRect();
    if (canvas.width !== rect.width) {
      canvas.width = rect.width;
    }

    if (canvas.height !== rect.height) {
      canvas.height = rect.height;
    }

    const scaleX = rect.width / CAPTURE_SIZE;
    const scaleY = rect.height / CAPTURE_SIZE;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    detections.forEach((det) => {
      const [x1, y1, x2, y2] = det.box;

      const sx1 = x1 * scaleX;
      const sy1 = y1 * scaleY;
      const sx2 = x2 * scaleX;
      const sy2 = y2 * scaleY;
      const width = sx2 - sx1;
      const height = sy2 - sy1;

      const isHighConfidence = det.confidence > THREAT_THRESHOLD;
      const color = isHighConfidence ? "#ef4444" : "#f59e0b";

      // Draw box
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(sx1, sy1, width, height);

      // Draw label
      const label = `${det.class_name} ${(det.confidence * 100).toFixed(0)}%`;
      ctx.font = "bold 14px sans-serif";
      const textMetrics = ctx.measureText(label);
      const textHeight = 18;
      const padding = 4;

      ctx.fillStyle = color;
      ctx.fillRect(
        sx1,
        sy1 - textHeight - padding * 2,
        textMetrics.width + padding * 2,
        textHeight + padding * 2
      );

      ctx.fillStyle = "#ffffff";
      ctx.fillText(label, sx1 + padding, sy1 - padding - 3);
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, [stopWebcam]);

  // ==========================================================================
  // UPLOAD MODE FUNCTIONS
  // ==========================================================================

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setDetections([]);
      setStatus("idle");
      setError(null);
    },
    []
  );

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
      onDetectionsCaptured?.(data.detections, "upload");

      drawUploadDetections(data.detections);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Detection failed");
      setStatus("error");
    }
  }, [onDetectionsCaptured, selectedFile]);

  const drawUploadDetections = useCallback((detections: Detection[]) => {
    const canvas = canvasRef.current;
    const image = imageRef.current;

    if (!canvas || !image) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    detections.forEach((det) => {
      const [x1, y1, x2, y2] = det.box;
      const width = x2 - x1;
      const height = y2 - y1;

      const isHighConfidence = det.confidence > THREAT_THRESHOLD;
      const color = isHighConfidence ? "#ef4444" : "#f59e0b";

      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(x1, y1, width, height);

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

      ctx.fillStyle = "#ffffff";
      ctx.fillText(label, x1 + padding, y1 - padding - 4);
    });
  }, []);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="space-y-6">
      {/* Mode Switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            stopWebcam();
            setMode("webcam");
          }}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
            mode === "webcam"
              ? "bg-primary/20 text-primary border border-primary/30"
              : "text-muted hover:text-white hover:bg-surface-light"
          )}
        >
          <Video className="h-4 w-4" />
          Webcam
        </button>
        <button
          onClick={() => {
            stopWebcam();
            setMode("upload");
          }}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
            mode === "upload"
              ? "bg-primary/20 text-primary border border-primary/30"
              : "text-muted hover:text-white hover:bg-surface-light"
          )}
        >
          <Upload className="h-4 w-4" />
          Image Upload
        </button>
      </div>

      {/* Webcam Mode */}
      {mode === "webcam" && (
        <div className="space-y-4">
          {/* Video Container */}
          <div className="rounded-xl bg-surface border border-border overflow-hidden">
            <div className="relative aspect-video bg-black">
              {/* Video Element */}
              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                playsInline
                muted
              />

              {/* Detection Overlay */}
              <canvas
                ref={overlayCanvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />

              {/* Hidden Capture Canvas */}
              <canvas ref={captureCanvasRef} className="hidden" />

              {/* Status Overlays */}
              {!isStreaming && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  <div className="text-center">
                    <Camera className="h-16 w-16 text-muted mx-auto mb-4" />
                    <p className="text-white font-medium">Camera Off</p>
                    <p className="text-muted text-sm mt-1">
                      Click Start to begin detection
                    </p>
                  </div>
                </div>
              )}

              {/* Threat Alert Overlay */}
              {isStreaming && hasThreat && (
                <div className="absolute inset-x-0 top-4 flex justify-center pointer-events-none">
                  <div className="threat-alert rounded-lg bg-danger/90 backdrop-blur-sm px-6 py-3 shadow-glow-danger">
                    <p className="text-xl font-bold text-white tracking-wider">
                      THREAT DETECTED
                    </p>
                  </div>
                </div>
              )}

              {/* Safe Status */}
              {isStreaming && !hasThreat && detections.length === 0 && (
                <div className="absolute inset-x-0 top-4 flex justify-center pointer-events-none">
                  <div className="rounded-lg bg-success/80 backdrop-blur-sm px-6 py-3">
                    <p className="text-lg font-bold text-white">SAFE</p>
                  </div>
                </div>
              )}

              {/* Processing Indicator */}
              {isStreaming && (
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span
                    className={cn(
                      "h-3 w-3 rounded-full",
                      isProcessing ? "bg-warning animate-pulse" : "bg-success"
                    )}
                  />
                  <span className="text-sm font-medium text-white bg-black/60 px-2 py-1 rounded">
                    {isProcessing ? "Processing..." : "Live"}
                  </span>
                </div>
              )}

              {/* Frame Counter */}
              {isStreaming && (
                <div className="absolute top-4 right-4 bg-black/60 px-3 py-1 rounded">
                  <span className="text-sm font-mono text-white">
                    Frames: {frameCount}
                  </span>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-4">
                {!isStreaming ? (
                  <button
                    onClick={startWebcam}
                    disabled={status === "loading"}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {status === "loading" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Video className="h-4 w-4" />
                    )}
                    Start Detection
                  </button>
                ) : (
                  <button
                    onClick={stopWebcam}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-danger py-3 text-sm font-medium text-white hover:bg-danger/90 transition-colors"
                  >
                    <VideoOff className="h-4 w-4" />
                    Stop Detection
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Live Detection Results */}
          {isStreaming && detections.length > 0 && (
            <div className="rounded-xl bg-surface border border-border p-4">
              <h3 className="text-sm font-semibold text-white mb-3">
                Live Detections ({detections.length})
              </h3>
              <div className="space-y-2">
                {detections.map((det, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center justify-between rounded-lg p-3",
                      det.confidence > THREAT_THRESHOLD
                        ? "bg-danger/10 border border-danger/30"
                        : "bg-surface-light"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span>{det.class_name === "gun" ? "🔫" : "🔪"}</span>
                      <span className="text-sm font-medium text-white capitalize">
                        {det.class_name}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "text-sm font-bold",
                        det.confidence > THREAT_THRESHOLD
                          ? "text-danger"
                          : "text-warning"
                      )}
                    >
                      {(det.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload Mode */}
      {mode === "upload" && (
        <>
          {/* Upload Section */}
          <div className="rounded-xl bg-surface border border-border p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Upload Image
            </h2>

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
                <div className="relative rounded-lg overflow-hidden bg-black">
                  <img
                    ref={imageRef}
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-auto max-h-[500px] object-contain"
                    onLoad={() => {
                      if (detections.length > 0) {
                        drawUploadDetections(detections);
                      }
                    }}
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ objectFit: "contain" }}
                  />
                  <button
                    onClick={handleClear}
                    className="absolute top-2 right-2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

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
                        {
                          detections.filter((d) => d.confidence > THREAT_THRESHOLD)
                            .length
                        }{" "}
                        high-confidence detection(s)
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
                          ? "No objects detected"
                          : "All detections below threshold"}
                      </p>
                    </div>
                  </>
                )}
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
                      <div className="mt-3">
                        <div className="h-2 rounded-full bg-surface overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
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
        </>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-xl bg-danger/10 border border-danger/30 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-danger" />
            <p className="text-sm text-danger">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
