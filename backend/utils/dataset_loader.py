"""
Dataset Loader Utility

Helper functions to work with the skin disease dataset.
"""

import os
from pathlib import Path
from typing import List, Dict, Tuple
from PIL import Image
import random


def get_acne_images(dataset_root: str = "../dataset1", split: str = "train1") -> List[str]:
    """
    Get all acne image paths from the dataset.
    
    Args:
        dataset_root: Root directory of dataset
        split: "train1" or "test1"
    
    Returns:
        List of image file paths
    """
    acne_dir = Path(dataset_root) / split / "Acne and Rosacea Photos"
    
    if not acne_dir.exists():
        print(f"⚠️ Acne directory not found: {acne_dir}")
        return []
    
    images = list(acne_dir.glob("*.jpg"))
    print(f"📁 Found {len(images)} acne images in {split}")
    
    return [str(img) for img in images]


def get_all_categories(dataset_root: str = "../dataset1", split: str = "train1") -> Dict[str, int]:
    """
    Get all disease categories and their image counts.
    
    Returns:
        Dictionary mapping category names to image counts
    """
    split_dir = Path(dataset_root) / split
    
    if not split_dir.exists():
        print(f"⚠️ Dataset split not found: {split_dir}")
        return {}
    
    categories = {}
    for category_dir in split_dir.iterdir():
        if category_dir.is_dir():
            count = len(list(category_dir.glob("*.jpg")))
            categories[category_dir.name] = count
    
    return categories


def load_random_acne_image(dataset_root: str = "../dataset1", split: str = "train1") -> str:
    """
    Load a random acne image for testing.
    
    Returns:
        Path to a random acne image
    """
    images = get_acne_images(dataset_root, split)
    if not images:
        raise ValueError("No acne images found in dataset")
    return random.choice(images)


def get_dataset_stats(dataset_root: str = "../dataset1") -> Dict:
    """
    Get statistics about the dataset.
    
    Returns:
        Dictionary with dataset statistics
    """
    stats = {
        "train": {},
        "test": {},
        "total_train": 0,
        "total_test": 0
    }
    
    for split in ["train1", "test1"]:
        categories = get_all_categories(dataset_root, split)
        split_key = "train" if "train" in split else "test"
        stats[split_key] = categories
        stats[f"total_{split_key}"] = sum(categories.values())
    
    return stats


if __name__ == "__main__":
    # Test the dataset loader
    print("📊 Dataset Statistics:")
    stats = get_dataset_stats()
    print(f"\nTrain: {stats['total_train']} images")
    print(f"Test: {stats['total_test']} images")
    
    print("\n📁 Categories in train set:")
    for cat, count in sorted(stats['train'].items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"  {cat}: {count}")
    
    print("\n🖼️ Acne images:")
    train_acne = get_acne_images(split="train1")
    test_acne = get_acne_images(split="test1")
    print(f"  Train: {len(train_acne)}")
    print(f"  Test: {len(test_acne)}")
    
    if train_acne:
        print(f"\n✅ Sample image: {train_acne[0]}")

