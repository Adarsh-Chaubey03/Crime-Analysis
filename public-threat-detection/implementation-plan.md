# Real-Time Public Threat Detection — Implementation Plan

## 1. System Overview

### Goal
This module provides a basic prototype for detecting possible public threats in live or recorded video streams. It focuses on three specific detection scenarios:

1. **Unusual gathering** in a restricted area
2. **Visible weapons** (gun or knife)
3. **Suspicious activity** such as loitering in restricted zones

### Limitations
- This is a **prototype** — not production-grade software.
- Detection accuracy depends on YOLOv8 model quality and the training data it was built on. Weapon detection in particular may produce false positives/negatives on edge cases (partially occluded objects, toy weapons, etc.).
- No persistent storage or database — alerts are ephemeral and pushed via WebSocket.
- No authentication or authorization on endpoints.
- Loitering detection uses a simplified heuristic (centroid proximity across frames) and is not a full re-identification system.
- Restricted zones are defined as static rectangular regions in frame coordinates.

### Integration with Main Platform
This module is designed as a standalone subsystem that will later integrate into the broader AI Crime Intelligence Platform:

- **Alert Engine output** will feed into the platform's central event bus for downstream processing (crime prediction, behavioral analysis, forensic correlation).
- **Camera metadata** (camera_id, location) will map to the platform's geospatial layer.
- **Detection logs** will be stored in the platform's data lake for historical analysis once that component is built.

---

## 2. Detection Strategy

### Object Detection for Weapons
- Use YOLOv8 to detect objects classified as `knife` or firearm-related classes.
- COCO-pretrained YOLOv8 includes class 43 (`knife`). For guns, class labels from COCO do not include a direct "gun" class, so we map related labels or use confidence-filtered detections on custom-trained weights if available.
- Each detection carries a confidence score; only detections above a configurable threshold (default 0.5) trigger alerts.

### People Detection
- YOLOv8 detects `person` (COCO class 0).
- Bounding boxes are used for counting, zone checks, and loitering tracking.

### Crowd Density Analysis
- Count the number of `person` detections per frame.
- If the count exceeds a configurable threshold (default 5) within a defined restricted zone, an `UNUSUAL_GATHERING` alert is raised.

### Restricted Zone Logic
- Restricted zones are defined as rectangular regions `(x1, y1, x2, y2)` in pixel coordinates.
- A person is considered "inside" a zone if the center of their bounding box falls within the rectangle.
- Zones are configurable via backend constants (can be extended to API-configurable later).

---

## 3. Model Choice

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Object detection | YOLOv8n (nano) via Ultralytics | Lightweight, fast inference, good accuracy for prototype |
| Video I/O | OpenCV (cv2) | Industry standard, supports webcam + file input |
| Language | Python 3.10+ | Ecosystem support for ML/CV libraries |

YOLOv8n is the smallest variant, suitable for real-time inference on CPU. If a GPU is available, inference will automatically use CUDA.

---

## 4. Data Flow

```
Video Source (webcam / uploaded file)
       │
       ▼
Frame Extraction (OpenCV)
       │
       ▼
Object Detection (YOLOv8)
       │
       ▼
Crowd Analysis (person count + zone check)
       │
       ▼
Threat Rule Evaluation (rule engine)
       │
       ▼
Alert Generation (WebSocket push)
```

Each frame is processed independently. Loitering detection maintains a lightweight state across frames (person centroid history).

---

## 5. Threat Rules

| Rule | Condition | Alert Type | Severity |
|------|-----------|------------|----------|
| Weapon detected | YOLOv8 detects gun or knife with confidence ≥ threshold | `WEAPON_DETECTED` | Critical |
| Unusual gathering | Person count > `CROWD_THRESHOLD` inside restricted zone | `UNUSUAL_GATHERING` | High |
| Loitering | Same person centroid remains within radius for > `LOITER_SECONDS` | `LOITERING_DETECTED` | Medium |

### Alert JSON Format

```json
{
  "type": "WEAPON_DETECTED",
  "confidence": 0.87,
  "timestamp": "2026-03-16T14:32:01.123Z",
  "camera_id": "cam_1",
  "details": {
    "object": "knife",
    "bbox": [120, 340, 200, 420]
  }
}
```

---

## 6. Architecture Diagram

```
┌──────────────────────┐
│      Web UI          │
│  (HTML/JS Dashboard) │
└─────────┬────────────┘
          │  HTTP + WebSocket
          ▼
┌──────────────────────┐
│    Backend API       │
│     (FastAPI)        │
│                      │
│  POST /video/upload  │
│  GET  /video/stream  │
│  WS   /alerts        │
└─────────┬────────────┘
          │
          ▼
┌──────────────────────┐
│ Video Processing     │
│    Engine            │
│   (OpenCV)           │
└─────────┬────────────┘
          │
          ▼
┌──────────────────────┐
│  Detection Models    │
│   (YOLOv8n)          │
│                      │
│  - Person detection  │
│  - Weapon detection  │
└─────────┬────────────┘
          │
          ▼
┌──────────────────────┐
│   Alert Engine       │
│                      │
│  - Rule evaluation   │
│  - WebSocket push    │
│  - Alert formatting  │
└──────────────────────┘
```

---

## 7. Technology Stack

### Backend
| Component | Technology |
|-----------|-----------|
| Language | Python 3.10+ |
| Web framework | FastAPI |
| Video processing | OpenCV (opencv-python-headless) |
| Object detection | YOLOv8 via Ultralytics |
| WebSocket | FastAPI built-in WebSocket support |
| ASGI server | Uvicorn |

### Frontend
| Component | Technology |
|-----------|-----------|
| UI | Plain HTML + CSS + JavaScript |
| Video display | HTML5 `<img>` tag with MJPEG stream |
| Alerts | WebSocket client rendering alert cards |

### Streaming
| Source | Method |
|--------|--------|
| Webcam | OpenCV `VideoCapture(0)` |
| Video file | OpenCV `VideoCapture(filepath)` |
| Output to browser | MJPEG over HTTP (frame-by-frame JPEG) |

---

## 8. File Structure

```
public-threat-detection/
│
├── implementation-plan.md      ← this document
├── README.md                   ← setup and usage instructions
│
├── backend/
│   ├── main.py                 ← FastAPI application, endpoints, WebSocket
│   ├── video_processor.py      ← OpenCV frame extraction, MJPEG streaming
│   ├── threat_detector.py      ← YOLOv8 inference, rule engine, alerts
│   ├── models.py               ← Pydantic models for alerts and config
│   └── requirements.txt        ← Python dependencies
│
└── frontend/
    ├── index.html              ← Dashboard page
    ├── app.js                  ← WebSocket client, UI logic
    └── styles.css              ← Styling
```
