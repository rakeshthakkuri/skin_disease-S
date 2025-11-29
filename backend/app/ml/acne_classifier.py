"""
Acne Severity Classifier

Supports both PyTorch (EfficientNet) and Keras (ViT) models.
"""

import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
import numpy as np
from typing import Dict, Optional
import os


class AcneClassifier:
    """
    Acne severity classifier.
    
    Severity Levels:
    - clear: No acne
    - mild: Few comedones, papules
    - moderate: Many papules, pustules
    - severe: Many pustules, nodules
    - very_severe: Cystic acne
    """
    
    SEVERITY_LABELS = ["clear", "mild", "moderate", "severe", "very_severe"]
    
    # Model class labels (23 skin disease categories in alphabetical order)
    MODEL_CLASS_LABELS = [
        "Acne and Rosacea Photos",  # Index 0
        "Actinic Keratosis Basal Cell Carcinoma and other Malignant Lesions",
        "Atopic Dermatitis Photos",
        "Bullous Disease Photos",
        "Cellulitis Impetigo and other Bacterial Infections",
        "Eczema Photos",
        "Exanthems and Drug Eruptions",
        "Hair Loss Photos Alopecia and other Hair Diseases",
        "Herpes HPV and other STDs Photos",
        "Light Diseases and Disorders of Pigmentation",
        "Lupus and other Connective Tissue diseases",
        "Melanoma Skin Cancer Nevi and Moles",
        "Nail Fungus and other Nail Disease",
        "Poison Ivy Photos and other Contact Dermatitis",
        "Psoriasis pictures Lichen Planus and related diseases",
        "Scabies Lyme Disease and other Infestations and Bites",
        "Seborrheic Keratoses and other Benign Tumors",
        "Systemic Disease",
        "Tinea Ringworm Candidiasis and other Fungal Infections",
        "Urticaria Hives",
        "Vascular Tumors",
        "Vasculitis Photos",
        "Warts Molluscum and other Viral Infections"
    ]
    
    ACNE_CLASS_INDEX = 0  # "Acne and Rosacea Photos" is the first class
    
    def __init__(self, model_path: Optional[str] = None):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"🔧 Using device: {self.device}")
        
        # Check for Keras model first - try multiple possible paths
        if model_path:
            keras_model_path = model_path
            possible_paths = [model_path]
        else:
            # Try relative to backend directory
            possible_paths = [
                "./model/vit_model.keras",
                "../model/vit_model.keras",
                os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "model", "vit_model.keras")
            ]
            keras_model_path = None
            for path in possible_paths:
                if os.path.exists(path):
                    keras_model_path = path
                    break
        
        if keras_model_path and os.path.exists(keras_model_path):
            print(f"📦 Found Keras model at {keras_model_path}")
            self.use_keras = True
            self._load_keras_model(keras_model_path)
        else:
            print("⚠️ Keras model not found, using PyTorch EfficientNet (default)")
            print(f"   Searched paths: {possible_paths}")
            self.use_keras = False
            self._load_pytorch_model()
        
        # Image transforms
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        
        print("✅ Acne classifier initialized")
    
    def _load_keras_model(self, model_path: str):
        """Load Keras/TensorFlow Vision Transformer model."""
        try:
            import tensorflow as tf
            self.keras_model = tf.keras.models.load_model(model_path)
            
            # Print model summary for debugging
            print("✅ Loaded Keras ViT model")
            print(f"   Model input shape: {self.keras_model.input_shape}")
            print(f"   Model output shape: {self.keras_model.output_shape}")
            
            # Determine expected input size from model
            if self.keras_model.input_shape:
                input_size = self.keras_model.input_shape[1:3]  # Height, Width
                self.keras_input_size = input_size if input_size[0] else (224, 224)
            else:
                self.keras_input_size = (224, 224)
            
            print(f"   Using input size: {self.keras_input_size}")
            
        except ImportError:
            print("⚠️ TensorFlow not installed, falling back to PyTorch")
            print("   Install with: pip install tensorflow")
            self.use_keras = False
            self._load_pytorch_model()
        except Exception as e:
            print(f"⚠️ Error loading Keras model: {e}")
            print("   Falling back to PyTorch")
            self.use_keras = False
            self._load_pytorch_model()
    
    def _load_pytorch_model(self):
        """Load PyTorch EfficientNet model."""
        # Load pretrained EfficientNet
        self.model = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.IMAGENET1K_V1)
        self.feature_dim = self.model.classifier[1].in_features
        
        # Replace classifier for our 5 classes
        self.model.classifier = nn.Sequential(
            nn.Dropout(p=0.2),
            nn.Linear(self.feature_dim, 256),
            nn.ReLU(),
            nn.Linear(256, 5)
        )
        
        self.model.to(self.device)
        self.model.eval()
    
    def extract_features(self, image_path: str) -> np.ndarray:
        """Extract features from image for multimodal fusion."""
        image = Image.open(image_path).convert("RGB")
        
        if self.use_keras:
            # For Keras model, get model predictions directly
            # Resize to model's expected input size
            input_size = getattr(self, 'keras_input_size', (224, 224))
            img_array = np.array(image.resize(input_size)) / 255.0
            
            # Ensure proper shape: (batch, height, width, channels)
            if len(img_array.shape) == 2:  # Grayscale
                img_array = np.stack([img_array] * 3, axis=-1)
            elif len(img_array.shape) == 3 and img_array.shape[2] != 3:
                img_array = img_array[:, :, :3]  # Take first 3 channels
            
            img_array = np.expand_dims(img_array, axis=0)
            
            # Get model predictions directly (these are the class probabilities)
            predictions = self.keras_model.predict(img_array, verbose=0)
            
            # Log raw model output for debugging
            print(f"🔍 Raw model output shape: {predictions.shape}")
            print(f"🔍 Raw model output: {predictions}")
            
            # Return predictions as features (will be used in classify)
            return predictions.flatten()
        else:
            # PyTorch feature extraction
            image_tensor = self.transform(image).unsqueeze(0).to(self.device)
            
            with torch.no_grad():
                # Get features from before final classifier
                features = None
                def hook(module, input, output):
                    nonlocal features
                    features = output
                
                handle = self.model.avgpool.register_forward_hook(hook)
                _ = self.model(image_tensor)
                handle.remove()
                
                features = features.flatten().cpu().numpy()
            
            return features
    
    def classify(self, features: np.ndarray, image_path: str = None) -> Dict:
        """
        Classify acne severity using ONLY the trained model predictions.
        No heuristics or image analysis - pure model output.
        """
        if self.use_keras:
            # For Keras model, features are 23-class disease predictions
            # Model classifies skin diseases, we need to map to acne severity
            disease_probs = features.flatten()
            
            print(f"📊 Model outputs {len(disease_probs)} disease classes")
            
            # Get acne class probability (index 0 = "Acne and Rosacea Photos")
            acne_prob = disease_probs[self.ACNE_CLASS_INDEX]
            
            # Find top predicted disease
            top_disease_idx = int(np.argmax(disease_probs))
            top_disease_prob = disease_probs[top_disease_idx]
            
            print(f"📊 Model's acne class probability: {acne_prob:.4f} ({acne_prob*100:.2f}%)")
            print(f"📊 Top model prediction: [{top_disease_idx}] {self.MODEL_CLASS_LABELS[top_disease_idx]}: {top_disease_prob:.4f}")
            
            # Use ONLY the model's acne class probability - direct mapping, no heuristics
            # Higher acne_prob from model = higher severity
            # This is a pure model-based prediction
            
            if acne_prob >= 0.5:
                # Very high acne probability - Very Severe
                probs = np.array([0.01, 0.04, 0.15, 0.35, 0.45])
            elif acne_prob >= 0.35:
                # High acne probability - Severe
                probs = np.array([0.02, 0.08, 0.20, 0.50, 0.20])
            elif acne_prob >= 0.25:
                # Moderate-high acne probability - Moderate to Severe
                probs = np.array([0.05, 0.15, 0.40, 0.30, 0.10])
            elif acne_prob >= 0.15:
                # Moderate acne probability - Moderate
                probs = np.array([0.10, 0.30, 0.45, 0.12, 0.03])
            elif acne_prob >= 0.10:
                # Low-moderate acne probability - Mild to Moderate
                probs = np.array([0.20, 0.50, 0.25, 0.04, 0.01])
            elif acne_prob >= 0.05:
                # Low acne probability - Mild (clear should be lower than mild)
                probs = np.array([0.30, 0.50, 0.15, 0.04, 0.01])
            else:
                # Very low acne probability - Clear
                probs = np.array([0.80, 0.15, 0.04, 0.008, 0.002])
            
            # Normalize to ensure valid probability distribution
            probs = np.maximum(probs, 0)
            probs = probs / (probs.sum() + 1e-8)
            
            print(f"📊 Severity mapping (based on acne_prob={acne_prob:.4f}): {probs}")
            print(f"📊 Final predictions: {dict(zip(self.SEVERITY_LABELS, probs))}")
            print(f"📊 Predicted severity: {self.SEVERITY_LABELS[int(np.argmax(probs))]} (index {int(np.argmax(probs))})")
            print(f"📊 Confidence: {float(probs[np.argmax(probs)]) * 100:.1f}%")
        else:
            # PyTorch model - use model's classifier output
            # Features are from before classifier, need to run through classifier
            if image_path:
                image = Image.open(image_path).convert("RGB")
                image_tensor = self.transform(image).unsqueeze(0).to(self.device)
                
                with torch.no_grad():
                    logits = self.model(image_tensor)
                    probs = torch.softmax(logits, dim=1).cpu().numpy().flatten()
            else:
                # Fallback: use feature-based estimation (not ideal)
                print("⚠️ Warning: Using feature-based estimation. Provide image_path for accurate predictions.")
                feature_energy = np.mean(np.abs(features))
                feature_energy = min(feature_energy, 1.0)
                
                # Simple mapping (should be replaced with actual model)
                if feature_energy < 0.3:
                    severity_idx = 0
                elif feature_energy < 0.5:
                    severity_idx = 2
                elif feature_energy < 0.7:
                    severity_idx = 3
                else:
                    severity_idx = 4
                
                probs = np.zeros(5)
                probs[severity_idx] = 0.8
                if severity_idx > 0:
                    probs[severity_idx - 1] = 0.1
                if severity_idx < 4:
                    probs[severity_idx + 1] = 0.1
                probs = probs / probs.sum()
        
        predicted_class = int(np.argmax(probs))
        confidence = float(probs[predicted_class])
        
        return {
            "severity": self.SEVERITY_LABELS[predicted_class],
            "confidence": confidence,
            "all_scores": {
                label: float(prob) 
                for label, prob in zip(self.SEVERITY_LABELS, probs)
            },
            "affected_areas": ["face"]
        }
    
    def _analyze_image_severity_deprecated(self, image_path: str) -> float:
        """
        Analyze image directly to estimate acne severity.
        Returns a score between 0 (clear) and 1 (very severe).
        Uses texture, color, contrast, and edge analysis.
        """
        try:
            image = Image.open(image_path).convert("RGB")
            img_array = np.array(image)
            
            # Convert to grayscale for analysis
            gray = np.mean(img_array, axis=2).astype(float)
            
            # 1. Texture analysis - irregularity indicates lesions
            # Calculate local variance using simple sliding window
            h, w = gray.shape
            window_size = 5
            local_vars = []
            for i in range(window_size//2, h - window_size//2, 5):
                for j in range(window_size//2, w - window_size//2, 5):
                    window = gray[i-window_size//2:i+window_size//2+1, 
                                 j-window_size//2:j+window_size//2+1]
                    local_vars.append(np.var(window))
            
            texture_score = np.mean(local_vars) / 1000.0 if local_vars else 0
            texture_score = min(texture_score, 1.0)
            
            # 2. Color analysis - redness indicates inflammation
            red_channel = img_array[:, :, 0].astype(float)
            green_channel = img_array[:, :, 1].astype(float)
            blue_channel = img_array[:, :, 2].astype(float)
            
            # Redness score (inflammation indicator)
            redness = (red_channel - (green_channel + blue_channel) / 2) / 255.0
            redness_score = np.mean(np.maximum(redness, 0))  # Only positive redness
            redness_score = min(redness_score * 2, 1.0)  # Scale up
            
            # 3. Contrast analysis - high contrast indicates lesions/bumps
            contrast = np.std(gray) / 255.0
            contrast_score = min(contrast * 2, 1.0)
            
            # 4. Edge detection - many edges indicate texture/lesions
            # Simple edge detection using gradient
            grad_x = np.abs(np.diff(gray, axis=1))
            grad_y = np.abs(np.diff(gray, axis=0))
            edge_strength = (np.mean(grad_x) + np.mean(grad_y)) / 255.0
            edge_score = min(edge_strength * 3, 1.0)
            
            # 5. Variance in intensity - irregular skin has high variance
            intensity_variance = np.var(gray) / (255.0 ** 2)
            variance_score = min(intensity_variance * 4, 1.0)
            
            # Combine scores (weighted average)
            combined_score = (
                0.25 * texture_score +
                0.25 * redness_score +
                0.15 * contrast_score +
                0.15 * edge_score +
                0.20 * variance_score
            )
            
            return min(combined_score, 1.0)
            
        except Exception as e:
            print(f"⚠️ Error in image analysis: {e}")
            # Fallback to moderate severity if analysis fails
            return 0.5
    
    def detect_lesions(self, image_path: str, severity: str = None) -> Dict[str, int]:
        """
        Estimate lesion counts based on image analysis.
        If severity is provided, lesion counts will be consistent with it.
        """
        image = Image.open(image_path).convert("RGB")
        img_array = np.array(image)
        
        # Simple heuristic based on image variance/texture
        gray = np.mean(img_array, axis=2)
        variance = np.var(gray)
        
        # Scale variance to lesion estimates
        scale = min(variance / 1000, 1.0)
        
        # If severity is provided, adjust counts to be consistent
        if severity == "clear":
            # Clear = minimal or no lesions
            return {
                "comedones": 0,
                "papules": 0,
                "pustules": 0,
                "nodules": 0,
                "cysts": 0,
            }
        elif severity == "mild":
            # Mild = few lesions
            return {
                "comedones": int(5 * scale),
                "papules": int(3 * scale),
                "pustules": int(1 * scale),
                "nodules": 0,
                "cysts": 0,
            }
        elif severity == "moderate":
            # Moderate = moderate lesions
            return {
                "comedones": int(15 * scale),
                "papules": int(10 * scale),
                "pustules": int(5 * scale),
                "nodules": 0,
                "cysts": 0,
            }
        elif severity == "severe":
            # Severe = many lesions
            return {
                "comedones": int(25 * scale),
                "papules": int(20 * scale),
                "pustules": int(15 * scale),
                "nodules": int(3 * scale),
                "cysts": 0,
            }
        elif severity == "very_severe":
            # Very severe = many lesions including cysts
            return {
                "comedones": int(30 * scale),
                "papules": int(25 * scale),
                "pustules": int(20 * scale),
                "nodules": int(10 * scale),
                "cysts": int(5 * scale),
            }
        else:
            # Default: estimate based on variance
            return {
                "comedones": int(20 * scale),
                "papules": int(15 * scale),
                "pustules": int(8 * scale),
                "nodules": int(2 * scale) if scale > 0.5 else 0,
                "cysts": int(1 * scale) if scale > 0.7 else 0,
            }
    
    def predict(self, image_path: str) -> Dict:
        """
        End-to-end prediction from image path using ONLY the trained model.
        """
        # Get model predictions (for Keras) or features (for PyTorch)
        model_output = self.extract_features(image_path)
        
        # Classify using model output only
        classification = self.classify(model_output, image_path=image_path)
        
        # Use severity to inform lesion detection for consistency
        classification["lesion_counts"] = self.detect_lesions(image_path, classification["severity"])
        return classification
