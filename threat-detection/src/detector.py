"""
YOLOv8 Object Detection Pipeline
Real-time detection using pretrained YOLOv8n model.
"""
import cv2
import argparse
import sys
from pathlib import Path
from ultralytics import YOLO


class ObjectDetector:
    """YOLOv8 object detector."""

    def __init__(self, model_path="yolov8n.pt", confidence_threshold=0.5):
        """
        Initialize detector.

        Args:
            model_path: Path to YOLO model weights
            confidence_threshold: Minimum confidence for detections
        """
        self.model_path = model_path
        self.confidence_threshold = confidence_threshold
        self.model = None
        self.device = None

    def load(self):
        """Load YOLO model."""
        print(f"[INFO] Loading model: {self.model_path}")
        self.model = YOLO(self.model_path)

        # Check device
        import torch
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"[INFO] Using device: {self.device}")

        return self

    def detect(self, frame):
        """
        Run detection on a frame.

        Args:
            frame: BGR image (numpy array)

        Returns:
            List of detections: [(bbox, class_name, confidence), ...]
        """
        results = self.model(frame, device=self.device, verbose=False)[0]
        detections = []

        for box in results.boxes:
            confidence = float(box.conf[0])

            if confidence >= self.confidence_threshold:
                # Get bounding box coordinates
                x1, y1, x2, y2 = map(int, box.xyxy[0])

                # Get class name
                class_id = int(box.cls[0])
                class_name = self.model.names[class_id]

                detections.append({
                    "bbox": (x1, y1, x2, y2),
                    "class": class_name,
                    "confidence": confidence
                })

        return detections


class VideoCapture:
    """Handles video capture from webcam or file."""

    def __init__(self, source=0):
        self.source = source
        self.cap = None
        self.frame_width = 0
        self.frame_height = 0
        self.fps = 0

    def open(self):
        if isinstance(self.source, str):
            if not Path(self.source).exists():
                raise FileNotFoundError(f"Video file not found: {self.source}")

        self.cap = cv2.VideoCapture(self.source)

        if not self.cap.isOpened():
            raise RuntimeError(f"Failed to open video source: {self.source}")

        self.frame_width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.frame_height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        self.fps = self.cap.get(cv2.CAP_PROP_FPS) or 30

        print(f"[INFO] Video source: {self.source}")
        print(f"[INFO] Resolution: {self.frame_width}x{self.frame_height}")

        return self

    def read(self):
        if self.cap is None:
            return False, None
        return self.cap.read()

    def release(self):
        if self.cap is not None:
            self.cap.release()

    def __enter__(self):
        return self.open()

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.release()


def draw_detections(frame, detections):
    """
    Draw bounding boxes and labels on frame.

    Args:
        frame: BGR image
        detections: List of detection dicts

    Returns:
        Annotated frame
    """
    for det in detections:
        x1, y1, x2, y2 = det["bbox"]
        class_name = det["class"]
        confidence = det["confidence"]

        # Draw bounding box
        color = (0, 255, 0)  # Green
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

        # Draw label background
        label = f"{class_name}: {confidence:.2f}"
        (label_w, label_h), baseline = cv2.getTextSize(
            label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2
        )
        cv2.rectangle(
            frame,
            (x1, y1 - label_h - 10),
            (x1 + label_w, y1),
            color,
            -1
        )

        # Draw label text
        cv2.putText(
            frame,
            label,
            (x1, y1 - 5),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (0, 0, 0),
            2
        )

    return frame


def run_detection(source=0, model_path="yolov8n.pt", confidence=0.5):
    """
    Run real-time object detection.

    Args:
        source: Camera index or video file path
        model_path: Path to YOLO model
        confidence: Confidence threshold
    """
    # Load detector
    detector = ObjectDetector(model_path, confidence)
    detector.load()

    try:
        with VideoCapture(source) as video:
            print(f"[INFO] Press 'q' to quit")

            while True:
                ret, frame = video.read()

                if not ret:
                    if isinstance(source, str):
                        print("[INFO] End of video")
                    else:
                        print("[ERROR] Failed to read frame")
                    break

                # Run detection
                detections = detector.detect(frame)

                # Draw detections on frame
                annotated_frame = draw_detections(frame, detections)

                # Display detection count
                cv2.putText(
                    annotated_frame,
                    f"Objects: {len(detections)}",
                    (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1,
                    (0, 255, 255),
                    2
                )

                # Show frame
                cv2.imshow("YOLOv8 Detection", annotated_frame)

                if cv2.waitKey(1) & 0xFF == ord('q'):
                    print("[INFO] Quit requested")
                    break

    except (FileNotFoundError, RuntimeError) as e:
        print(f"[ERROR] {e}")
        sys.exit(1)
    finally:
        cv2.destroyAllWindows()
        print("[INFO] Cleanup complete")


def main():
    parser = argparse.ArgumentParser(description="YOLOv8 Object Detection")
    parser.add_argument(
        "--source",
        type=str,
        default="0",
        help="Camera index or video file path"
    )
    parser.add_argument(
        "--model",
        type=str,
        default="yolov8n.pt",
        help="Path to YOLO model"
    )
    parser.add_argument(
        "--confidence",
        type=float,
        default=0.5,
        help="Confidence threshold (0-1)"
    )
    args = parser.parse_args()

    source = int(args.source) if args.source.isdigit() else args.source

    run_detection(source, args.model, args.confidence)


if __name__ == "__main__":
    main()
