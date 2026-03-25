"""
Model Loading and Test Inference
Loads trained YOLOv8 model and runs inference on test image.
"""
import sys
from pathlib import Path
from ultralytics import YOLO


def find_best_model(base_path="runs/detect"):
    """
    Find the best.pt model file.
    Searches for latest train folder if specific path not found.
    """
    base = Path(base_path)

    # Check common locations
    search_paths = [
        base / "train6" / "weights" / "best.pt",
        base / "train" / "weights" / "best.pt",
    ]

    for path in search_paths:
        if path.exists():
            return path

    # Search for latest train folder
    if base.exists():
        train_folders = sorted(
            [d for d in base.iterdir() if d.is_dir() and d.name.startswith("train")],
            key=lambda x: x.stat().st_mtime,
            reverse=True
        )

        for folder in train_folders:
            best_pt = folder / "weights" / "best.pt"
            if best_pt.exists():
                return best_pt

    return None


def find_test_image(dataset_path="data/dataset"):
    """Find a test image for inference."""
    test_dirs = [
        Path(dataset_path) / "test" / "images",
        Path(dataset_path) / "val" / "images",
        Path(dataset_path) / "train" / "images",
    ]

    image_extensions = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

    for test_dir in test_dirs:
        if test_dir.exists():
            for img in test_dir.iterdir():
                if img.suffix.lower() in image_extensions:
                    return img

    return None


def load_and_test():
    """Load model and run test inference."""

    print("=" * 60)
    print("  MODEL LOADING & TEST INFERENCE")
    print("=" * 60)

    # Find model
    print("\n[1] Finding model...")
    model_path = find_best_model()

    if model_path is None:
        print("[FAIL] No trained model found!")
        print("       Run training first: python train.py")
        sys.exit(1)

    print(f"[OK] Model found: {model_path}")

    # Load model
    print("\n[2] Loading model...")
    try:
        model = YOLO(str(model_path))
        print(f"[OK] Model loaded successfully")

        # Check device
        import torch
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"[OK] Device: {device}")
        if device == "cuda":
            print(f"     GPU: {torch.cuda.get_device_name(0)}")

    except Exception as e:
        print(f"[FAIL] Failed to load model: {e}")
        sys.exit(1)

    # Find test image
    print("\n[3] Finding test image...")
    test_image = find_test_image()

    if test_image is None:
        print("[WARN] No test image found, skipping inference test")
        return model, model_path

    print(f"[OK] Test image: {test_image.name}")

    # Run inference
    print("\n[4] Running inference...")
    try:
        results = model(str(test_image), device=device, verbose=False)
        result = results[0]

        print(f"[OK] Inference complete")

        # Parse detections
        print("\n" + "-" * 40)
        print("DETECTIONS:")
        print("-" * 40)

        if len(result.boxes) == 0:
            print("  No objects detected")
        else:
            for i, box in enumerate(result.boxes):
                class_id = int(box.cls[0])
                class_name = model.names[class_id]
                confidence = float(box.conf[0])
                x1, y1, x2, y2 = map(int, box.xyxy[0])

                print(f"  [{i+1}] {class_name}")
                print(f"      Confidence: {confidence:.2%}")
                print(f"      BBox: ({x1}, {y1}) -> ({x2}, {y2})")

        print("-" * 40)

    except Exception as e:
        print(f"[FAIL] Inference failed: {e}")
        sys.exit(1)

    print("\n" + "=" * 60)
    print("  MODEL READY FOR REAL-TIME INFERENCE")
    print("=" * 60)

    return model, model_path


if __name__ == "__main__":
    model, path = load_and_test()
