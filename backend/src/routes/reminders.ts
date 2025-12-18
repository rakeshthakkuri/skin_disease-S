import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth';
import {
  createReminder,
  getReminderById,
  listReminders,
  updateReminder,
  deleteReminder,
} from '../services/reminderService';
import { AppDataSource } from '../database/connection';
import { Reminder } from '../models/Reminder';
import { Prescription } from '../models/Prescription';

const router = Router();

/**
 * POST /api/v1/reminders/create
 * Create a new reminder (alias for POST /reminders)
 */
router.post(
  '/create',
  authenticate,
  [
    body('title').notEmpty().trim(),
    body('message').notEmpty().trim(),
    body('message_telugu').optional().isString(),
    body('frequency').isIn(['once_daily', 'twice_daily', 'three_times_daily']),
    body('times').isArray().notEmpty(),
    body('prescription_id').optional().isString(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ detail: errors.array() });
      }

      const { title, message, message_telugu, frequency, times, prescription_id } = req.body;
      const user = req.user!;

      const reminder = await createReminder(user.id, {
        prescriptionId: prescription_id,
        title,
        message,
        messageTelugu: message_telugu,
        frequency,
        times,
      });

      res.status(201).json({
        id: reminder.id,
        prescription_id: reminder.prescriptionId,
        title: reminder.title,
        message: reminder.message,
        message_telugu: reminder.messageTelugu,
        frequency: reminder.frequency,
        times: reminder.times,
        status: reminder.status,
        total_acknowledged: reminder.totalAcknowledged,
        created_at: reminder.createdAt.toISOString(),
      });
    } catch (error) {
      console.error('Create reminder error:', error);
      res.status(500).json({ detail: 'Internal server error' });
    }
  }
);

/**
 * GET /api/v1/reminders
 * List all reminders for current user
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const reminders = await listReminders(user.id);

    res.json(
      reminders.map((r) => ({
        id: r.id,
        prescription_id: r.prescriptionId,
        title: r.title,
        message: r.message,
        message_telugu: r.messageTelugu,
        frequency: r.frequency,
        times: r.times,
        status: r.status,
        total_acknowledged: r.totalAcknowledged,
        created_at: r.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error('List reminders error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

/**
 * GET /api/v1/reminders/:id
 * Get reminder by ID
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const reminder = await getReminderById(id, user.id);
    if (!reminder) {
      return res.status(404).json({ detail: 'Reminder not found' });
    }

    res.json({
      id: reminder.id,
      prescription_id: reminder.prescriptionId,
      title: reminder.title,
      message: reminder.message,
      message_telugu: reminder.messageTelugu,
      frequency: reminder.frequency,
      times: reminder.times,
      status: reminder.status,
      total_acknowledged: reminder.totalAcknowledged,
      created_at: reminder.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Get reminder error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

/**
 * PUT /api/v1/reminders/:id
 * Update reminder
 */
router.put(
  '/:id',
  authenticate,
  [
    body('title').optional().notEmpty().trim(),
    body('message').optional().notEmpty().trim(),
    body('message_telugu').optional().isString(),
    body('frequency').optional().isIn(['once_daily', 'twice_daily', 'three_times_daily']),
    body('times').optional().isArray().notEmpty(),
    body('status').optional().isIn(['active', 'inactive', 'completed']),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ detail: errors.array() });
      }

      const { id } = req.params;
      const user = req.user!;
      const { title, message, message_telugu, frequency, times, status } = req.body;

      const reminder = await updateReminder(id, user.id, {
        title,
        message,
        messageTelugu: message_telugu,
        frequency,
        times,
        status,
      });

      if (!reminder) {
        return res.status(404).json({ detail: 'Reminder not found' });
      }

      res.json({
        id: reminder.id,
        prescription_id: reminder.prescriptionId,
        title: reminder.title,
        message: reminder.message,
        message_telugu: reminder.messageTelugu,
        frequency: reminder.frequency,
        times: reminder.times,
        status: reminder.status,
        total_acknowledged: reminder.totalAcknowledged,
        created_at: reminder.createdAt.toISOString(),
      });
    } catch (error) {
      console.error('Update reminder error:', error);
      res.status(500).json({ detail: 'Internal server error' });
    }
  }
);

/**
 * DELETE /api/v1/reminders/:id
 * Delete reminder
 */
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const deleted = await deleteReminder(id, user.id);
    if (!deleted) {
      return res.status(404).json({ detail: 'Reminder not found' });
    }

    res.json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    console.error('Delete reminder error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

/**
 * POST /api/v1/reminders/:id/acknowledge
 * Mark reminder as acknowledged (medication taken)
 */
router.post('/:id/acknowledge', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const reminder = await getReminderById(id, user.id);
    if (!reminder) {
      return res.status(404).json({ detail: 'Reminder not found' });
    }

    // Increment acknowledged count
    reminder.totalAcknowledged += 1;
    const reminderRepository = AppDataSource.getRepository(Reminder);
    await reminderRepository.save(reminder);

    res.json({
      reminder_id: id,
      acknowledged_at: new Date().toISOString(),
      total_acknowledged: reminder.totalAcknowledged,
    });
  } catch (error) {
    console.error('Acknowledge reminder error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

/**
 * POST /api/v1/reminders/auto-schedule/:prescription_id
 * Automatically create reminders from prescription medications
 */
router.post('/auto-schedule/:prescription_id', authenticate, async (req: Request, res: Response) => {
  try {
    const { prescription_id } = req.params;
    const user = req.user!;

    const prescriptionRepository = AppDataSource.getRepository(Prescription);
    const prescription = await prescriptionRepository.findOne({
      where: { id: prescription_id, userId: user.id },
    });

    if (!prescription) {
      return res.status(404).json({ detail: 'Prescription not found' });
    }

    const createdReminders: any[] = [];

    for (const med of prescription.medications) {
      // Determine times based on frequency
      const freq = ((med as any).frequency || 'once daily').toLowerCase();
      let times: string[];
      let frequency: string;

      if (freq.includes('twice')) {
        times = ['09:00', '21:00'];
        frequency = 'twice_daily';
      } else if (freq.includes('three')) {
        times = ['09:00', '14:00', '21:00'];
        frequency = 'three_times_daily';
      } else {
        times = freq.includes('night') ? ['21:00'] : ['09:00'];
        frequency = 'once_daily';
      }

      const reminder = await createReminder(user.id, {
        prescriptionId: prescription_id,
        title: `Medication: ${(med as any).name}`,
        message: `Time to apply/take ${(med as any).name}. ${(med as any).instructions || ''}`,
        messageTelugu: undefined,
        frequency,
        times,
      });

      createdReminders.push({
        id: reminder.id,
        prescription_id: prescription_id,
        title: reminder.title,
        message: reminder.message,
        frequency,
        times,
        status: reminder.status,
      });
    }

    res.json({
      prescription_id,
      reminders_created: createdReminders.length,
      reminders: createdReminders,
    });
  } catch (error) {
    console.error('Auto-schedule reminders error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

/**
 * POST /api/v1/reminders
 * Create a new reminder (alternative endpoint)
 */
router.post(
  '/',
  authenticate,
  [
    body('title').notEmpty().trim(),
    body('message').notEmpty().trim(),
    body('message_telugu').optional().isString(),
    body('frequency').isIn(['once_daily', 'twice_daily', 'three_times_daily']),
    body('times').isArray().notEmpty(),
    body('prescription_id').optional().isString(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ detail: errors.array() });
      }

      const { title, message, message_telugu, frequency, times, prescription_id } = req.body;
      const user = req.user!;

      const reminder = await createReminder(user.id, {
        prescriptionId: prescription_id,
        title,
        message,
        messageTelugu: message_telugu,
        frequency,
        times,
      });

      res.status(201).json({
        id: reminder.id,
        prescription_id: reminder.prescriptionId,
        title: reminder.title,
        message: reminder.message,
        message_telugu: reminder.messageTelugu,
        frequency: reminder.frequency,
        times: reminder.times,
        status: reminder.status,
        total_acknowledged: reminder.totalAcknowledged,
        created_at: reminder.createdAt.toISOString(),
      });
    } catch (error) {
      console.error('Create reminder error:', error);
      res.status(500).json({ detail: 'Internal server error' });
    }
  }
);

export default router;

