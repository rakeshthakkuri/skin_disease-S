import { AppDataSource } from '../database/connection';
import { Reminder } from '../models/Reminder';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a reminder
 */
export async function createReminder(
  userId: string,
  data: {
    prescriptionId?: string;
    title: string;
    message: string;
    messageTelugu?: string;
    frequency: string;
    times: string[];
  }
): Promise<Reminder> {
  const reminderRepository = AppDataSource.getRepository(Reminder);

  const reminder = reminderRepository.create({
    id: uuidv4().substring(0, 8),
    userId,
    prescriptionId: data.prescriptionId || null,
    title: data.title,
    message: data.message,
    messageTelugu: data.messageTelugu || null,
    frequency: data.frequency,
    times: data.times,
    status: 'active',
    totalAcknowledged: 0,
  });

  await reminderRepository.save(reminder);
  return reminder;
}

/**
 * Get reminder by ID
 */
export async function getReminderById(
  reminderId: string,
  userId: string
): Promise<Reminder | null> {
  const reminderRepository = AppDataSource.getRepository(Reminder);
  return reminderRepository.findOne({
    where: { id: reminderId, userId },
  });
}

/**
 * List reminders for a user
 */
export async function listReminders(userId: string): Promise<Reminder[]> {
  const reminderRepository = AppDataSource.getRepository(Reminder);
  return reminderRepository.find({
    where: { userId },
    order: { createdAt: 'DESC' },
  });
}

/**
 * Update reminder
 */
export async function updateReminder(
  reminderId: string,
  userId: string,
  updates: {
    title?: string;
    message?: string;
    messageTelugu?: string;
    frequency?: string;
    times?: string[];
    status?: string;
  }
): Promise<Reminder | null> {
  const reminderRepository = AppDataSource.getRepository(Reminder);
  const reminder = await getReminderById(reminderId, userId);

  if (!reminder) {
    return null;
  }

  if (updates.title !== undefined) reminder.title = updates.title;
  if (updates.message !== undefined) reminder.message = updates.message;
  if (updates.messageTelugu !== undefined) reminder.messageTelugu = updates.messageTelugu;
  if (updates.frequency !== undefined) reminder.frequency = updates.frequency;
  if (updates.times !== undefined) reminder.times = updates.times;
  if (updates.status !== undefined) reminder.status = updates.status;

  await reminderRepository.save(reminder);
  return reminder;
}

/**
 * Delete reminder
 */
export async function deleteReminder(
  reminderId: string,
  userId: string
): Promise<boolean> {
  const reminderRepository = AppDataSource.getRepository(Reminder);
  const reminder = await getReminderById(reminderId, userId);

  if (!reminder) {
    return false;
  }

  await reminderRepository.remove(reminder);
  return true;
}

