import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { upload, validateImageFile } from '../utils/fileUpload';
import { classify, predictType } from '../services/ml/inference';
import {
  createDiagnosis,
  getDiagnosisById,
  listDiagnoses,
  generateClinicalNotes,
  getUrgency,
  detectLesions,
} from '../services/diagnosisService';
import { join } from 'path';
import { config } from '../config';

const router = Router();

/**
 * POST /api/v1/diagnosis/analyze
 * Analyze skin image for acne severity and type classification
 */
router.post(
  '/analyze',
  authenticate,
  upload.single('image'),
  [
    body('clinical_metadata').isJSON().withMessage('clinical_metadata must be valid JSON'),
  ],
  async (req: Request, res: Response) => {
    try {
      // Validate file
      validateImageFile(req.file);

      // Parse metadata
      let metadata: Record<string, any>;
      try {
        metadata = JSON.parse(req.body.clinical_metadata);
      } catch (error) {
        return res.status(400).json({ detail: 'Invalid clinical metadata JSON' });
      }

      const user = req.user!;
      const file = req.file!;

      // Run ML inference
      const classification = await classify(file.path);
      if (!classification) {
        return res.status(500).json({ detail: 'ML inference failed' });
      }

      // Acne type classification (only if acne detected)
      let typeResult: { type: string; confidence: number; allScores: Record<string, number> } | null = null;
      if (classification.hasAcne) {
        typeResult = await predictType(file.path);
      }

      // Detect lesions
      const lesionCounts = detectLesions(classification.severity);

      // Generate clinical notes
      const clinicalNotes = generateClinicalNotes(
        classification.severity,
        lesionCounts,
        metadata
      );

      // Generate problem summary (simplified - can be enhanced later)
      const problemSummary = {
        severity: classification.severity,
        severity_index: classification.severityIndex,
        lesion_counts: lesionCounts,
        clinical_metadata: metadata,
        affected_areas: ['face'],
        confidence: classification.confidence,
      };

      // Create diagnosis record
      const diagnosis = await createDiagnosis(user.id, {
        severity: classification.severity,
        confidence: Math.round(classification.confidence * 100),
        severityScores: classification.allScores,
        lesionCounts,
        affectedAreas: ['face'],
        clinicalNotes,
        recommendedUrgency: getUrgency(classification.severity),
        imageUrl: `/uploads/${file.filename}`,
        clinicalMetadata: metadata,
        problemSummary,
      });

      // Return response
      res.json({
        id: diagnosis.id,
        has_acne: classification.hasAcne,
        binary_confidence: classification.binaryConfidence,
        severity: diagnosis.severity,
        confidence: diagnosis.confidence / 100.0,
        severity_scores: diagnosis.severityScores,
        acne_type: typeResult?.type || null,
        acne_type_confidence: typeResult?.confidence || null,
        acne_type_scores: typeResult?.allScores || null,
        lesion_counts: diagnosis.lesionCounts,
        affected_areas: diagnosis.affectedAreas,
        clinical_notes: diagnosis.clinicalNotes,
        recommended_urgency: diagnosis.recommendedUrgency,
        image_url: diagnosis.imageUrl,
        created_at: diagnosis.createdAt.toISOString(),
        problem_summary: diagnosis.problemSummary,
      });
    } catch (error: any) {
      console.error('Diagnosis error:', error);
      if (error.message === 'No file uploaded' || error.message.includes('File must be')) {
        return res.status(400).json({ detail: error.message });
      }
      if (error.message.includes('File size exceeds')) {
        return res.status(413).json({ detail: error.message });
      }
      res.status(500).json({ detail: 'Internal server error' });
    }
  }
);

/**
 * GET /api/v1/diagnosis/:id
 * Get diagnosis by ID
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const diagnosis = await getDiagnosisById(id, user.id);
    if (!diagnosis) {
      return res.status(404).json({ detail: 'Diagnosis not found' });
    }

    res.json({
      id: diagnosis.id,
      severity: diagnosis.severity,
      confidence: diagnosis.confidence / 100.0,
      severity_scores: diagnosis.severityScores,
      lesion_counts: diagnosis.lesionCounts,
      affected_areas: diagnosis.affectedAreas,
      clinical_notes: diagnosis.clinicalNotes,
      recommended_urgency: diagnosis.recommendedUrgency,
      image_url: diagnosis.imageUrl,
      created_at: diagnosis.createdAt.toISOString(),
      metadata: diagnosis.clinicalMetadata,
    });
  } catch (error) {
    console.error('Get diagnosis error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

/**
 * GET /api/v1/diagnosis
 * List all diagnoses for current user
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const diagnoses = await listDiagnoses(user.id);

    res.json(
      diagnoses.map((d) => ({
        id: d.id,
        severity: d.severity,
        confidence: d.confidence / 100.0,
        severity_scores: d.severityScores,
        lesion_counts: d.lesionCounts,
        affected_areas: d.affectedAreas,
        clinical_notes: d.clinicalNotes,
        recommended_urgency: d.recommendedUrgency,
        image_url: d.imageUrl,
        created_at: d.createdAt.toISOString(),
        metadata: d.clinicalMetadata,
      }))
    );
  } catch (error) {
    console.error('List diagnoses error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

export default router;

