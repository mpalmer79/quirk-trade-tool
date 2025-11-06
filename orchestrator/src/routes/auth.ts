import { Router, Request, Response } from 'express';
import pino from 'pino';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { authService } from '../services/auth-service.js';
import { userRepository } from '../repositories/user-repository.js';
import { auditLog } from '../middleware/logging.js';
import {
  LoginSchema,
  RefreshTokenSchema,
  CreateUserSchema,
  type LoginInput,
  type RefreshTokenInput,
  type CreateUserInput
} from '../types/user.js';

const router = Router();
const log = pino();

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post(
  '/login',
  asyncHandler(async (req: Request, res: Response) => {
    // Validate input
    let email: string;
    let password: string;
    try {
      const parsed = LoginSchema.parse(req.body);
      email = parsed.email;
      password = parsed.password;
    } catch (error) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Email and password required'
      });
    }

    // Find user by email
    const user = await userRepository.findByEmail(email);

    if (!user) {
      // Don't reveal whether email exists (security best practice)
      log.warn({ email, message: 'Login attempt with non-existent email' });
      return res.status(401).json({
        error: 'invalid_credentials',
        message: 'Email or password is incorrect'
      });
    }

    if (!user.isActive) {
      log.warn({ userId: user.id, message: 'Login attempt with inactive user' });
      return res.status(401).json({
        error: 'account_inactive',
        message: 'This account is inactive'
      });
    }

    // Verify password
    const isPasswordValid = await authService.verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      log.warn({ email, message: 'Login attempt with invalid password' });
      return res.status(401).json({
        error: 'invalid_credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = authService.generateTokens(user);

    // Audit log
    await auditLog({
      userId: user.id,
      action: 'LOGIN',
      resourceType: 'user',
      resourceId: user.id,
      ipAddress: req.ip,
      timestamp: new Date()
    });

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        dealershipIds: user.dealershipIds
      }
    });
  })
);

/**
 * POST /api/auth/refresh
 * Get a new access token using refresh token
 */
router.post(
  '/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    let refreshToken: string;
    try {
      const parsed = RefreshTokenSchema.parse(req.body);
      refreshToken = parsed.refreshToken;
    } catch (error) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Refresh token required'
      });
    }

    // Verify refresh token
    const payload = authService.verifyToken(refreshToken);

    if (!payload) {
      log.debug({ message: 'Invalid refresh token' });
      return res.status(401).json({
        error: 'invalid_refresh_token',
        message: 'Refresh token is invalid or expired'
      });
    }

    // Get user
    const user = await userRepository.findById(payload.userId);

    if (!user) {
      log.warn({ userId: payload.userId, message: 'User not found for refresh' });
      return res.status(401).json({
        error: 'user_not_found',
        message: 'User associated with token not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        error: 'account_inactive',
        message: 'This account is inactive'
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = authService.generateTokens(user);

    res.json({
      accessToken,
      refreshToken: newRefreshToken
    });
  })
);

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await userRepository.findById(req.user!.userId);

    if (!user) {
      return res.status(404).json({
        error: 'user_not_found',
        message: 'User not found'
      });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      dealershipIds: user.dealershipIds,
      isActive: user.isActive
    });
  })
);

/**
 * POST /api/auth/logout
 * Logout (mostly for client to clear tokens)
 */
router.post(
  '/logout',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    // Audit log
    await auditLog({
      userId: req.user!.userId,
      action: 'LOGOUT',
      resourceType: 'user',
      resourceId: req.user!.userId,
      ipAddress: req.ip,
      timestamp: new Date()
    });

    // Note: In a full implementation, you'd invalidate the refresh token
    // by storing it in a blacklist or similar. For now, just notify client.
    res.json({ ok: true });
  })
);

/**
 * POST /api/auth/register
 * Create a new user (admin only)
 * Note: This would typically be restricted to admins
 */
router.post(
  '/register',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    let input: CreateUserInput;
    try {
      input = CreateUserSchema.parse(req.body);
    } catch (error) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Invalid user data'
      });
    }

    // TODO: Add permission check - only admins can create users
    // if (!authorizationService.hasPermission(req.user!, Permission.MANAGE_USERS)) {
    //   return res.status(403).json({ error: 'insufficient_permissions' });
    // }

    // Check if user already exists
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      return res.status(409).json({
        error: 'user_exists',
        message: 'User with this email already exists'
      });
    }

    // Create user
    const user = await userRepository.create({
      email: input.email,
      name: input.name,
      password: input.password,
      role: input.role,
      dealershipIds: input.dealershipIds
    });

    // Audit log
    await auditLog({
      userId: req.user!.userId,
      action: 'CREATE_USER',
      resourceType: 'user',
      resourceId: user.id,
      dealershipId: input.dealershipIds[0],
      metadata: { createdUserEmail: user.email },
      ipAddress: req.ip,
      timestamp: new Date()
    });

    res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      dealershipIds: user.dealershipIds,
      message: 'User created successfully'
    });
  })
);

export default router;
