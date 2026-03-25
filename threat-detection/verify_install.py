"""Verify installation of all dependencies."""
import sys

def verify():
    print("=" * 40)
    print("INSTALLATION VERIFICATION")
    print("=" * 40)

    # Check torch
    try:
        import torch
        print(f"[OK] PyTorch: {torch.__version__}")
        print(f"     CUDA available: {torch.cuda.is_available()}")
        print(f"     Device: {'cuda' if torch.cuda.is_available() else 'cpu'}")
    except ImportError as e:
        print(f"[FAIL] PyTorch: {e}")
        return False

    # Check ultralytics
    try:
        from ultralytics import YOLO
        print(f"[OK] Ultralytics YOLO imported successfully")
    except ImportError as e:
        print(f"[FAIL] Ultralytics: {e}")
        return False

    # Check opencv
    try:
        import cv2
        print(f"[OK] OpenCV: {cv2.__version__}")
    except ImportError as e:
        print(f"[FAIL] OpenCV: {e}")
        return False

    # Check numpy
    try:
        import numpy as np
        print(f"[OK] NumPy: {np.__version__}")
    except ImportError as e:
        print(f"[FAIL] NumPy: {e}")
        return False

    print("=" * 40)
    print("ALL DEPENDENCIES VERIFIED!")
    print("=" * 40)
    return True

if __name__ == "__main__":
    success = verify()
    sys.exit(0 if success else 1)
