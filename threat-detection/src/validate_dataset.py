"""
Dataset Validation Script for YOLOv8
Validates structure, paths, and image-label pairing.
"""
import sys
from pathlib import Path
import yaml


def validate_dataset(yaml_path="data/dataset.yaml"):
    """Validate YOLOv8 dataset structure."""

    print("=" * 55)
    print("  YOLOV8 DATASET VALIDATION")
    print("=" * 55)

    yaml_file = Path(yaml_path)
    errors = []

    # 1. Check dataset.yaml exists
    if not yaml_file.exists():
        print(f"[FAIL] dataset.yaml not found: {yaml_file}")
        return False
    print(f"[OK] dataset.yaml found")

    # 2. Load and parse yaml
    with open(yaml_file, "r") as f:
        config = yaml.safe_load(f)

    base_path = yaml_file.parent / config.get("path", "")
    nc = config.get("nc", 0)
    names = config.get("names", {})

    print(f"[OK] Classes: {nc} → {list(names.values())}")

    # 3. Define paths
    splits = {
        "train": {
            "images": base_path / config.get("train", "train/images"),
            "labels": base_path / "train/labels"
        },
        "val": {
            "images": base_path / config.get("val", "val/images"),
            "labels": base_path / "val/labels"
        }
    }

    # 4. Check directories
    print("\n--- Directory Check ---")
    for split_name, paths in splits.items():
        for folder_type, folder_path in paths.items():
            if folder_path.exists():
                print(f"[OK] {split_name}/{folder_type}: exists")
            else:
                print(f"[WARN] {split_name}/{folder_type}: MISSING")
                errors.append(f"Missing: {folder_path}")

    # 5. Check image-label pairing
    print("\n--- Image-Label Pairing ---")
    image_exts = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

    for split_name, paths in splits.items():
        img_dir = paths["images"]
        lbl_dir = paths["labels"]

        if not img_dir.exists():
            print(f"[SKIP] {split_name}: images folder missing")
            continue

        images = [f for f in img_dir.iterdir() if f.suffix.lower() in image_exts]
        print(f"\n[{split_name.upper()}] Images: {len(images)}")

        missing = []
        for img in images:
            label_file = lbl_dir / f"{img.stem}.txt"
            if not label_file.exists():
                missing.append(img.name)

        if missing:
            print(f"[WARN] Missing labels: {len(missing)}")
            for m in missing[:5]:
                print(f"       - {m}")
            if len(missing) > 5:
                print(f"       ... and {len(missing)-5} more")
            errors.extend(missing)
        else:
            if len(images) > 0:
                print(f"[OK] All images have matching labels")
            else:
                print(f"[WARN] No images found")

        # 6. Validate label format
        if lbl_dir.exists():
            labels = list(lbl_dir.glob("*.txt"))
            invalid = []

            for lf in labels[:50]:  # Check first 50
                with open(lf, "r") as f:
                    for ln, line in enumerate(f, 1):
                        line = line.strip()
                        if not line or line.startswith("#"):
                            continue
                        parts = line.split()

                        # Check 5 values
                        if len(parts) != 5:
                            invalid.append(f"{lf.name}:{ln} - need 5 values")
                            continue

                        # Check class_id
                        try:
                            cid = int(parts[0])
                            if cid >= nc:
                                invalid.append(f"{lf.name}:{ln} - class {cid} >= nc")
                        except ValueError:
                            invalid.append(f"{lf.name}:{ln} - invalid class_id")

                        # Check normalized values
                        try:
                            vals = [float(p) for p in parts[1:]]
                            if not all(0 <= v <= 1 for v in vals):
                                invalid.append(f"{lf.name}:{ln} - values not 0-1")
                        except ValueError:
                            invalid.append(f"{lf.name}:{ln} - invalid float")

            if invalid:
                print(f"[WARN] Invalid labels: {len(invalid)}")
                for i in invalid[:3]:
                    print(f"       - {i}")
            else:
                print(f"[OK] Label format valid")

    # Summary
    print("\n" + "=" * 55)
    if errors:
        print(f"  RESULT: {len(errors)} issues found")
        print("=" * 55)
        return False
    else:
        print("  RESULT: VALIDATION PASSED")
        print("=" * 55)
        return True


if __name__ == "__main__":
    yaml_path = sys.argv[1] if len(sys.argv) > 1 else "data/dataset.yaml"
    success = validate_dataset(yaml_path)
    sys.exit(0 if success else 1)
