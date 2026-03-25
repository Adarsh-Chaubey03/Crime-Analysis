"""
YOLOv8 Training Script
Train weapon detection model on custom dataset.
"""
from ultralytics import YOLO

# Load pretrained YOLOv8 nano model
model = YOLO("yolov8n.pt")

# Train on custom dataset
# If CUDA OOM → reduce batch to 2
model.train(
    data="data/dataset/data.yaml",
    epochs=30,
    imgsz=416,
    batch=4,
    device=0,
    workers=2
)

# Model saved to: runs/detect/train/weights/best.pt
