"""
Project Structure Validator
Checks folders, image-label pairing, and data.yaml paths.
"""
import sys
from pathlib import Path
import yaml


def validate_project(base_path="threat-detection"):
    """Validate complete project structure."""

    base = Path(base_path)
    errors = []
    warnings = []

    print("=" * 60)
    print("  PROJECT STRUCTURE VALIDATION")
    print("=" * 60)

    # Check main folders
    print("\n[1] Checking main folders...")
    required_dirs = ["data", "src"]
    for d in required_dirs:
        if (base / d).exists():
            print(f"    [OK] {d}/")
        else:
            print(f"    [FAIL] {d}/ MISSING")
            errors.append(f"Missing folder: {d}")

    # Check dataset structure
    print("\n[2] Checking dataset structure...")
    dataset_base = base / "data" / "dataset"

    if not dataset_base.exists():
        # Try direct data/ structure
        dataset_base = base / "data"

    splits = ["train", "val"]
    for split in splits:
        img_dir = dataset_base / split / "images"
        lbl_dir = dataset_base / split / "labels"

        if img_dir.exists():
            img_count = len(list(img_dir.glob("*.[jJ][pP][gG]")) +
                          list(img_dir.glob("*.[pP][nN][gG]")))
            print(f"    [OK] {split}/images/ ({img_count} files)")
        else:
            print(f"    [FAIL] {split}/images/ MISSING")
            errors.append(f"Missing: {split}/images/")

        if lbl_dir.exists():
            lbl_count = len(list(lbl_dir.glob("*.txt")))
            print(f"    [OK] {split}/labels/ ({lbl_count} files)")
        else:
            print(f"    [FAIL] {split}/labels/ MISSING")
            errors.append(f"Missing: {split}/labels/")

    # Check image-label pairing
    print("\n[3] Checking image-label pairing...")
    for split in splits:
        img_dir = dataset_base / split / "images"
        lbl_dir = dataset_base / split / "labels"

        if not img_dir.exists() or not lbl_dir.exists():
            continue

        images = list(img_dir.glob("*.[jJ][pP][gG]")) + list(img_dir.glob("*.[pP][nN][gG]"))
        missing = []

        for img in images:
            label = lbl_dir / f"{img.stem}.txt"
            if not label.exists():
                missing.append(img.name)

        if missing:
            print(f"    [WARN] {split}: {len(missing)} images missing labels")
            for m in missing[:3]:
                print(f"           - {m}")
            if len(missing) > 3:
                print(f"           ... and {len(missing)-3} more")
            warnings.extend(missing)
        else:
            print(f"    [OK] {split}: All images have labels")

    # Check data.yaml
    print("\n[4] Checking data.yaml...")
    yaml_paths = [
        dataset_base / "data.yaml",
        base / "data" / "data.yaml",
        base / "data" / "dataset.yaml"
    ]

    yaml_found = None
    for yp in yaml_paths:
        if yp.exists():
            yaml_found = yp
            break

    if yaml_found:
        print(f"    [OK] Found: {yaml_found.relative_to(base)}")

        with open(yaml_found, "r") as f:
            config = yaml.safe_load(f)

        print(f"    [INFO] path: {config.get('path', 'NOT SET')}")
        print(f"    [INFO] train: {config.get('train', 'NOT SET')}")
        print(f"    [INFO] val: {config.get('val', 'NOT SET')}")
        print(f"    [INFO] nc: {config.get('nc', 'NOT SET')}")
        print(f"    [INFO] names: {config.get('names', 'NOT SET')}")
    else:
        print(f"    [FAIL] data.yaml NOT FOUND")
        errors.append("Missing data.yaml")

    # Check requirements.txt
    print("\n[5] Checking requirements.txt...")
    if (base / "requirements.txt").exists():
        print(f"    [OK] requirements.txt exists")
    else:
        print(f"    [WARN] requirements.txt missing")
        warnings.append("Missing requirements.txt")

    # Summary
    print("\n" + "=" * 60)
    if errors:
        print(f"  VALIDATION FAILED: {len(errors)} errors, {len(warnings)} warnings")
        for e in errors:
            print(f"    ERROR: {e}")
    elif warnings:
        print(f"  VALIDATION PASSED with {len(warnings)} warnings")
    else:
        print("  VALIDATION PASSED")
    print("=" * 60)

    return len(errors) == 0


if __name__ == "__main__":
    base = sys.argv[1] if len(sys.argv) > 1 else "."
    success = validate_project(base)
    sys.exit(0 if success else 1)
