"""
Multimodal Fusion - Minimal Version

Combines image features with clinical metadata.
"""

import numpy as np
from typing import Dict


class MultimodalFusion:
    """
    Simple multimodal fusion combining image features with clinical metadata.
    """
    
    SKIN_TYPES = ["oily", "dry", "combination", "normal", "sensitive"]
    
    def __init__(self):
        print("✅ Multimodal fusion initialized")
    
    def encode_metadata(self, metadata: Dict) -> np.ndarray:
        """Encode clinical metadata into feature vector."""
        features = []
        
        # Age (normalized)
        age = metadata.get("age", 25)
        features.append(age / 100)
        
        # Acne duration (normalized)
        duration = metadata.get("acne_duration_months", 6)
        features.append(min(duration / 60, 1.0))
        
        # Skin type (one-hot)
        skin_type = metadata.get("skin_type", "normal")
        skin_one_hot = [1.0 if s == skin_type else 0.0 for s in self.SKIN_TYPES]
        features.extend(skin_one_hot)
        
        # Has previous treatments
        prev_treatments = metadata.get("previous_treatments", [])
        features.append(1.0 if prev_treatments else 0.0)
        
        # Has allergies
        allergies = metadata.get("allergies", [])
        features.append(1.0 if allergies else 0.0)
        
        return np.array(features, dtype=np.float32)
    
    def fuse(self, image_features: np.ndarray, clinical_metadata: Dict) -> np.ndarray:
        """
        Fuse image features with clinical metadata.
        
        Simple concatenation with weighted combination.
        """
        # Encode metadata
        metadata_features = self.encode_metadata(clinical_metadata)
        
        # Weight image features more heavily (they're more informative)
        image_weight = 0.8
        metadata_weight = 0.2
        
        # Normalize image features
        image_norm = image_features / (np.linalg.norm(image_features) + 1e-8)
        
        # Expand metadata to match a portion of image features
        metadata_expanded = np.tile(metadata_features, 
                                    int(len(image_features) * metadata_weight / len(metadata_features)))
        
        # Combine
        fused = np.concatenate([
            image_norm * image_weight,
            metadata_expanded[:int(len(image_features) * metadata_weight)]
        ])
        
        return fused
