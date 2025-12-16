import { AppDataSource } from '../database/connection';
import { Prescription } from '../models/Prescription';
import { Diagnosis } from '../models/Diagnosis';
import { v4 as uuidv4 } from 'uuid';

// Treatment guidelines (rule-based)
const TREATMENT_DB: Record<string, any> = {
  clear: {
    topical: [
      { name: 'Gentle cleanser', type: 'topical', dosage: 'As directed', frequency: 'Twice daily', duration: 'Ongoing', instructions: 'Use morning and evening', warnings: [] },
      { name: 'Non-comedogenic moisturizer', type: 'topical', dosage: 'As directed', frequency: 'Twice daily', duration: 'Ongoing', instructions: 'Apply after cleansing', warnings: [] },
    ],
    oral: [],
    lifestyle: ['Maintain skincare routine', 'Use sunscreen daily'],
  },
  mild: {
    topical: [
      {
        name: 'Benzoyl Peroxide 2.5%',
        type: 'topical',
        dosage: 'Apply thin layer',
        frequency: 'Once daily at night',
        duration: '8 weeks',
        instructions: 'Start every other day, increase to daily.',
        warnings: ['May bleach fabrics'],
      },
      {
        name: 'Salicylic Acid 2%',
        type: 'topical',
        dosage: 'Apply to affected areas',
        frequency: 'Twice daily',
        duration: '8 weeks',
        instructions: 'Use as cleanser or leave-on.',
        warnings: ['May cause dryness'],
      },
    ],
    oral: [],
    lifestyle: ['Gentle cleansing twice daily', 'Avoid touching face', 'Use non-comedogenic products'],
  },
  moderate: {
    topical: [
      {
        name: 'Benzoyl Peroxide 5%',
        type: 'topical',
        dosage: 'Apply thin layer',
        frequency: 'Once daily at night',
        duration: '12 weeks',
        instructions: 'Apply to affected areas after cleansing.',
        warnings: ['May bleach fabrics', 'Avoid eye area'],
      },
      {
        name: 'Adapalene 0.1%',
        type: 'topical',
        dosage: 'Apply pea-sized amount',
        frequency: 'Once daily at night',
        duration: '12 weeks',
        instructions: 'Apply 20 min after washing. Expect initial worsening.',
        warnings: ['Avoid sun exposure', 'Not for pregnancy'],
      },
    ],
    oral: [],
    lifestyle: ['Gentle cleansing twice daily', 'Oil-free products', 'Change pillowcases frequently', 'Reduce dairy intake'],
  },
  severe: {
    topical: [
      {
        name: 'Benzoyl Peroxide 5%',
        type: 'topical',
        dosage: 'Apply thin layer',
        frequency: 'Once daily',
        duration: '12 weeks',
        instructions: 'Apply after cleansing.',
        warnings: ['May bleach fabrics'],
      },
      {
        name: 'Clindamycin 1%',
        type: 'topical',
        dosage: 'Apply thin layer',
        frequency: 'Twice daily',
        duration: '8 weeks',
        instructions: 'Use with benzoyl peroxide.',
        warnings: ['Do not use alone long-term'],
      },
    ],
    oral: [
      {
        name: 'Doxycycline 100mg',
        type: 'oral',
        dosage: '100mg',
        frequency: 'Twice daily',
        duration: '3 months',
        instructions: 'Take with food and water.',
        warnings: ['Avoid sun', 'Not for pregnancy'],
      },
    ],
    lifestyle: ['Dermatologist follow-up recommended', 'Sun protection critical', 'Monitor for side effects'],
  },
  very_severe: {
    topical: [
      {
        name: 'Benzoyl Peroxide 5%',
        type: 'topical',
        dosage: 'Apply thin layer',
        frequency: 'Once daily',
        duration: 'Ongoing',
        instructions: 'Supportive therapy.',
        warnings: ['May bleach fabrics'],
      },
    ],
    oral: [
      {
        name: 'Isotretinoin (Accutane)',
        type: 'oral',
        dosage: 'As prescribed by specialist',
        frequency: 'Once daily',
        duration: '4-6 months',
        instructions: 'REQUIRES SPECIALIST. Monthly monitoring.',
        warnings: ['Severe birth defects', 'Liver monitoring required', 'Depression risk'],
      },
    ],
    lifestyle: ['MANDATORY dermatologist care', 'Monthly blood tests', 'Pregnancy prevention required', 'No waxing or laser'],
  },
};

/**
 * Generate prescription based on diagnosis
 */
export function generatePrescription(
  severity: string,
  lesionCounts: Record<string, number>,
  clinicalMetadata: Record<string, any> = {},
  problemSummary?: Record<string, any>,
  additionalNotes?: string
): {
  medications: any[];
  lifestyleRecommendations: string[];
  followUpInstructions: string;
  reasoning: string;
} {
  const guidelines = TREATMENT_DB[severity] || TREATMENT_DB.mild;
  const allergies = (clinicalMetadata.allergies || []) as string[];

  // Build medications list (filter by allergies)
  const medications: any[] = [];
  
  for (const med of guidelines.topical) {
    const medName = typeof med === 'string' ? med : med.name;
    const hasAllergy = allergies.some(a => medName.toLowerCase().includes(a.toLowerCase()));
    if (!hasAllergy) {
      medications.push(typeof med === 'string' ? { name: med, type: 'topical' } : med);
    }
  }

  for (const med of guidelines.oral) {
    const medName = typeof med === 'string' ? med : med.name;
    const hasAllergy = allergies.some(a => medName.toLowerCase().includes(a.toLowerCase()));
    if (!hasAllergy) {
      medications.push(typeof med === 'string' ? { name: med, type: 'oral' } : med);
    }
  }

  // Generate reasoning
  const reasoning = `Prescription generated based on ${severity} acne severity. ` +
    `Treatment plan includes ${medications.length} medication(s) targeting inflammation and bacterial growth. ` +
    (additionalNotes ? `Additional notes: ${additionalNotes}. ` : '') +
    `Follow lifestyle recommendations for optimal results.`;

  // Follow-up instructions
  const followUpInstructions = severity === 'very_severe'
    ? 'MANDATORY: Schedule appointment with dermatologist within 1 week. Monthly monitoring required.'
    : severity === 'severe'
    ? 'Schedule follow-up with dermatologist in 4-6 weeks. Monitor for improvement and side effects.'
    : 'Follow-up in 8-12 weeks. Contact healthcare provider if condition worsens or no improvement.';

  return {
    medications,
    lifestyleRecommendations: guidelines.lifestyle,
    followUpInstructions,
    reasoning,
  };
}

/**
 * Create prescription record
 */
export async function createPrescription(
  userId: string,
  diagnosisId: string,
  severity: string,
  prescriptionData: {
    medications: any[];
    lifestyleRecommendations: string[];
    followUpInstructions: string;
    reasoning: string;
  }
): Promise<Prescription> {
  const prescriptionRepository = AppDataSource.getRepository(Prescription);

  const prescription = prescriptionRepository.create({
    id: uuidv4().substring(0, 8),
    userId,
    diagnosisId,
    severity,
    medications: prescriptionData.medications,
    lifestyleRecommendations: prescriptionData.lifestyleRecommendations,
    followUpInstructions: prescriptionData.followUpInstructions,
    reasoning: prescriptionData.reasoning,
    status: 'generated',
  });

  await prescriptionRepository.save(prescription);
  return prescription;
}

/**
 * Get prescription by ID
 */
export async function getPrescriptionById(
  prescriptionId: string,
  userId: string
): Promise<Prescription | null> {
  const prescriptionRepository = AppDataSource.getRepository(Prescription);
  return prescriptionRepository.findOne({
    where: { id: prescriptionId, userId },
  });
}

/**
 * Get prescription by diagnosis ID
 */
export async function getPrescriptionByDiagnosisId(
  diagnosisId: string,
  userId: string
): Promise<Prescription | null> {
  const prescriptionRepository = AppDataSource.getRepository(Prescription);
  return prescriptionRepository.findOne({
    where: { diagnosisId, userId },
  });
}

/**
 * List prescriptions for a user
 */
export async function listPrescriptions(userId: string): Promise<Prescription[]> {
  const prescriptionRepository = AppDataSource.getRepository(Prescription);
  return prescriptionRepository.find({
    where: { userId },
    order: { createdAt: 'DESC' },
  });
}

/**
 * Translate prescription (simplified - can be enhanced)
 */
export function translatePrescription(
  medications: any[],
  recommendations: string[],
  instructions: string,
  targetLanguage: string
): {
  medications: any[];
  lifestyleRecommendations: string[];
  followUpInstructions: string;
} {
  // Simple translation dictionary
  const terms: Record<string, string> = {
    'apply': 'రాయండి',
    'take': 'తీసుకోండి',
    'daily': 'రోజూ',
    'twice daily': 'రోజుకు రెండుసార్లు',
    'once daily': 'రోజుకు ఒకసారి',
    'at night': 'రాత్రి',
    'morning': 'ఉదయం',
    'with food': 'ఆహారంతో',
    'weeks': 'వారాలు',
    'months': 'నెలలు',
  };

  if (targetLanguage === 'en') {
    return { medications, lifestyleRecommendations: recommendations, followUpInstructions: instructions };
  }

  // Simple translation for Telugu (can be enhanced with proper translation service)
  const translateText = (text: string): string => {
    let translated = text;
    Object.entries(terms).forEach(([en, te]) => {
      translated = translated.replace(new RegExp(en, 'gi'), te);
    });
    return translated;
  };

  const translatedMedications = medications.map(med => ({
    ...med,
    name: translateText(med.name),
    instructions: translateText(med.instructions),
  }));

  return {
    medications: translatedMedications,
    lifestyleRecommendations: recommendations.map(translateText),
    followUpInstructions: translateText(instructions),
  };
}

