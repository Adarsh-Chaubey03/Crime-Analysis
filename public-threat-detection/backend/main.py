"""FastAPI application — endpoints for video upload, streaming, and WebSocket alerts."""

import asyncio
import os
import shutil
import tempfile
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles

from models import (
    Alert,
    DetectionConfig,
    RestrictedZone,
    VideoUploadResponse,
)
from video_processor import VideoProcessor
from threat_detector import ThreatDetector

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

UPLOAD_DIR = Path(tempfile.gettempdir()) / "threat_detection_uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Default restricted zone (can be adjusted for different camera setups)
DEFAULT_ZONES = [
    RestrictedZone(name="Zone-A", x1=100, y1=100, x2=500, y2=400),
]

CONFIG = DetectionConfig(
    confidence_threshold=0.5,
    crowd_threshold=5,
    loiter_seconds=30.0,
    restricted_zones=DEFAULT_ZONES,
)

# ---------------------------------------------------------------------------
# Shared state
# ---------------------------------------------------------------------------

video_processor = VideoProcessor()
threat_detector: ThreatDetector | None = None
connected_ws: list[WebSocket] = []

# Track the current video source so we can switch between webcam and uploads
_current_source: str | int = 0


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    global threat_detector
    threat_detector = ThreatDetector(config=CONFIG)
    yield
    video_processor.release()


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Public Threat Detection API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve the frontend static files
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"
if FRONTEND_DIR.exists():
    app.mount("/frontend", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def broadcast_alerts(alerts: list[Alert]):
    """Send alerts to all connected WebSocket clients."""
    if not alerts:
        return
    dead: list[WebSocket] = []
    for ws in connected_ws:
        try:
            for alert in alerts:
                await ws.send_json(alert.model_dump())
        except Exception:
            dead.append(ws)
    for ws in dead:
        connected_ws.remove(ws)


def _generate_frames():
    """Generator that yields MJPEG frames with detections drawn."""
    zones_dicts = [z.model_dump() for z in CONFIG.restricted_zones]

    while video_processor.is_open:
        frame = video_processor.read_frame()
        if frame is None:
            # If reading from a file and it ends, restart or break
            break

        detections, alerts = threat_detector.detect(frame)

        # Draw restricted zones, then detections
        annotated = video_processor.draw_zones(frame, zones_dicts)
        annotated = video_processor.draw_detections(annotated, detections)

        jpeg = video_processor.encode_jpeg(annotated)

        # Schedule alert broadcast (fire-and-forget into the event loop)
        if alerts:
            try:
                loop = asyncio.get_event_loop()
                loop.create_task(broadcast_alerts(alerts))
            except RuntimeError:
                pass  # no running loop — skip

        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n" + jpeg + b"\r\n"
        )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.post("/video/upload", response_model=VideoUploadResponse)
async def upload_video(file: UploadFile = File(...)):
    """Upload a video file for processing."""
    dest = UPLOAD_DIR / file.filename
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Switch video source to the uploaded file
    global _current_source
    _current_source = str(dest)
    video_processor.open(str(dest))

    return VideoUploadResponse(
        status="ok",
        filename=file.filename,
        message="Video uploaded. Open /video/stream to view processed output.",
    )


@app.get("/video/stream")
async def video_stream():
    """Stream the processed video as MJPEG."""
    if not video_processor.is_open:
        video_processor.open(_current_source)

    return StreamingResponse(
        _generate_frames(),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


@app.post("/video/webcam")
async def start_webcam():
    """Switch video source to the default webcam."""
    global _current_source
    _current_source = 0
    success = video_processor.open(0)
    return {"status": "ok" if success else "error", "source": "webcam"}


@app.websocket("/alerts")
async def alerts_ws(ws: WebSocket):
    """WebSocket endpoint — pushes threat alerts to connected clients."""
    await ws.accept()
    connected_ws.append(ws)
    try:
        while True:
            # Keep connection alive; client can send pings
            await ws.receive_text()
    except WebSocketDisconnect:
        connected_ws.remove(ws)


# ---------------------------------------------------------------------------
# Run with: uvicorn main:app --reload
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
