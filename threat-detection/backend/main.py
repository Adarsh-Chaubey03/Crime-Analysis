"""
ThreatScan AI - FastAPI Backend
YOLOv8 Threat Detection API
"""
import sys
from pathlib import Path
from typing import List

import cv2
import numpy as np
import torch
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ultralytics import YOLO

# Add project root to path so we can import from src/
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from src.utils.model_loader import find_best_model


# =============================================================================
# CONFIGURATION
# =============================================================================

MODEL_PATH = PROJECT_ROOT / "runs/detect/train6/weights/best.pt"
CONFIDENCE_THRESHOLD = 0.5
INFERENCE_IMAGE_SIZE = 416
# =============================================================================
# MODELS
# =============================================================================

class Detection(BaseModel):
    class_name: str
    confidence: float
    box: List[int]


class DetectionResponse(BaseModel):
    detections: List[Detection]
    count: int


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    device: str


# =============================================================================
# APP SETUP
# =============================================================================

app = FastAPI(
    title="ThreatScan AI API",
    description="Real-time threat detection using YOLOv8",
    version="1.0.0",
)

# CORS - Allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# Load model at startup
model = None
device = "cpu"


@app.on_event("startup")
async def load_model():
    """Load YOLO model on startup."""
    global model, device

    device = "cuda" if torch.cuda.is_available() else "cpu"

    # Try configured path first, then auto-detect
    if MODEL_PATH.exists():
        model_path = MODEL_PATH
    else:
        model_path = find_best_model()

    if model_path is None:
        raise FileNotFoundError(f"Model not found at {MODEL_PATH}")

    print(f"[INFO] Loading model: {model_path}")
    print(f"[INFO] Device: {device}")

    model = YOLO(str(model_path))
    model.to(device)
    print("[INFO] Model loaded successfully")


# =============================================================================
# ENDPOINTS
# =============================================================================

@app.get("/", response_model=HealthResponse)
async def root():
    """Health check endpoint."""
    return HealthResponse(
        status="ok",
        model_loaded=model is not None,
        device=device,
    )


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="ok",
        model_loaded=model is not None,
        device=device,
    )


@app.post("/detect", response_model=DetectionResponse)
async def detect(file: UploadFile = File(...)):
    """
    Detect threats in uploaded image.

    Args:
        file: Image file (JPEG, PNG, etc.)

    Returns:
        DetectionResponse with list of detections
    """
    # Validate model loaded
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    # Validate file
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")

    # Validate content type
    content_type = file.content_type or ""
    if not content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {content_type}. Expected image/*",
        )

    try:
        contents = await file.read()
        image = cv2.imdecode(np.frombuffer(contents, dtype=np.uint8), cv2.IMREAD_COLOR)

        if image is None:
            raise HTTPException(status_code=400, detail="Failed to decode image")

        with torch.inference_mode():
            results = model(
                image,
                device=device,
                imgsz=INFERENCE_IMAGE_SIZE,
                verbose=False,
                conf=CONFIDENCE_THRESHOLD,
            )
        result = results[0]

        # Extract detections
        detections = []
        for box in result.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            class_id = int(box.cls[0])
            confidence = float(box.conf[0])

            detections.append(
                Detection(
                    class_name=model.names[class_id],
                    confidence=round(confidence, 4),
                    box=[x1, y1, x2, y2],
                )
            )

        return DetectionResponse(
            detections=detections,
            count=len(detections),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")


# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
