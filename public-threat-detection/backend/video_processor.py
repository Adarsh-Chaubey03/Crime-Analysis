"""Video processing module — frame extraction, annotation, and MJPEG streaming."""

import cv2
import numpy as np
import threading
import time
from pathlib import Path


class VideoProcessor:
    """Handles video capture from webcam or file and frame-by-frame processing."""

    def __init__(self):
        self._capture: cv2.VideoCapture | None = None
        self._lock = threading.Lock()
        self._running = False
        self._source: str | int = 0  # default to webcam

    def open(self, source: str | int = 0) -> bool:
        """Open a video source (webcam index or file path)."""
        with self._lock:
            if self._capture is not None:
                self._capture.release()
            self._source = source
            self._capture = cv2.VideoCapture(source)
            if not self._capture.isOpened():
                self._capture = None
                return False
            self._running = True
            return True

    def read_frame(self) -> np.ndarray | None:
        """Read a single frame from the current video source."""
        with self._lock:
            if self._capture is None or not self._capture.isOpened():
                return None
            ret, frame = self._capture.read()
            if not ret:
                return None
            return frame

    def release(self):
        """Release the video source."""
        with self._lock:
            self._running = False
            if self._capture is not None:
                self._capture.release()
                self._capture = None

    @property
    def is_open(self) -> bool:
        with self._lock:
            return self._capture is not None and self._capture.isOpened()

    @staticmethod
    def draw_detections(frame: np.ndarray, detections: list[dict]) -> np.ndarray:
        """Draw bounding boxes and labels on a frame.

        Each detection dict should have:
            - bbox: (x1, y1, x2, y2)
            - label: str
            - confidence: float
            - color: (B, G, R) tuple — optional, defaults to green
        """
        annotated = frame.copy()
        for det in detections:
            x1, y1, x2, y2 = det["bbox"]
            label = det["label"]
            conf = det["confidence"]
            color = det.get("color", (0, 255, 0))

            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
            text = f"{label} {conf:.2f}"
            (tw, th), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
            cv2.rectangle(annotated, (x1, y1 - th - 6), (x1 + tw, y1), color, -1)
            cv2.putText(
                annotated, text, (x1, y1 - 4),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1
            )
        return annotated

    @staticmethod
    def draw_zones(frame: np.ndarray, zones: list[dict]) -> np.ndarray:
        """Draw restricted zone rectangles on a frame.

        Each zone dict should have: name, x1, y1, x2, y2.
        """
        annotated = frame.copy()
        for zone in zones:
            x1, y1, x2, y2 = zone["x1"], zone["y1"], zone["x2"], zone["y2"]
            overlay = annotated.copy()
            cv2.rectangle(overlay, (x1, y1), (x2, y2), (0, 0, 255), -1)
            cv2.addWeighted(overlay, 0.15, annotated, 0.85, 0, annotated)
            cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 0, 255), 2)
            cv2.putText(
                annotated, f"RESTRICTED: {zone['name']}", (x1, y1 - 8),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1
            )
        return annotated

    @staticmethod
    def encode_jpeg(frame: np.ndarray, quality: int = 80) -> bytes:
        """Encode a frame as JPEG bytes."""
        params = [cv2.IMWRITE_JPEG_QUALITY, quality]
        _, buffer = cv2.imencode(".jpg", frame, params)
        return buffer.tobytes()
