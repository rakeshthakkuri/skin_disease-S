import { AppDataSource } from '../database/connection';
import { Diagnosis } from '../models/Diagnosis';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a diagnosis record
 */
export async function createDiagnosis(
  userId: string,
  data: {
    severity: string;
    confidence: number;
    severityScores: Record<string, number>;
    lesionCounts: Record<string, number>;
    affectedAreas: string[];
    clinicalNotes: string;
    recommendedUrgency: string;
    imageUrl: string;
    clinicalMetadata: Record<string, any>;
    problemSummary?: Record<string, any>;
  }
): Promise<Diagnosis> {
  const diagnosisRepository = AppDataSource.getRepository(Diagnosis);

  const diagnosis = diagnosisRepository.create({
    id: uuidv4().substring(0, 8),
    userId,
    ...data,
  });

  await diagnosisRepository.save(diagnosis);
  return diagnosis;
}

/**
 * Get diagnosis by ID
 */
export async function getDiagnosisById(
  diagnosisId: string,
  userId: string
): Promise<Diagnosis | null> {
  const diagnosisRepository = AppDataSource.getRepository(Diagnosis);
  return diagnosisRepository.findOne({
    where: { id: diagnosisId, userId },
  });
}

/**
 * List diagnoses for a user
 */
export async function listDiagnoses(userId: string): Promise<Diagnosis[]> {
  const diagnosisRepository = AppDataSource.getRepository(Diagnosis);
  return diagnosisRepository.find({
    where: { userId },
    order: { createdAt: 'DESC' },
  });
}

/**
 * Generate clinical notes based on severity and lesion counts
 */
export function generateClinicalNotes(
  severity: string,
  lesionCounts: Record<string, number>,
  metadata: Record<string, any> = {}
): string {
  const notes: string[] = [];
  const total = Object.values(lesionCounts).reduce((sum, count) => sum + count, 0);

  // Generate severity-specific notes
  if (severity === 'clear') {
    if (total === 0) {
      notes.push('No significant acne lesions detected.');
    } else {
      notes.push('Minimal acne lesions detected. Skin appears relatively clear.');
    }
  } else if (severity === 'mild') {
    notes.push(`Mild acne detected with ${total} total lesions (primarily comedones and papules).`);
  } else if (severity === 'moderate') {
    notes.push(`Moderate acne with ${total} total lesions including papules and pustules.`);
  } else if (severity === 'severe') {
    notes.push(`Severe acne with ${total} total lesions including numerous pustules and nodules.`);
  } else if (severity === 'very_severe') {
    notes.push(`Very severe cystic acne with ${total} total lesions including nodules and cysts. Requires aggressive treatment.`);
  } else {
    notes.push(`Acne severity: ${severity}. Total lesions detected: ${total}.`);
  }

  // Add specific lesion breakdown
  if (total > 0) {
    const lesionDetails: string[] = [];
    if (lesionCounts.nodules > 0 || lesionCounts.cysts > 0) {
      lesionDetails.push('nodular/cystic lesions present');
    }
    if (lesionCounts.pustules > 5) {
      lesionDetails.push('multiple inflammatory pustules');
    }
    if (lesionDetails.length > 0) {
      notes.push('Note: ' + lesionDetails.join(', ') + '.');
    }
  }

  // Add duration note if chronic (only if metadata provided)
  if (metadata && metadata.acne_duration_months && metadata.acne_duration_months > 12) {
    notes.push('Chronic acne (>12 months) - consider comprehensive treatment plan.');
  }

  return notes.join(' ');
}

/**
 * Get urgency based on severity
 */
export function getUrgency(severity: string): string {
  const urgencyMap: Record<string, string> = {
    clear: 'routine',
    mild: 'routine',
    moderate: 'soon',
    severe: 'soon',
    very_severe: 'urgent',
  };
  return urgencyMap[severity] || 'routine';
}

/**
 * Detect lesions based on severity (heuristic)
 */
export function detectLesions(severity: string, imageVariance?: number): Record<string, number> {
  const scale = imageVariance ? Math.min(imageVariance / 1000, 1.0) : 0.5;

  if (severity === 'clear') {
    return {
      comedones: 0,
      papules: 0,
      pustules: 0,
      nodules: 0,
      cysts: 0,
    };
  } else if (severity === 'mild') {
    return {
      comedones: Math.floor(5 * scale),
      papules: Math.floor(3 * scale),
      pustules: Math.floor(1 * scale),
      nodules: 0,
      cysts: 0,
    };
  } else if (severity === 'moderate') {
    return {
      comedones: Math.floor(15 * scale),
      papules: Math.floor(10 * scale),
      pustules: Math.floor(5 * scale),
      nodules: 0,
      cysts: 0,
    };
  } else if (severity === 'severe') {
    return {
      comedones: Math.floor(25 * scale),
      papules: Math.floor(20 * scale),
      pustules: Math.floor(15 * scale),
      nodules: Math.floor(3 * scale),
      cysts: 0,
    };
  } else if (severity === 'very_severe') {
    return {
      comedones: Math.floor(30 * scale),
      papules: Math.floor(25 * scale),
      pustules: Math.floor(20 * scale),
      nodules: Math.floor(10 * scale),
      cysts: Math.floor(5 * scale),
    };
  } else {
    return {
      comedones: Math.floor(20 * scale),
      papules: Math.floor(15 * scale),
      pustules: Math.floor(8 * scale),
      nodules: Math.floor(2 * scale),
      cysts: Math.floor(1 * scale),
    };
  }
}

