"""Threat detection module — YOLOv8 inference, rule engine, and alert generation."""

import time
from datetime import datetime, timezone

import numpy as np
from ultralytics import YOLO

from models import Alert, AlertType, AlertDetail, BoundingBox, DetectionConfig


# COCO class IDs relevant to this prototype
PERSON_CLASS_ID = 0
KNIFE_CLASS_ID = 43

# COCO does not have a direct "gun" class. These are the closest approximations
# from the 80-class COCO set. In a production system you would use a
# custom-trained model with explicit firearm classes.
# Class 43 = knife (used above), no direct gun class in COCO.
# We treat any detection with a label containing "gun", "pistol", "rifle" as a weapon
# if a custom model is loaded. With default COCO weights, only knife is detected.
WEAPON_LABELS = {"knife", "gun", "pistol", "rifle", "firearm"}


class ThreatDetector:
    """Runs YOLOv8 on frames and applies threat rules to generate alerts."""

    def __init__(self, config: DetectionConfig | None = None, camera_id: str = "cam_1"):
        self.config = config or DetectionConfig()
        self.camera_id = camera_id

        # Load YOLOv8 nano model — downloads automatically on first run
        self.model = YOLO("yolov8n.pt")

        # Loitering tracker: maps a simple centroid key to first-seen timestamp
        # Key is a grid-quantised (cx, cy) so nearby detections merge
        self._loiter_tracker: dict[tuple[int, int], float] = {}
        self._loiter_grid_size = 50  # pixels — quantisation grid

    # ------------------------------------------------------------------
    # Core detection
    # ------------------------------------------------------------------

    def detect(self, frame: np.ndarray) -> tuple[list[dict], list[Alert]]:
        """Run detection on a single frame.

        Returns:
            detections: list of dicts with bbox, label, confidence, color
            alerts: list of Alert objects triggered by this frame
        """
        results = self.model(frame, verbose=False)[0]
        detections: list[dict] = []
        alerts: list[Alert] = []
        person_boxes: list[tuple[int, int, int, int]] = []

        for box in results.boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            label = results.names[cls_id]

            if conf < self.config.confidence_threshold:
                continue

            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())

            # Determine colour based on type
            if label.lower() in WEAPON_LABELS:
                color = (0, 0, 255)  # red for weapons
            elif cls_id == PERSON_CLASS_ID:
                color = (0, 255, 0)  # green for persons
            else:
                continue  # skip irrelevant classes

            detections.append({
                "bbox": (x1, y1, x2, y2),
                "label": label,
                "confidence": conf,
                "color": color,
            })

            # Collect persons
            if cls_id == PERSON_CLASS_ID:
                person_boxes.append((x1, y1, x2, y2))

            # --- Rule: weapon detected ---
            if label.lower() in WEAPON_LABELS:
                alerts.append(self._make_alert(
                    AlertType.WEAPON_DETECTED, conf,
                    AlertDetail(object=label, bbox=BoundingBox(x1=x1, y1=y1, x2=x2, y2=y2))
                ))

        # --- Rule: unusual gathering in restricted zone ---
        alerts.extend(self._check_crowd(person_boxes))

        # --- Rule: loitering ---
        alerts.extend(self._check_loitering(person_boxes))

        return detections, alerts

    # ------------------------------------------------------------------
    # Rule helpers
    # ------------------------------------------------------------------

    def _check_crowd(self, person_boxes: list[tuple[int, int, int, int]]) -> list[Alert]:
        """Check if the number of people inside any restricted zone exceeds the threshold."""
        alerts: list[Alert] = []
        for zone in self.config.restricted_zones:
            count = 0
            for (x1, y1, x2, y2) in person_boxes:
                cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
                if zone.x1 <= cx <= zone.x2 and zone.y1 <= cy <= zone.y2:
                    count += 1
            if count >= self.config.crowd_threshold:
                alerts.append(self._make_alert(
                    AlertType.UNUSUAL_GATHERING, 1.0,
                    AlertDetail(person_count=count)
                ))
        return alerts

    def _check_loitering(self, person_boxes: list[tuple[int, int, int, int]]) -> list[Alert]:
        """Simple loitering detection via centroid persistence."""
        now = time.time()
        alerts: list[Alert] = []
        current_keys: set[tuple[int, int]] = set()

        for (x1, y1, x2, y2) in person_boxes:
            cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
            # Check if centroid falls inside any restricted zone
            in_zone = False
            for zone in self.config.restricted_zones:
                if zone.x1 <= cx <= zone.x2 and zone.y1 <= cy <= zone.y2:
                    in_zone = True
                    break
            if not in_zone:
                continue

            key = (cx // self._loiter_grid_size, cy // self._loiter_grid_size)
            current_keys.add(key)

            if key not in self._loiter_tracker:
                self._loiter_tracker[key] = now
            else:
                duration = now - self._loiter_tracker[key]
                if duration >= self.config.loiter_seconds:
                    alerts.append(self._make_alert(
                        AlertType.LOITERING_DETECTED, 0.8,
                        AlertDetail(duration_seconds=round(duration, 1))
                    ))

        # Prune old keys no longer seen
        stale = [k for k in self._loiter_tracker if k not in current_keys]
        for k in stale:
            del self._loiter_tracker[k]

        return alerts

    def _make_alert(self, alert_type: AlertType, confidence: float,
                    details: AlertDetail | None = None) -> Alert:
        return Alert(
            type=alert_type,
            confidence=round(confidence, 2),
            timestamp=datetime.now(timezone.utc).isoformat(),
            camera_id=self.camera_id,
            details=details,
        )
