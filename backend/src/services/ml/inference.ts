import * as ort from 'onnxruntime-node';
import { join } from 'path';
import { existsSync } from 'fs';
import { preprocessImage } from './preprocess';
import { Tensor } from 'onnxruntime-node';

// Model paths - ONNX models should be in backend-node/model after conversion
const MODEL_DIR = join(process.cwd(), 'model');
const BINARY_MODEL_PATH = join(MODEL_DIR, 'acne_binary_efficientnet_b0_best.onnx');
const SEVERITY_MODEL_PATH = join(MODEL_DIR, 'acne_severity_efficientnet_b0_best.onnx');

// Lazy-loaded model sessions
let binarySession: ort.InferenceSession | null = null;
let severitySession: ort.InferenceSession | null = null;

/**
 * Load ONNX model session (lazy loading)
 */
async function loadModel(modelPath: string, sessionName: string): Promise<ort.InferenceSession | null> {
  if (!existsSync(modelPath)) {
    console.warn(`⚠️  ${sessionName} model not found at ${modelPath}`);
    return null;
  }

  try {
    const session = await ort.InferenceSession.create(modelPath, {
      executionProviders: ['cpu'], // Use CPU (can add 'cuda' if GPU available)
    });
    console.log(`✅ Loaded ${sessionName} model`);
    return session;
  } catch (error) {
    console.error(`❌ Error loading ${sessionName} model:`, error);
    return null;
  }
}

/**
 * Initialize all ML models
 */
export async function initializeModels(): Promise<void> {
  console.log('🔧 Initializing ML models...');
  
  // Try to load models (prefer efficientnet_b0, fallback to others)
  const binaryPatterns = [
    'acne_binary_efficientnet_b0_best.onnx',
    'acne_binary_resnet18_best.onnx',
    'acne_binary_mobilenet_v2_best.onnx',
  ];
  
  const severityPatterns = [
    'acne_severity_efficientnet_b0_best.onnx',
    'acne_severity_resnet18_best.onnx',
    'acne_severity_mobilenet_v2_best.onnx',
  ];

  // Load binary model
  let binaryLoaded = false;
  for (const pattern of binaryPatterns) {
    const path = join(MODEL_DIR, pattern);
    if (existsSync(path)) {
      binarySession = await loadModel(path, 'Binary');
      binaryLoaded = true;
      break;
    }
  }
  if (!binaryLoaded) {
    console.warn(`⚠️  No binary model found. Tried: ${binaryPatterns.join(', ')}`);
    console.warn(`   Model directory: ${MODEL_DIR}`);
  }

  // Load severity model
  let severityLoaded = false;
  for (const pattern of severityPatterns) {
    const path = join(MODEL_DIR, pattern);
    if (existsSync(path)) {
      severitySession = await loadModel(path, 'Severity');
      severityLoaded = true;
      break;
    }
  }
  if (!severityLoaded) {
    console.warn(`⚠️  No severity model found. Tried: ${severityPatterns.join(', ')}`);
    console.warn(`   Model directory: ${MODEL_DIR}`);
  }

  console.log('✅ ML models initialization complete');
  
  // Log which models are loaded
  console.log(`📊 Model Status:
    - Binary: ${binarySession ? '✅ Loaded' : '❌ Not loaded'}
    - Severity: ${severitySession ? '✅ Loaded' : '❌ Not loaded'}`);
  
  if (!binarySession || !severitySession) {
    console.error('❌ CRITICAL: Required models (binary or severity) are not loaded!');
    console.error('   Please convert PyTorch models to ONNX format using:');
    console.error('   python backend-node/scripts/convert-models-to-onnx.py');
  }
}

/**
 * Run inference on an ONNX model
 */
async function runInference(
  session: ort.InferenceSession | null,
  inputTensor: Tensor
): Promise<Float32Array | null> {
  if (!session) {
    return null;
  }

  try {
    // Get input/output names from the model
    const inputName = session.inputNames[0];
    const outputName = session.outputNames[0];
    
    const results = await session.run({ [inputName]: inputTensor });
    const output = results[outputName];
    
    if (output && output.data) {
      const data = output.data as Float32Array;
      console.log(`🔍 Model output shape: [${output.dims.join(', ')}], length: ${data.length}`);
      return data;
    }
    return null;
  } catch (error) {
    console.error('❌ Inference error:', error);
    return null;
  }
}

/**
 * Apply softmax to logits
 */
function softmax(logits: Float32Array): Float32Array {
  const max = Math.max(...Array.from(logits));
  const exp = logits.map(x => Math.exp(x - max));
  const sum = exp.reduce((a, b) => a + b, 0);
  return new Float32Array(exp.map(x => x / sum));
}

/**
 * Binary classification (acne detection)
 */
export interface BinaryResult {
  hasAcne: boolean;
  confidence: number;
  probabilities: {
    noAcne: number;
    hasAcne: number;
  };
}

export async function predictBinary(imagePath: string): Promise<BinaryResult | null> {
  if (!binarySession) {
    console.error('❌ Binary model session not loaded');
    return null;
  }

  let inputTensor: Tensor;
  try {
    inputTensor = await preprocessImage(imagePath);
  } catch (error: any) {
    console.error('❌ Image preprocessing failed:', error);
    throw new Error(`Image preprocessing failed: ${error.message}`);
  }

  const logits = await runInference(binarySession, inputTensor);

  if (!logits || logits.length < 2) {
    return null;
  }

  const probs = softmax(logits);
  
  // Debug: log raw outputs
  console.log(`🔍 Binary classification raw logits: [${Array.from(logits).map(x => x.toFixed(3)).join(', ')}]`);
  console.log(`🔍 Binary classification probabilities: [${Array.from(probs).map(x => x.toFixed(3)).join(', ')}]`);
  
  // Binary model output interpretation:
  // Based on training: label 0 = no acne, label 1 = has acne
  // Model outputs: [prob_no_acne, prob_has_acne]
  // So: index 0 = no acne, index 1 = has acne
  
  // IMPORTANT: If results are consistently wrong, try setting this to true
  // This will swap the interpretation: index 0 = has acne, index 1 = no acne
  const REVERSE_BINARY_INTERPRETATION = false;
  
  let predictedClass: number;
  let noAcneProb: number;
  let hasAcneProb: number;
  
  if (REVERSE_BINARY_INTERPRETATION) {
    // Reversed interpretation: index 0 = has acne, index 1 = no acne
    predictedClass = probs[0] > probs[1] ? 1 : 0;
    noAcneProb = probs[1];
    hasAcneProb = probs[0];
    console.log(`⚠️  Using REVERSED binary interpretation (index 0 = has acne)`);
  } else {
    // Normal interpretation: index 0 = no acne, index 1 = has acne
    predictedClass = probs[1] > probs[0] ? 1 : 0;
    noAcneProb = probs[0];
    hasAcneProb = probs[1];
  }
  
  // Confidence is the probability of the predicted class
  const confidence = predictedClass === 1 ? hasAcneProb : noAcneProb;

  console.log(`🔍 Binary prediction: class=${predictedClass} (${predictedClass === 1 ? 'hasAcne' : 'noAcne'}), confidence=${confidence.toFixed(3)}`);
  console.log(`🔍 Binary probabilities: noAcne=${noAcneProb.toFixed(3)}, hasAcne=${hasAcneProb.toFixed(3)}`);

  return {
    hasAcne: predictedClass === 1,
    confidence,
    probabilities: {
      noAcne: noAcneProb,
      hasAcne: hasAcneProb,
    },
  };
}

/**
 * Severity classification (mild, moderate, severe, very_severe)
 */
export interface SeverityResult {
  severity: string;
  severityIndex: number;
  confidence: number;
  allScores: Record<string, number>;
}

const SEVERITY_LABELS = ['mild', 'moderate', 'severe', 'very_severe'];

export async function predictSeverity(imagePath: string): Promise<SeverityResult | null> {
  if (!severitySession) {
    console.error('❌ Severity model session not loaded');
    return null;
  }

  let inputTensor: Tensor;
  try {
    inputTensor = await preprocessImage(imagePath);
  } catch (error: any) {
    console.error('❌ Image preprocessing failed:', error);
    throw new Error(`Image preprocessing failed: ${error.message}`);
  }

  const logits = await runInference(severitySession, inputTensor);

  if (!logits || logits.length < 4) {
    return null;
  }

  const probs = softmax(logits);
  
  // Debug: log raw outputs
  console.log(`🔍 Severity classification raw logits: [${Array.from(logits).map(x => x.toFixed(3)).join(', ')}]`);
  console.log(`🔍 Severity classification probabilities: [${Array.from(probs).map(x => x.toFixed(3)).join(', ')}]`);
  console.log(`🔍 Severity label mapping: ${SEVERITY_LABELS.map((l, i) => `${i}=${l}`).join(', ')}`);
  
  let maxIdx = 0;
  let maxProb = probs[0];
  for (let i = 1; i < probs.length; i++) {
    if (probs[i] > maxProb) {
      maxProb = probs[i];
      maxIdx = i;
    }
  }

  const allScores: Record<string, number> = {};
  SEVERITY_LABELS.forEach((label, idx) => {
    allScores[label] = probs[idx];
  });

  console.log(`🔍 Severity prediction: index=${maxIdx}, severity=${SEVERITY_LABELS[maxIdx]}, confidence=${maxProb.toFixed(3)}`);

  return {
    severity: SEVERITY_LABELS[maxIdx],
    severityIndex: maxIdx + 1, // Map 0-3 to 1-4
    confidence: maxProb,
    allScores,
  };
}

/**
 * Two-stage classification: binary + severity (if acne detected)
 */
export interface ClassificationResult {
  hasAcne: boolean;
  binaryConfidence: number;
  severity: string;
  confidence: number;
  allScores: Record<string, number>;
  severityIndex: number;
}

export async function classify(imagePath: string): Promise<ClassificationResult | null> {
  // Stage 1: Binary classification
  let binaryResult;
  try {
    binaryResult = await predictBinary(imagePath);
    if (!binaryResult) {
      console.error('❌ Binary classification returned null');
      return null;
    }
  } catch (error: any) {
    console.error('❌ Binary classification error:', error);
    throw error;
  }

  // If no acne, return clear result
  if (!binaryResult.hasAcne) {
    return {
      hasAcne: false,
      binaryConfidence: binaryResult.confidence,
      severity: 'clear',
      confidence: binaryResult.confidence,
      allScores: { clear: 1.0, mild: 0, moderate: 0, severe: 0, very_severe: 0 },
      severityIndex: 0,
    };
  }

  // Stage 2: Severity classification
  let severityResult;
  try {
    severityResult = await predictSeverity(imagePath);
    if (!severityResult) {
      console.error('❌ Severity classification returned null');
      return null;
    }
  } catch (error: any) {
    console.error('❌ Severity classification error:', error);
    throw error;
  }

  // Combine all scores
  const allScores: Record<string, number> = {
    clear: 0,
    mild: 0,
    moderate: 0,
    severe: 0,
    very_severe: 0,
  };
  allScores[severityResult.severity] = severityResult.confidence;
  Object.entries(severityResult.allScores).forEach(([label, score]) => {
    if (label in allScores) {
      allScores[label] = Math.max(allScores[label], score);
    }
  });

  return {
    hasAcne: true,
    binaryConfidence: binaryResult.confidence,
    severity: severityResult.severity,
    confidence: severityResult.confidence,
    allScores,
    severityIndex: severityResult.severityIndex,
  };
}

