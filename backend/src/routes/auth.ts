import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { createUser, authenticateUser, updateUser } from '../services/userService';
import { createAccessToken } from '../utils/jwt';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * POST /api/v1/auth/register
 * Register a new user
 */
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('full_name').notEmpty().trim(),
    body('phone').optional().isString(),
    body('date_of_birth').optional().isString(),
    body('gender').optional().isString(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ detail: errors.array() });
      }

      const { email, password, full_name, phone, date_of_birth, gender } = req.body;

      const user = await createUser(
        email,
        password,
        full_name,
        phone,
        date_of_birth,
        gender
      );

      // Create access token
      const accessToken = createAccessToken(user.id);

      res.status(201).json({
        access_token: accessToken,
        token_type: 'bearer',
        user: {
          id: user.id,
          email: user.email,
          full_name: user.fullName,
          phone: user.phone,
          date_of_birth: user.dateOfBirth,
          gender: user.gender,
          skin_type: user.skinType,
          preferences: user.preferences,
          created_at: user.createdAt.toISOString(),
        },
      });
    } catch (error: any) {
      if (error.message === 'Email already registered') {
        return res.status(400).json({ detail: error.message });
      }
      console.error('Registration error:', error);
      res.status(500).json({ detail: 'Internal server error' });
    }
  }
);

/**
 * POST /api/v1/auth/login
 * Login and get access token
 */
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ detail: errors.array() });
      }

      const { email, password } = req.body;

      console.log(`🔐 Login attempt for email: ${email}`);
      const result = await authenticateUser(email, password);
      
      if ('error' in result) {
        if (result.error === 'user_not_found') {
          return res.status(401).json({
            detail: 'User not found',
            error_code: 'user_not_found',
            message: 'No account exists with this email address. Please check your email or register a new account.',
          });
        } else if (result.error === 'wrong_password') {
          return res.status(401).json({
            detail: 'Incorrect password',
            error_code: 'wrong_password',
            message: 'The password you entered is incorrect. Please try again.',
          });
        }
        // If we get here, there's an unknown error
        return res.status(401).json({
          detail: 'Authentication failed',
        });
      }

      const user = result.user;
      // Create access token
      const accessToken = createAccessToken(user.id);

      res.json({
        access_token: accessToken,
        token_type: 'bearer',
        user: {
          id: user.id,
          email: user.email,
          full_name: user.fullName,
          phone: user.phone,
          date_of_birth: user.dateOfBirth,
          gender: user.gender,
          skin_type: user.skinType,
          role: user.role,
          preferences: user.preferences,
          created_at: user.createdAt.toISOString(),
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ detail: 'Internal server error' });
    }
  }
);

/**
 * GET /api/v1/auth/me
 * Get current user information
 */
router.get('/me', authenticate, async (req: Request, res: Response) => {
  const user = req.user!;
  res.json({
    id: user.id,
    email: user.email,
    full_name: user.fullName,
    phone: user.phone,
    date_of_birth: user.dateOfBirth,
    gender: user.gender,
    skin_type: user.skinType,
    role: user.role,
    preferences: user.preferences,
    created_at: user.createdAt.toISOString(),
  });
});

/**
 * PUT /api/v1/auth/me
 * Update current user information
 */
router.put(
  '/me',
  authenticate,
  [
    body('full_name').optional().notEmpty().trim(),
    body('phone').optional().isString(),
    body('date_of_birth').optional().isString(),
    body('gender').optional().isString(),
    body('skin_type').optional().isString(),
    body('preferences').optional().isObject(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ detail: errors.array() });
      }

      const { full_name, phone, date_of_birth, gender, skin_type, preferences } = req.body;
      const user = req.user!;

      const updatedUser = await updateUser(user.id, {
        fullName: full_name,
        phone,
        dateOfBirth: date_of_birth,
        gender,
        skinType: skin_type,
        preferences,
      });

      if (!updatedUser) {
        return res.status(404).json({ detail: 'User not found' });
      }

      res.json({
        id: updatedUser.id,
        email: updatedUser.email,
        full_name: updatedUser.fullName,
        phone: updatedUser.phone,
        date_of_birth: updatedUser.dateOfBirth,
        gender: updatedUser.gender,
        skin_type: updatedUser.skinType,
        preferences: updatedUser.preferences,
        created_at: updatedUser.createdAt.toISOString(),
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ detail: 'Internal server error' });
    }
  }
);

/**
 * POST /api/v1/auth/logout
 * Logout (client should remove token)
 */
router.post('/logout', authenticate, (req: Request, res: Response) => {
  res.json({ message: 'Successfully logged out' });
});

export default router;

