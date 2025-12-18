import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { AppDataSource } from '../database/connection';
import { Prescription } from '../models/Prescription';
import { Diagnosis } from '../models/Diagnosis';
import { User } from '../models/User';

const router = Router();

/**
 * Middleware to check if user is a doctor
 */
const requireDoctor = (req: Request, res: Response, next: any) => {
  const user = req.user!;
  if (user.role !== 'doctor') {
    return res.status(403).json({ detail: 'Access denied. Doctor role required.' });
  }
  next();
};

/**
 * GET /api/v1/doctor/prescriptions/pending
 * Get all pending prescriptions for doctor approval
 */
router.get('/prescriptions/pending', authenticate, requireDoctor, async (req: Request, res: Response) => {
  try {
    const prescriptionRepository = AppDataSource.getRepository(Prescription);
    const diagnosisRepository = AppDataSource.getRepository(Diagnosis);
    const userRepository = AppDataSource.getRepository(User);

    const pendingPrescriptions = await prescriptionRepository.find({
      where: { status: 'pending' },
      relations: ['user', 'diagnosis'],
      order: { createdAt: 'DESC' },
    });

    const prescriptionsWithDetails = await Promise.all(
      pendingPrescriptions.map(async (prescription) => {
        const diagnosis = prescription.diagnosisId
          ? await diagnosisRepository.findOne({
              where: { id: prescription.diagnosisId },
            })
          : null;

        return {
          id: prescription.id,
          patient: {
            id: prescription.user.id,
            name: prescription.user.fullName,
            email: prescription.user.email,
          },
          diagnosis: diagnosis
            ? {
                id: diagnosis.id,
                severity: diagnosis.severity,
                confidence: diagnosis.confidence,
                lesion_counts: diagnosis.lesionCounts,
                clinical_notes: diagnosis.clinicalNotes,
                image_url: diagnosis.imageUrl,
                created_at: diagnosis.createdAt.toISOString(),
              }
            : null,
          prescription: {
            severity: prescription.severity,
            medications: prescription.medications,
            lifestyle_recommendations: prescription.lifestyleRecommendations,
            follow_up_instructions: prescription.followUpInstructions,
            reasoning: prescription.reasoning,
          },
          created_at: prescription.createdAt.toISOString(),
        };
      })
    );

    res.json(prescriptionsWithDetails);
  } catch (error) {
    console.error('Get pending prescriptions error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

/**
 * POST /api/v1/doctor/prescriptions/:id/approve
 * Approve a prescription
 */
router.post(
  '/prescriptions/:id/approve',
  authenticate,
  requireDoctor,
  [
    body('doctor_notes').optional().isString(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ detail: errors.array() });
      }

      const { id } = req.params;
      const { doctor_notes } = req.body;
      const doctor = req.user!;

      const prescriptionRepository = AppDataSource.getRepository(Prescription);
      const prescription = await prescriptionRepository.findOne({
        where: { id },
        relations: ['user'],
      });

      if (!prescription) {
        return res.status(404).json({ detail: 'Prescription not found' });
      }

      if (prescription.status !== 'pending') {
        return res.status(400).json({ detail: `Prescription is already ${prescription.status}` });
      }

      prescription.status = 'approved';
      prescription.doctorId = doctor.id;
      prescription.approvedAt = new Date();
      prescription.doctorNotes = doctor_notes || null;

      await prescriptionRepository.save(prescription);

      res.json({
        id: prescription.id,
        status: prescription.status,
        doctor_id: prescription.doctorId,
        approved_at: prescription.approvedAt?.toISOString(),
        doctor_notes: prescription.doctorNotes,
        message: 'Prescription approved successfully',
      });
    } catch (error) {
      console.error('Approve prescription error:', error);
      res.status(500).json({ detail: 'Internal server error' });
    }
  }
);

/**
 * POST /api/v1/doctor/prescriptions/:id/reject
 * Reject a prescription
 */
router.post(
  '/prescriptions/:id/reject',
  authenticate,
  requireDoctor,
  [
    body('doctor_notes').notEmpty().withMessage('Rejection reason is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ detail: errors.array() });
      }

      const { id } = req.params;
      const { doctor_notes } = req.body;
      const doctor = req.user!;

      const prescriptionRepository = AppDataSource.getRepository(Prescription);
      const prescription = await prescriptionRepository.findOne({
        where: { id },
      });

      if (!prescription) {
        return res.status(404).json({ detail: 'Prescription not found' });
      }

      if (prescription.status !== 'pending') {
        return res.status(400).json({ detail: `Prescription is already ${prescription.status}` });
      }

      prescription.status = 'rejected';
      prescription.doctorId = doctor.id;
      prescription.approvedAt = new Date();
      prescription.doctorNotes = doctor_notes;

      await prescriptionRepository.save(prescription);

      res.json({
        id: prescription.id,
        status: prescription.status,
        doctor_id: prescription.doctorId,
        rejected_at: prescription.approvedAt?.toISOString(),
        doctor_notes: prescription.doctorNotes,
        message: 'Prescription rejected',
      });
    } catch (error) {
      console.error('Reject prescription error:', error);
      res.status(500).json({ detail: 'Internal server error' });
    }
  }
);

/**
 * GET /api/v1/doctor/prescriptions
 * Get all prescriptions (approved, rejected, pending) for doctor review
 */
router.get('/prescriptions', authenticate, requireDoctor, async (req: Request, res: Response) => {
  try {
    const prescriptionRepository = AppDataSource.getRepository(Prescription);
    const diagnosisRepository = AppDataSource.getRepository(Diagnosis);

    const prescriptions = await prescriptionRepository.find({
      relations: ['user', 'diagnosis'],
      order: { createdAt: 'DESC' },
    });

    const prescriptionsWithDetails = await Promise.all(
      prescriptions.map(async (prescription) => {
        const diagnosis = prescription.diagnosisId
          ? await diagnosisRepository.findOne({
              where: { id: prescription.diagnosisId },
            })
          : null;

        return {
          id: prescription.id,
          patient: {
            id: prescription.user.id,
            name: prescription.user.fullName,
            email: prescription.user.email,
          },
          diagnosis: diagnosis
            ? {
                id: diagnosis.id,
                severity: diagnosis.severity,
                confidence: diagnosis.confidence,
                lesion_counts: diagnosis.lesionCounts,
                clinical_notes: diagnosis.clinicalNotes,
                image_url: diagnosis.imageUrl,
                created_at: diagnosis.createdAt.toISOString(),
              }
            : null,
          prescription: {
            severity: prescription.severity,
            medications: prescription.medications,
            lifestyle_recommendations: prescription.lifestyleRecommendations,
            follow_up_instructions: prescription.followUpInstructions,
            reasoning: prescription.reasoning,
          },
          status: prescription.status,
          doctor_notes: prescription.doctorNotes,
          approved_at: prescription.approvedAt?.toISOString(),
          created_at: prescription.createdAt.toISOString(),
        };
      })
    );

    res.json(prescriptionsWithDetails);
  } catch (error) {
    console.error('Get all prescriptions error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

export default router;

