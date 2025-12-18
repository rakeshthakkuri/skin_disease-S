"""
Convert PyTorch models to ONNX format for Node.js inference

This script converts:
1. Acne severity models (binary + severity)
2. Acne type model

Usage:
    python scripts/convert-models-to-onnx.py
"""

import torch
import torch.nn as nn
from torchvision import models
from pathlib import Path
import sys

# No need to import from backend - we create models directly using torchvision

# Model directory paths
PROJECT_ROOT = Path(__file__).parent.parent.parent
MODEL_DIR = PROJECT_ROOT / "model"
OUTPUT_DIR = PROJECT_ROOT / "backend-node" / "model"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def create_efficientnet_b0(num_classes: int) -> nn.Module:
    """Create EfficientNet-B0 architecture."""
    model = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.IMAGENET1K_V1)
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_features, num_classes)
    return model

def create_resnet18(num_classes: int) -> nn.Module:
    """Create ResNet18 architecture."""
    model = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)
    in_features = model.fc.in_features
    model.fc = nn.Linear(in_features, num_classes)
    return model

def create_mobilenet_v2(num_classes: int) -> nn.Module:
    """Create MobileNetV2 architecture."""
    model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.IMAGENET1K_V1)
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_features, num_classes)
    return model

def convert_model_to_onnx(
    checkpoint_path: Path,
    output_path: Path,
    model_type: str = "severity"  # "severity", "binary", or "type"
):
    """
    Convert a PyTorch model checkpoint to ONNX format.
    
    Args:
        checkpoint_path: Path to .pth checkpoint file
        output_path: Path to save .onnx file
        model_type: Type of model (determines num_classes)
    """
    if not checkpoint_path.exists():
        print(f"⚠️  Checkpoint not found: {checkpoint_path}")
        return False
    
    print(f"\n🔄 Converting {checkpoint_path.name} to ONNX...")
    
    try:
        # Load checkpoint
        checkpoint = torch.load(checkpoint_path, map_location='cpu')
        
        # Validate class_names for type model
        if model_type == "type":
            expected_class_names = ['Pustula', 'blackhead', 'cysts', 'nodules', 'papules', 'whitehead']
            checkpoint_class_names = checkpoint.get("class_names", [])
            
            if checkpoint_class_names:
                print(f"📋 Checkpoint class_names: {checkpoint_class_names}")
                if checkpoint_class_names == expected_class_names:
                    print(f"✅ Class order matches expected: {expected_class_names}")
                else:
                    print(f"⚠️  WARNING: Class order mismatch!")
                    print(f"   Expected: {expected_class_names}")
                    print(f"   Checkpoint: {checkpoint_class_names}")
                    print(f"   This may cause incorrect predictions!")
            else:
                print(f"⚠️  WARNING: No class_names found in checkpoint!")
                print(f"   Expected: {expected_class_names}")
        
        # Determine architecture and num_classes
        arch = checkpoint.get("arch") or checkpoint.get("model_name", "efficientnet_b0")
        # Normalize arch name
        if isinstance(arch, str):
            arch = arch.lower().replace("-", "_").replace(" ", "_")
        
        # Get num_classes from checkpoint or infer from model_type
        if checkpoint.get("num_classes"):
            num_classes = checkpoint.get("num_classes")
        elif model_type == "binary":
            num_classes = 2
        elif model_type == "severity":
            num_classes = 4
        elif model_type == "type":
            num_classes = 6
        else:
            num_classes = 4
        
        # Validate num_classes matches class_names length for type model
        if model_type == "type" and checkpoint.get("class_names"):
            if len(checkpoint.get("class_names")) != num_classes:
                print(f"⚠️  WARNING: num_classes ({num_classes}) doesn't match class_names length ({len(checkpoint.get('class_names'))})")
        
        # Create model architecture
        if arch in ["efficientnet_b0", "efficientnet"]:
            model = create_efficientnet_b0(num_classes)
        elif arch == "resnet18":
            model = create_resnet18(num_classes)
        elif arch in ["mobilenet_v2", "mobilenet"]:
            model = create_mobilenet_v2(num_classes)
        else:
            print(f"⚠️  Unknown architecture: {arch}, using EfficientNet-B0")
            model = create_efficientnet_b0(num_classes)
        
        # Load weights
        state_dict = None
        if "model_state_dict" in checkpoint:
            state_dict = checkpoint["model_state_dict"]
        elif "state_dict" in checkpoint:
            state_dict = checkpoint["state_dict"]
        else:
            print(f"❌ No state_dict found in checkpoint")
            return False
        
        # Try to load with strict=False to handle minor mismatches
        try:
            model.load_state_dict(state_dict, strict=False)
        except RuntimeError as e:
            print(f"⚠️  Warning: Some weights couldn't be loaded: {e}")
            # Try loading only matching keys
            model_dict = model.state_dict()
            pretrained_dict = {k: v for k, v in state_dict.items() if k in model_dict and model_dict[k].shape == v.shape}
            model_dict.update(pretrained_dict)
            model.load_state_dict(model_dict)
            print(f"✅ Loaded {len(pretrained_dict)}/{len(state_dict)} parameters")
        
        model.eval()
        
        # Create dummy input (1, 3, 224, 224) - RGB image
        dummy_input = torch.randn(1, 3, 224, 224)
        
        # Export to ONNX
        torch.onnx.export(
            model,
            dummy_input,
            str(output_path),
            export_params=True,
            opset_version=11,  # ONNX opset version
            do_constant_folding=True,
            input_names=['input'],
            output_names=['output'],
            dynamic_axes={
                'input': {0: 'batch_size'},
                'output': {0: 'batch_size'}
            }
        )
        
        print(f"✅ Successfully converted to {output_path}")
        
        # Log class order for type model
        if model_type == "type" and checkpoint.get("class_names"):
            print(f"📋 Class order preserved in ONNX model:")
            for idx, cls in enumerate(checkpoint.get("class_names")):
                print(f"   Index {idx}: {cls}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error converting {checkpoint_path.name}: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Convert all models to ONNX format."""
    print("🚀 Starting model conversion to ONNX...")
    print(f"📁 Model directory: {MODEL_DIR}")
    print(f"📁 Output directory: {OUTPUT_DIR}")
    
    converted = 0
    failed = 0
    
    # Convert severity models
    severity_patterns = [
        ("acne_severity_*_best.pth", "severity"),
        ("acne_mobilenet_v2_best.pth", "severity"),  # Check if this is severity
    ]
    
    for pattern, model_type in severity_patterns:
        for model_file in MODEL_DIR.glob(pattern):
            output_name = model_file.stem + ".onnx"
            output_path = OUTPUT_DIR / output_name
            if convert_model_to_onnx(model_file, output_path, model_type):
                converted += 1
            else:
                failed += 1
    
    # Convert binary models
    for model_file in MODEL_DIR.glob("acne_binary_*_best.pth"):
        output_name = model_file.stem + ".onnx"
        output_path = OUTPUT_DIR / output_name
        if convert_model_to_onnx(model_file, output_path, "binary"):
            converted += 1
        else:
            failed += 1
    
    # Convert type model
    type_model = MODEL_DIR / "acne_type_best.pth"
    if type_model.exists():
        output_path = OUTPUT_DIR / "acne_type_best.onnx"
        if convert_model_to_onnx(type_model, output_path, "type"):
            converted += 1
        else:
            failed += 1
    else:
        print(f"⚠️  Type model not found: {type_model}")
    
    print(f"\n📊 Conversion Summary:")
    print(f"   ✅ Converted: {converted}")
    print(f"   ❌ Failed: {failed}")
    print(f"\n💾 ONNX models saved to: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()

