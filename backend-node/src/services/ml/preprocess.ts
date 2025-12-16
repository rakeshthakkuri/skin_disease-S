import sharp from 'sharp';
import { Tensor } from 'onnxruntime-node';

/**
 * Preprocess image for model inference
 * Resizes to 224x224 and normalizes with ImageNet stats
 */
export async function preprocessImage(imagePath: string): Promise<Tensor> {
  // Load and resize image
  const imageBuffer = await sharp(imagePath)
    .resize(224, 224, {
      fit: 'fill',
      background: { r: 0, g: 0, b: 0 },
    })
    .removeAlpha()
    .raw()
    .toBuffer();

  // Convert to Float32Array and normalize
  const imageData = new Float32Array(3 * 224 * 224);
  const pixels = new Uint8Array(imageBuffer);

  // ImageNet normalization: mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]
  const mean = [0.485, 0.456, 0.406];
  const std = [0.229, 0.224, 0.225];

  for (let i = 0; i < 224 * 224; i++) {
    const r = pixels[i * 3] / 255.0;
    const g = pixels[i * 3 + 1] / 255.0;
    const b = pixels[i * 3 + 2] / 255.0;

    // Normalize: (pixel / 255 - mean) / std
    imageData[i] = (r - mean[0]) / std[0]; // R channel
    imageData[i + 224 * 224] = (g - mean[1]) / std[1]; // G channel
    imageData[i + 2 * 224 * 224] = (b - mean[2]) / std[2]; // B channel
  }

  // Create tensor: [1, 3, 224, 224] (batch, channels, height, width)
  return new Tensor('float32', imageData, [1, 3, 224, 224]);
}

