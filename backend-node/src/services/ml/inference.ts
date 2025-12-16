import * as ort from 'onnxruntime-node';
import { join } from 'path';
import { existsSync } from 'fs';
import { preprocessImage } from './preprocess';
import { Tensor } from 'onnxruntime-node';

// Model paths - ONNX models should be in backend-node/model after conversion
const MODEL_DIR = join(process.cwd(), 'model');
const BINARY_MODEL_PATH = join(MODEL_DIR, 'acne_binary_efficientnet_b0_best.onnx');
const SEVERITY_MODEL_PATH = join(MODEL_DIR, 'acne_severity_efficientnet_b0_best.onnx');
const TYPE_MODEL_PATH = join(MODEL_DIR, 'acne_type_best.onnx');

// Lazy-loaded model sessions
let binarySession: ort.InferenceSession | null = null;
let severitySession: ort.InferenceSession | null = null;
let typeSession: ort.InferenceSession | null = null;

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
  for (const pattern of binaryPatterns) {
    const path = join(MODEL_DIR, pattern);
    if (existsSync(path)) {
      binarySession = await loadModel(path, 'Binary');
      break;
    }
  }

  // Load severity model
  for (const pattern of severityPatterns) {
    const path = join(MODEL_DIR, pattern);
    if (existsSync(path)) {
      severitySession = await loadModel(path, 'Severity');
      break;
    }
  }

  // Load type model
  if (existsSync(TYPE_MODEL_PATH)) {
    typeSession = await loadModel(TYPE_MODEL_PATH, 'Type');
  }

  console.log('✅ ML models initialization complete');
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
    const results = await session.run({ input: inputTensor });
    const output = results.output;
    
    if (output && output.data) {
      return output.data as Float32Array;
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
    return null;
  }

  const inputTensor = await preprocessImage(imagePath);
  const logits = await runInference(binarySession, inputTensor);

  if (!logits || logits.length < 2) {
    return null;
  }

  const probs = softmax(logits);
  const predictedClass = probs[0] < probs[1] ? 1 : 0;
  const confidence = probs[predictedClass];

  return {
    hasAcne: predictedClass === 1,
    confidence,
    probabilities: {
      noAcne: probs[0],
      hasAcne: probs[1],
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
    return null;
  }

  const inputTensor = await preprocessImage(imagePath);
  const logits = await runInference(severitySession, inputTensor);

  if (!logits || logits.length < 4) {
    return null;
  }

  const probs = softmax(logits);
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

  return {
    severity: SEVERITY_LABELS[maxIdx],
    severityIndex: maxIdx + 1, // Map 0-3 to 1-4
    confidence: maxProb,
    allScores,
  };
}

/**
 * Type classification (blackhead, Pustula, whitehead, cysts, papules, nodules)
 */
export interface TypeResult {
  type: string;
  confidence: number;
  allScores: Record<string, number>;
}

const TYPE_LABELS = ['Pustula', 'blackhead', 'cysts', 'nodules', 'papules', 'whitehead'];

export async function predictType(imagePath: string): Promise<TypeResult | null> {
  if (!typeSession) {
    return null;
  }

  const inputTensor = await preprocessImage(imagePath);
  const logits = await runInference(typeSession, inputTensor);

  if (!logits || logits.length < 6) {
    return null;
  }

  const probs = softmax(logits);
  let maxIdx = 0;
  let maxProb = probs[0];
  for (let i = 1; i < probs.length; i++) {
    if (probs[i] > maxProb) {
      maxProb = probs[i];
      maxIdx = i;
    }
  }

  const allScores: Record<string, number> = {};
  TYPE_LABELS.forEach((label, idx) => {
    allScores[label] = probs[idx];
  });

  return {
    type: TYPE_LABELS[maxIdx],
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
  const binaryResult = await predictBinary(imagePath);
  if (!binaryResult) {
    return null;
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
  const severityResult = await predictSeverity(imagePath);
  if (!severityResult) {
    return null;
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

