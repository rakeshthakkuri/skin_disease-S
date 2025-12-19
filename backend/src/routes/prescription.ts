import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { AppDataSource } from '../database/connection';
import { Diagnosis } from '../models/Diagnosis';
import {
  generatePrescription,
  createPrescription,
  getPrescriptionById,
  getPrescriptionByDiagnosisId,
  listPrescriptions,
  translatePrescription,
} from '../services/prescriptionService';

const router = Router();

/**
 * POST /api/v1/prescription/generate
 * Generate AI-powered prescription based on diagnosis
 */
router.post(
  '/generate',
  authenticate,
  [
    body('diagnosis_id').notEmpty().withMessage('diagnosis_id is required'),
    body('additional_notes').optional().isString(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ detail: errors.array() });
      }

      const { diagnosis_id, additional_notes } = req.body;
      const user = req.user!;

      // Get diagnosis (user-specific)
      const diagnosisRepository = AppDataSource.getRepository(Diagnosis);
      const diagnosis = await diagnosisRepository.findOne({
        where: { id: diagnosis_id, userId: user.id },
      });

      if (!diagnosis) {
        return res.status(404).json({ detail: 'Diagnosis not found' });
      }

      // Check if prescription already exists
      const existing = await getPrescriptionByDiagnosisId(diagnosis_id, user.id);
      if (existing) {
        // Patients can only see approved prescriptions
        if (user.role === 'patient' && existing.status !== 'approved') {
          return res.json({
            id: existing.id,
            status: existing.status,
            message: existing.status === 'pending'
              ? 'Prescription is pending doctor approval'
              : 'Prescription was rejected',
            created_at: existing.createdAt.toISOString(),
          });
        }
        
        return res.json({
          id: existing.id,
          diagnosis_id: existing.diagnosisId || '',
          severity: existing.severity,
          medications: existing.medications,
          lifestyle_recommendations: existing.lifestyleRecommendations,
          follow_up_instructions: existing.followUpInstructions,
          reasoning: existing.reasoning,
          status: existing.status,
          doctor_notes: existing.doctorNotes,
          approved_at: existing.approvedAt?.toISOString(),
          created_at: existing.createdAt.toISOString(),
        });
      }

      // Generate prescription using Gemini API
      const prescriptionData = await generatePrescription(
        diagnosis.severity,
        diagnosis.lesionCounts,
        diagnosis.clinicalMetadata || {},
        diagnosis.problemSummary || undefined,
        additional_notes,
        diagnosis.acneType
      );

      // Create prescription record
      const prescription = await createPrescription(
        user.id,
        diagnosis_id,
        diagnosis.severity,
        prescriptionData
      );

      // Return appropriate response based on user role
      if (user.role === 'patient') {
        // Patients only see status, not full prescription until approved
        res.json({
          id: prescription.id,
          status: prescription.status,
          message: 'Prescription generated and sent for doctor approval. You will be notified once approved.',
          created_at: prescription.createdAt.toISOString(),
        });
      } else {
        // Doctors can see full prescription details
        res.json({
          id: prescription.id,
          diagnosis_id: prescription.diagnosisId || '',
          severity: prescription.severity,
          medications: prescription.medications,
          lifestyle_recommendations: prescription.lifestyleRecommendations,
          follow_up_instructions: prescription.followUpInstructions,
          reasoning: prescription.reasoning,
          status: prescription.status,
          created_at: prescription.createdAt.toISOString(),
        });
      }
    } catch (error) {
      console.error('Generate prescription error:', error);
      res.status(500).json({ detail: 'Internal server error' });
    }
  }
);

/**
 * GET /api/v1/prescription/:id
 * Get prescription by ID
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const prescription = await getPrescriptionById(id, user.id);
    if (!prescription) {
      return res.status(404).json({ detail: 'Prescription not found' });
    }

    res.json({
      id: prescription.id,
      diagnosis_id: prescription.diagnosisId,
      severity: prescription.severity,
      medications: prescription.medications,
      lifestyle_recommendations: prescription.lifestyleRecommendations,
      follow_up_instructions: prescription.followUpInstructions,
      reasoning: prescription.reasoning,
      status: prescription.status,
      created_at: prescription.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Get prescription error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

/**
 * GET /api/v1/prescription
 * List all prescriptions for current user (all statuses for patients: approved, rejected, pending)
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const prescriptions = await listPrescriptions(user.id);

    // Patients can see all their prescriptions (approved, rejected, pending)
    // Doctors can see all prescriptions
    // No filtering needed - return all prescriptions for the user

    res.json(
      prescriptions.map((p) => ({
        id: p.id,
        diagnosis_id: p.diagnosisId,
        severity: p.severity,
        medications: p.medications,
        lifestyle_recommendations: p.lifestyleRecommendations,
        follow_up_instructions: p.followUpInstructions,
        reasoning: p.reasoning,
        status: p.status,
        doctor_notes: p.doctorNotes,
        approved_at: p.approvedAt?.toISOString(),
        created_at: p.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error('List prescriptions error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

/**
 * POST /api/v1/prescription/translate
 * Translate prescription to English or Telugu
 */
router.post(
  '/translate',
  authenticate,
  [
    body('prescription_id').notEmpty(),
    body('target_language').isIn(['en', 'te', 'hi']),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ detail: errors.array() });
      }

      const { prescription_id, target_language } = req.body;
      const user = req.user!;

      const prescription = await getPrescriptionById(prescription_id, user.id);
      if (!prescription) {
        return res.status(404).json({ detail: 'Prescription not found' });
      }

      const translated = await translatePrescription(
        prescription.medications,
        prescription.lifestyleRecommendations,
        prescription.followUpInstructions,
        target_language as 'en' | 'te' | 'hi'
      );

      res.json({
        prescription_id,
        original_language: 'en',
        target_language,
        translated_content: {
          medications: translated.medications,
          lifestyle_recommendations: translated.lifestyleRecommendations,
          follow_up_instructions: translated.followUpInstructions,
        },
        translated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Translate prescription error:', error);
      res.status(500).json({ detail: 'Internal server error' });
    }
  }
);

export default router;

