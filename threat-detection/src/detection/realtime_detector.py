"""
Real-Time Threat Detection System with Logging & Alerts
Live webcam inference with event logging, sound alerts, and snapshot saving.
"""
import sys
import cv2
import csv
import threading
from pathlib import Path
from datetime import datetime
from ultralytics import YOLO

from src.utils.model_loader import find_best_model

# Windows sound support
try:
    import winsound
    SOUND_AVAILABLE = True
except ImportError:
    SOUND_AVAILABLE = False


# =============================================================================
# CONFIGURATION
# =============================================================================

ALERT_THRESHOLD = 0.6
CONFIDENCE_THRESHOLD = 0.5
ALERT_COOLDOWN = 2.0  # seconds between alerts

# Use project root for log/snapshot paths
PROJECT_ROOT = Path(__file__).parent.parent.parent
LOG_DIR = PROJECT_ROOT / "logs"
SNAPSHOT_DIR = LOG_DIR / "snapshots"
EVENT_LOG_FILE = LOG_DIR / "events.csv"


# =============================================================================
# LOGGING FUNCTIONS
# =============================================================================

def ensure_directories():
    """Create log directories if they don't exist."""
    LOG_DIR.mkdir(exist_ok=True)
    SNAPSHOT_DIR.mkdir(exist_ok=True)


def init_event_log():
    """Initialize CSV log file with headers if not exists."""
    ensure_directories()

    if not EVENT_LOG_FILE.exists():
        try:
            with open(EVENT_LOG_FILE, "w", newline="") as f:
                writer = csv.writer(f)
                writer.writerow(["timestamp", "class", "confidence", "source"])
            print(f"[INFO] Created event log: {EVENT_LOG_FILE}")
        except Exception as e:
            print(f"[WARN] Failed to create log file: {e}")


def log_event(class_name, confidence, source="webcam"):
    """
    Log detection event to CSV file.

    Args:
        class_name: Detected class (gun/knife)
        confidence: Detection confidence
        source: Video source identifier
    """
    timestamp = datetime.now().isoformat(timespec="seconds")

    try:
        with open(EVENT_LOG_FILE, "a", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([timestamp, class_name, f"{confidence:.4f}", source])
    except Exception:
        # File locked or other error - skip silently
        pass


# =============================================================================
# ALERT FUNCTIONS
# =============================================================================

def play_alert_sound():
    """Play alert sound in a non-blocking way (Windows)."""
    if not SOUND_AVAILABLE:
        return

    def _play():
        try:
            # Short beep: frequency=1000Hz, duration=200ms
            winsound.Beep(1000, 200)
        except Exception:
            pass

    # Run in thread to avoid blocking
    thread = threading.Thread(target=_play, daemon=True)
    thread.start()


def trigger_alert(class_name, confidence):
    """
    Trigger alert for detected threat.

    Args:
        class_name: Detected class
        confidence: Detection confidence
    """
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[ALERT] {timestamp} | {class_name.upper()} | Confidence: {confidence:.2%}")

    # Play sound (non-blocking)
    play_alert_sound()


# =============================================================================
# SNAPSHOT FUNCTIONS
# =============================================================================

def save_snapshot(frame, class_name):
    """
    Save frame snapshot to disk.

    Args:
        frame: BGR image (numpy array)
        class_name: Detected class for filename

    Returns:
        Path to saved file or None if failed
    """
    ensure_directories()

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{timestamp}_{class_name}.jpg"
    filepath = SNAPSHOT_DIR / filename

    try:
        cv2.imwrite(str(filepath), frame)
        print(f"[SNAPSHOT] Saved: {filepath}")
        return filepath
    except Exception as e:
        print(f"[WARN] Failed to save snapshot: {e}")
        return None


# =============================================================================
# COOLDOWN MANAGER
# =============================================================================

class CooldownManager:
    """Manages cooldown timers for alerts and snapshots."""

    def __init__(self, cooldown_seconds=2.0):
        self.cooldown = cooldown_seconds
        self.last_alert_time = 0

    def can_trigger(self):
        """Check if cooldown has passed."""
        import time
        current_time = time.time()

        if current_time - self.last_alert_time >= self.cooldown:
            self.last_alert_time = current_time
            return True
        return False


# =============================================================================
# DRAWING FUNCTIONS
# =============================================================================

def draw_detections(frame, detections, alert_threshold=0.6):
    """
    Draw bounding boxes, labels, and alert on frame.

    Returns:
        frame: Annotated frame
        threats: List of detections above threshold
    """
    threats = []

    for det in detections:
        x1, y1, x2, y2 = det["bbox"]
        class_name = det["class"]
        confidence = det["confidence"]

        # Check threat threshold
        is_threat = confidence > alert_threshold
        if is_threat:
            threats.append(det)
            color = (0, 0, 255)  # Red
        else:
            color = (0, 255, 0)  # Green

        # Draw bounding box
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

        # Draw label
        label = f"{class_name} {confidence:.2f}"
        (label_w, label_h), _ = cv2.getTextSize(
            label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2
        )

        cv2.rectangle(
            frame,
            (x1, y1 - label_h - 10),
            (x1 + label_w + 5, y1),
            color, -1
        )

        cv2.putText(
            frame, label, (x1 + 2, y1 - 5),
            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2
        )

    # Draw THREAT DETECTED banner
    if threats:
        frame_h, frame_w = frame.shape[:2]
        alert_text = "THREAT DETECTED"
        font_scale = 1.5
        thickness = 3

        (text_w, text_h), _ = cv2.getTextSize(
            alert_text, cv2.FONT_HERSHEY_SIMPLEX, font_scale, thickness
        )

        x = (frame_w - text_w) // 2
        y = 50

        cv2.rectangle(
            frame,
            (x - 10, y - text_h - 10),
            (x + text_w + 10, y + 10),
            (0, 0, 255), -1
        )

        cv2.putText(
            frame, alert_text, (x, y),
            cv2.FONT_HERSHEY_SIMPLEX, font_scale, (255, 255, 255), thickness
        )

    return frame, threats


# =============================================================================
# MAIN DETECTION LOOP
# =============================================================================

def run_realtime_detection(
    model_path=None,
    source=0,
    alert_threshold=ALERT_THRESHOLD,
    confidence_threshold=CONFIDENCE_THRESHOLD,
    enable_logging=True,
    enable_snapshots=True,
    enable_sound=True
):
    """
    Run real-time threat detection with logging and alerts.

    Args:
        model_path: Path to model (auto-detect if None)
        source: Camera index or video file path
        alert_threshold: Confidence for threat alert
        confidence_threshold: Minimum confidence to show
        enable_logging: Enable CSV event logging
        enable_snapshots: Enable snapshot saving
        enable_sound: Enable alert sound
    """
    print("=" * 60)
    print("  REAL-TIME THREAT DETECTION SYSTEM")
    print("  with Logging & Alerts")
    print("=" * 60)

    # Initialize logging
    if enable_logging:
        init_event_log()
        print(f"[INFO] Event log: {EVENT_LOG_FILE}")

    if enable_snapshots:
        ensure_directories()
        print(f"[INFO] Snapshots: {SNAPSHOT_DIR}")

    # Find and load model
    print("\n[1] Loading model...")
    if model_path is None:
        model_path = find_best_model()

    if model_path is None:
        print("[FAIL] No trained model found!")
        sys.exit(1)

    print(f"    Model: {model_path}")

    try:
        model = YOLO(str(model_path))
    except Exception as e:
        print(f"[FAIL] Failed to load model: {e}")
        sys.exit(1)

    # Device check
    import torch
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"    Device: {device}")

    # Open webcam
    print("\n[2] Opening webcam...")
    cap = cv2.VideoCapture(source)

    if not cap.isOpened():
        print(f"[FAIL] Cannot open video source: {source}")
        sys.exit(1)

    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    print(f"    Resolution: {frame_width}x{frame_height}")

    # Initialize cooldown
    cooldown = CooldownManager(ALERT_COOLDOWN)

    # Source identifier for logging
    source_id = f"cam{source}" if isinstance(source, int) else Path(source).name

    print("\n[3] Starting detection...")
    print("    Press 'q' to quit")
    print("=" * 60)

    try:
        while True:
            ret, frame = cap.read()

            if not ret:
                print("[ERROR] Failed to read frame")
                break

            # Run inference
            results = model(frame, device=device, verbose=False, conf=confidence_threshold)
            result = results[0]

            # Extract detections
            detections = []
            for box in result.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                class_id = int(box.cls[0])
                confidence = float(box.conf[0])

                detections.append({
                    "bbox": (x1, y1, x2, y2),
                    "class": model.names[class_id],
                    "confidence": confidence
                })

            # Draw detections
            annotated_frame, threats = draw_detections(
                frame, detections, alert_threshold
            )

            # Process threats with cooldown
            if threats and cooldown.can_trigger():
                # Get highest confidence threat
                top_threat = max(threats, key=lambda x: x["confidence"])

                # Trigger alert
                trigger_alert(top_threat["class"], top_threat["confidence"])

                # Log all threats
                if enable_logging:
                    for threat in threats:
                        log_event(threat["class"], threat["confidence"], source_id)

                # Save snapshot
                if enable_snapshots:
                    save_snapshot(annotated_frame, top_threat["class"])

                # Play sound
                if enable_sound:
                    play_alert_sound()

            # Show detection count
            status_text = f"Detections: {len(detections)}"
            cv2.putText(
                annotated_frame, status_text,
                (10, frame_height - 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2
            )

            # Display
            cv2.imshow("Threat Detection", annotated_frame)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                print("\n[INFO] Quit requested")
                break

    except KeyboardInterrupt:
        print("\n[INFO] Interrupted")

    finally:
        cap.release()
        cv2.destroyAllWindows()
        print("[INFO] Cleanup complete")


# =============================================================================
# ENTRY POINT
# =============================================================================

def main():
    import argparse

    parser = argparse.ArgumentParser(description="Real-Time Threat Detection with Logging")
    parser.add_argument("--source", type=str, default="0", help="Video source")
    parser.add_argument("--model", type=str, default=None, help="Model path")
    parser.add_argument("--alert-threshold", type=float, default=0.6, help="Alert threshold")
    parser.add_argument("--confidence", type=float, default=0.5, help="Min confidence")
    parser.add_argument("--no-logging", action="store_true", help="Disable CSV logging")
    parser.add_argument("--no-snapshots", action="store_true", help="Disable snapshots")
    parser.add_argument("--no-sound", action="store_true", help="Disable alert sound")

    args = parser.parse_args()

    source = int(args.source) if args.source.isdigit() else args.source

    run_realtime_detection(
        model_path=args.model,
        source=source,
        alert_threshold=args.alert_threshold,
        confidence_threshold=args.confidence,
        enable_logging=not args.no_logging,
        enable_snapshots=not args.no_snapshots,
        enable_sound=not args.no_sound
    )


if __name__ == "__main__":
    main()
