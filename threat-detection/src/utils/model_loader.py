"""
Model Loader Utility
Consolidated model discovery and loading logic.
Searches for trained YOLOv8 model weights in standard locations.
"""
import sys
from pathlib import Path
from ultralytics import YOLO


# Project root (threat-detection/)
PROJECT_ROOT = Path(__file__).parent.parent.parent


def find_best_model(base_path=None):
    """
    Find the best.pt model file.
    Searches for latest train folder if specific path not found.

    Args:
        base_path: Base path for YOLO runs directory. Defaults to PROJECT_ROOT / "runs/detect"

    Returns:
        Path to best.pt file, or None if not found
    """
    if base_path is None:
        base_path = PROJECT_ROOT / "runs" / "detect"
    else:
        base_path = Path(base_path)

    # Check common locations (most recent train folders first)
    search_paths = [
        base_path / "train6" / "weights" / "best.pt",
        base_path / "train" / "weights" / "best.pt",
    ]

    for path in search_paths:
        if path.exists():
            return path

    # Search for latest train folder
    if base_path.exists():
        train_folders = sorted(
            [d for d in base_path.iterdir() if d.is_dir() and d.name.startswith("train")],
            key=lambda x: x.stat().st_mtime,
            reverse=True
        )

        for folder in train_folders:
            best_pt = folder / "weights" / "best.pt"
            if best_pt.exists():
                return best_pt

    return None


def find_pretrained_model(model_name="yolov8n.pt"):
    """
    Find a pretrained model in the models/ directory.

    Args:
        model_name: Name of the pretrained model file

    Returns:
        Path to model file, or None if not found
    """
    models_dir = PROJECT_ROOT / "models"
    model_path = models_dir / model_name

    if model_path.exists():
        return model_path

    # Fallback: check project root (legacy location)
    fallback = PROJECT_ROOT / model_name
    if fallback.exists():
        return fallback

    return None


def find_test_image(dataset_path=None):
    """Find a test image for inference.

    Args:
        dataset_path: Path to dataset directory. Defaults to PROJECT_ROOT / "data/dataset"

    Returns:
        Path to a test image, or None if not found
    """
    if dataset_path is None:
        dataset_path = PROJECT_ROOT / "data" / "dataset"
    else:
        dataset_path = Path(dataset_path)

    test_dirs = [
        dataset_path / "test" / "images",
        dataset_path / "val" / "images",
        dataset_path / "train" / "images",
    ]

    image_extensions = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

    for test_dir in test_dirs:
        if test_dir.exists():
            for img in test_dir.iterdir():
                if img.suffix.lower() in image_extensions:
                    return img

    return None


def load_model(model_path=None):
    """
    Load YOLO model and run test inference.

    Args:
        model_path: Path to model weights. If None, auto-detect best.pt.

    Returns:
        Tuple of (model, model_path)
    """
    import torch

    print("=" * 60)
    print("  MODEL LOADING & TEST INFERENCE")
    print("=" * 60)

    # Find model
    print("\n[1] Finding model...")
    if model_path is None:
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
        print("[OK] Model loaded successfully")

        # Check device
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

        print("[OK] Inference complete")

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
    model, path = load_model()
