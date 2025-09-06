import express from 'express';
import {
  register,
  verifyEmail,
  login,
  refreshToken,
  logout,
  requestPasswordReset,
  resetPassword
} from '../controllers/authController.js';
import { validateRequest, validationSchemas } from '../utils/validation.js';
import { authRateLimiter, passwordResetRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  authRateLimiter,
  validateRequest(validationSchemas.register),
  register
);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email with 6-digit code
 * @access  Public
 */
router.post(
  '/verify-email',
  validateRequest(validationSchemas.verifyEmail),
  verifyEmail
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  authRateLimiter,
  validateRequest(validationSchemas.login),
  login
);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh-token',
  refreshToken
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (revoke refresh token)
 * @access  Public
 */
router.post(
  '/logout',
  logout
);

/**
 * @route   POST /api/auth/request-password-reset
 * @desc    Request password reset email
 * @access  Public
 */
router.post(
  '/request-password-reset',
  passwordResetRateLimiter,
  validateRequest(validationSchemas.requestPasswordReset),
  requestPasswordReset
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post(
  '/reset-password',
  passwordResetRateLimiter,
  validateRequest(validationSchemas.resetPassword),
  resetPassword
);

export default router;