#!/usr/bin/env python3
"""Rename 'acne nodules' folder to 'nodules' in UnifiedAcneDataset"""
import shutil
from pathlib import Path

BASE_DIR = Path("/Users/rakeshpatel/Desktop/Acne detection")
UNIFIED_DATASET = BASE_DIR / "acne detection dataset" / "UnifiedAcneDataset"

old_folder = UNIFIED_DATASET / "acne nodules"
new_folder = UNIFIED_DATASET / "nodules"

print(f"Checking folder: {old_folder}")
print(f"Exists: {old_folder.exists()}")

if old_folder.exists() and not new_folder.exists():
    print(f"\nRenaming 'acne nodules' to 'nodules'...")
    shutil.move(str(old_folder), str(new_folder))
    if new_folder.exists():
        print(f"✓ Successfully renamed 'acne nodules' to 'nodules'")
        print(f"  New path: {new_folder}")
    else:
        print(f"✗ Rename failed")
elif new_folder.exists():
    print(f"✓ Folder already named 'nodules'")
    print(f"  Path: {new_folder}")
else:
    print(f"✗ Source folder 'acne nodules' not found at: {old_folder}")

