import { AppDataSource } from '../database/connection';
import { User } from '../models/User';
import { hashPassword, verifyPassword } from '../utils/password';

/**
 * Create a new user
 */
export async function createUser(
  email: string,
  password: string,
  fullName: string,
  phone?: string,
  dateOfBirth?: string,
  gender?: string,
  skinType: string = 'normal',
  preferences: Record<string, any> = {}
): Promise<User> {
  const userRepository = AppDataSource.getRepository(User);

  // Check if user already exists
  const existingUser = await userRepository.findOne({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    throw new Error('Email already registered');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const user = userRepository.create({
    email: email.toLowerCase(),
    passwordHash,
    fullName,
    phone: phone || null,
    dateOfBirth: dateOfBirth || null,
    gender: gender || null,
    skinType,
    preferences,
  });

  await userRepository.save(user);
  return user;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const userRepository = AppDataSource.getRepository(User);
  return userRepository.findOne({
    where: { email: email.toLowerCase() },
  });
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const userRepository = AppDataSource.getRepository(User);
  return userRepository.findOne({
    where: { id: userId },
  });
}

/**
 * Authenticate a user with email and password
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<User | null> {
  const user = await getUserByEmail(email);
  if (!user) {
    return null;
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  return user;
}

/**
 * Update user information
 */
export async function updateUser(
  userId: string,
  updates: {
    fullName?: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
    skinType?: string;
    preferences?: Record<string, any>;
  }
): Promise<User | null> {
  const userRepository = AppDataSource.getRepository(User);
  const user = await getUserById(userId);

  if (!user) {
    return null;
  }

  // Update fields
  if (updates.fullName !== undefined) user.fullName = updates.fullName;
  if (updates.phone !== undefined) user.phone = updates.phone;
  if (updates.dateOfBirth !== undefined) user.dateOfBirth = updates.dateOfBirth;
  if (updates.gender !== undefined) user.gender = updates.gender;
  if (updates.skinType !== undefined) user.skinType = updates.skinType;
  if (updates.preferences !== undefined) user.preferences = updates.preferences;

  await userRepository.save(user);
  return user;
}

