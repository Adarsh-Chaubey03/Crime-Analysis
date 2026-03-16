# Real-Time Public Threat Detection — Prototype

A basic prototype for detecting possible public threats in video streams using YOLOv8 and OpenCV.

## Detections Supported

| Threat | Method |
|--------|--------|
| Visible weapons (gun, knife) | YOLOv8 object detection |
| Unusual gathering in restricted zone | Person count threshold |
| Loitering in restricted zone | Centroid persistence over time |

## Project Structure

```
public-threat-detection/
├── implementation-plan.md      # Detailed design document
├── README.md                   # This file
├── backend/
│   ├── main.py                 # FastAPI app with endpoints
│   ├── video_processor.py      # OpenCV frame I/O and annotation
│   ├── threat_detector.py      # YOLOv8 inference and rule engine
│   ├── models.py               # Pydantic data models
│   └── requirements.txt        # Python dependencies
└── frontend/
    ├── index.html              # Dashboard page
    ├── app.js                  # WebSocket client and UI logic
    └── styles.css              # Styling
```

## Prerequisites

- Python 3.10 or newer
- pip
- A webcam (optional — you can also upload video files)

## Setup

### 1. Install dependencies

```bash
cd public-threat-detection/backend
pip install -r requirements.txt
```

On first run, Ultralytics will automatically download the `yolov8n.pt` model weights (~6 MB).

### 2. Start the backend

```bash
cd public-threat-detection/backend
python main.py
```

The server starts at `http://localhost:8000`.

### 3. Open the dashboard

Open `public-threat-detection/frontend/index.html` in a browser, **or** navigate to:

```
http://localhost:8000/frontend/index.html
```

The FastAPI server serves the frontend as static files.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/video/upload` | Upload a recorded video file |
| `POST` | `/video/webcam` | Switch source to webcam |
| `GET` | `/video/stream` | MJPEG stream of processed video |
| `WS` | `/alerts` | WebSocket — real-time threat alerts |

## Usage

1. Click **Start Webcam** to begin processing your webcam feed, or use **Upload Video** to process a recorded file.
2. The video panel shows the live feed with bounding boxes (green for people, red for weapons) and restricted zone overlays.
3. Alerts appear in the right panel in real time when threats are detected.

## Configuration

Edit the defaults in `backend/main.py`:

```python
DEFAULT_ZONES = [
    RestrictedZone(name="Zone-A", x1=100, y1=100, x2=500, y2=400),
]

CONFIG = DetectionConfig(
    confidence_threshold=0.5,   # minimum detection confidence
    crowd_threshold=5,          # people count to trigger gathering alert
    loiter_seconds=30.0,        # seconds before loitering alert
    restricted_zones=DEFAULT_ZONES,
)
```

## Limitations

- Prototype only — not for production deployment.
- COCO-pretrained YOLOv8 does not include a direct "gun" class; knife detection works out of the box. For firearm detection, swap in a custom-trained model.
- Loitering uses a simplified centroid-grid heuristic, not a full re-identification tracker.
- No authentication on API endpoints.
- No persistent storage — alerts are ephemeral.
