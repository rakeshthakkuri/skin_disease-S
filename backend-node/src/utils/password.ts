import bcrypt from 'bcrypt';

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password) {
    throw new Error('Password cannot be empty');
  }

  // Bcrypt has a 72-byte limit, truncate if necessary
  const passwordBytes = Buffer.from(password, 'utf-8');
  const truncatedPassword = passwordBytes.length > 72 
    ? passwordBytes.slice(0, 72).toString('utf-8')
    : password;

  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(truncatedPassword, salt);
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  if (!plainPassword || !hashedPassword) {
    return false;
  }

  // Bcrypt has a 72-byte limit, truncate if necessary
  const passwordBytes = Buffer.from(plainPassword, 'utf-8');
  const truncatedPassword = passwordBytes.length > 72
    ? passwordBytes.slice(0, 72).toString('utf-8')
    : plainPassword;

  try {
    return await bcrypt.compare(truncatedPassword, hashedPassword);
  } catch (error) {
    return false;
  }
}

