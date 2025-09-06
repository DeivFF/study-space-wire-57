import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database.js';
import {
  generateVerificationCode,
  storeVerificationCode,
  sendVerificationEmail,
  sendPasswordResetEmail
} from '../utils/email.js';
import { AppError, asyncHandler } from '../utils/validation.js';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  // Check if user already exists
  const userCheck = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );

  if (userCheck.rows.length > 0) {
    throw new AppError('User with this email already exists', 409);
  }

  // Hash password
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insert new user with verified status (no email verification required)
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, name, email_verified, onboarding_completed, last_login)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, email, name, email_verified, created_at, onboarding_completed`,
      [email, hashedPassword, name, true, false]
    );

    const user = userResult.rows[0];

    // Create initial profile with unique generated nickname (will be updated during onboarding)
        const nameParts = name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        // Generate a unique nickname based on first name and a random number
        const baseNickname = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
        let nickname = baseNickname;
        let counter = 1;
        
        // Check if nickname exists and generate a unique one
        while (true) {
          const nicknameCheck = await client.query(
            'SELECT id FROM profiles WHERE LOWER(nickname) = LOWER($1)',
            [nickname]
          );
          
          if (nicknameCheck.rows.length === 0) {
            break;
          }
          
          nickname = `${baseNickname}${counter}`;
          counter++;
        }
        
        await client.query(
          `INSERT INTO profiles (user_id, nickname, first_name, last_name, avatar_url)
           VALUES ($1, $2, $3, $4, $5)`,
          [user.id, nickname, firstName, lastName, null]
        );

    // Auto-generate tokens for immediate login
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
    );

    // Store refresh token in database
    // await client.query(
    //   'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    //   [user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
    // );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Registration successful. Welcome!',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isVerified: user.email_verified
        },
        tokens: {
          accessToken
          // Removed refreshToken since we're not using it
        }
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

/**
 * @desc    Verify email with 6-digit code
 * @route   POST /api/auth/verify-email
 * @access  Public
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const { email, verificationCode } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get verification record by joining with users table
    const verificationResult = await client.query(
      `SELECT evt.token, evt.expires_at
       FROM email_verification_tokens evt
       JOIN users u ON evt.user_id = u.id
       WHERE u.email = $1 AND evt.used = false`,
      [email]
    );

    if (verificationResult.rows.length === 0) {
      throw new AppError('No pending verification found for this email', 404);
    }

    const verification = verificationResult.rows[0];

    // Check if code is expired
    if (new Date() > verification.expires_at) {
      throw new AppError('Verification code has expired', 400);
    }

    // Check if code matches
    if (verification.token !== verificationCode) {
      throw new AppError('Invalid verification code', 400);
    }

    // Mark verification as used
    await client.query(
      'UPDATE email_verification_tokens SET used = true WHERE user_id = (SELECT id FROM users WHERE email = $1)',
      [email]
    );

    // Update user as verified
    await client.query(
      'UPDATE users SET email_verified = true WHERE email = $1',
      [email]
    );

    // Get updated user
    const userResult = await client.query(
      'SELECT id, email, name, email_verified FROM users WHERE email = $1',
      [email]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Email verified successfully',
      data: {
        user: {
          id: userResult.rows[0].id,
          email: userResult.rows[0].email,
          name: userResult.rows[0].name,
          isVerified: userResult.rows[0].email_verified
        }
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check login attempts first
  const loginAttempts = await pool.query(
    `SELECT COUNT(*) as attempt_count
     FROM login_attempts
     WHERE identifier = $1 AND created_at > NOW() - INTERVAL '15 minutes'`,
    [email]
  );

  const attemptCount = parseInt(loginAttempts.rows[0].attempt_count);
  const maxAttempts = parseInt(process.env.LOGIN_ATTEMPT_LIMIT) || 5;

  if (attemptCount >= maxAttempts) {
    throw new AppError('Too many login attempts. Please try again later.', 429);
  }

  // Get user with password hash and onboarding status
  const userResult = await pool.query(
    `SELECT u.id, u.email, u.password_hash, u.name, u.email_verified, u.is_active, u.onboarding_completed,
            p.nickname, p.avatar_url, p.first_name, p.last_name
     FROM users u
     LEFT JOIN profiles p ON u.id = p.user_id
     WHERE u.email = $1`,
    [email]
  );

  if (userResult.rows.length === 0) {
    // Record failed attempt
    await pool.query(
      'INSERT INTO login_attempts (identifier, success) VALUES ($1, $2)',
      [email, false]
    );
    throw new AppError('Invalid email or password', 401);
  }

  const user = userResult.rows[0];

  // Check if user is active
  if (!user.is_active) {
    throw new AppError('Account is deactivated', 403);
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    // Record failed attempt
    await pool.query(
      'INSERT INTO login_attempts (identifier, success) VALUES ($1, $2)',
      [email, false]
    );
    throw new AppError('Invalid email or password', 401);
  }

  // Email verification is no longer required
  // if (!user.is_verified) {
  //   throw new AppError('Please verify your email before logging in', 403);
  // }

  // Record successful attempt
  await pool.query(
    'INSERT INTO login_attempts (identifier, success) VALUES ($1, $2)',
    [email, true]
  );

  // Update last_login timestamp
  await pool.query(
    'UPDATE users SET last_login = NOW() WHERE id = $1',
    [user.id]
  );

  // Generate tokens
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  // const refreshToken = jwt.sign(
  //   { userId: user.id },
  //   process.env.JWT_SECRET,
  //   { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
  // );

  // Store refresh token in database
  // await pool.query(
  //   'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
  //   [user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
  // );

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.first_name,
        lastName: user.last_name,
        isVerified: user.email_verified,
        onboardingCompleted: user.onboarding_completed,
        nickname: user.nickname,
        avatarUrl: user.avatar_url
      },
      tokens: {
        accessToken
        // Removed refreshToken for now
      }
    }
  });
});

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh-token
 * @access  Public
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token is required', 400);
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
  } catch (error) {
    throw new AppError('Invalid refresh token', 401);
  }

  // Check if refresh token exists in database and is not revoked
  const tokenCheck = await pool.query(
    `SELECT rt.*, u.is_active 
     FROM refresh_tokens rt 
     JOIN users u ON rt.user_id = u.id 
     WHERE rt.token = $1 AND rt.revoked = false AND rt.expires_at > NOW()`,
    [refreshToken]
  );

  if (tokenCheck.rows.length === 0) {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const tokenRecord = tokenCheck.rows[0];

  // Check if user is active
  if (!tokenRecord.is_active) {
    throw new AppError('Account is deactivated', 403);
  }

  // Generate new access token
  const userResult = await pool.query(
    'SELECT id, email FROM users WHERE id = $1',
    [decoded.userId]
  );

  if (userResult.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  const user = userResult.rows[0];
  const newAccessToken = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      accessToken: newAccessToken
    }
  });
});

/**
 * @desc    Logout user (clear session)
 * @route   POST /api/auth/logout
 * @access  Public
 */
export const logout = asyncHandler(async (req, res) => {
  // For now, just return success since we're not using refresh tokens
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * @desc    Request password reset
 * @route   POST /api/auth/request-password-reset
 * @access  Public
 */
export const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Check if user exists (no longer requires email verification)
  const userResult = await pool.query(
    'SELECT id, email, first_name FROM users WHERE email = $1',
    [email]
  );

  if (userResult.rows.length === 0) {
    // Don't reveal if email exists or not for security
    res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent'
    });
    return;
  }

  const user = userResult.rows[0];

  // Generate reset token
  const resetToken = uuidv4();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Delete any existing reset tokens for this user
    await client.query(
      'DELETE FROM password_reset_tokens WHERE user_id = $1',
      [user.id]
    );

    // Insert new reset token
    await client.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, resetToken, expiresAt]
    );

    // Send password reset email
    await sendPasswordResetEmail(user.email, user.first_name, resetToken);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

/**
 * @desc    Reset password with token
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get reset token record
    const tokenResult = await client.query(
      `SELECT prt.*, u.id as user_id, u.email
       FROM password_reset_tokens prt
       JOIN users u ON prt.user_id = u.id
       WHERE prt.token = $1 AND prt.used = false AND prt.expires_at > NOW()`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    const tokenRecord = tokenResult.rows[0];

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update user password
    await client.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hashedPassword, tokenRecord.user_id]
    );

    // Mark token as used
    await client.query(
      'UPDATE password_reset_tokens SET used = true, used_at = NOW() WHERE token = $1',
      [token]
    );

    // Delete all refresh tokens for this user (force logout from all devices)
    await client.query(
      'UPDATE refresh_tokens SET revoked = true, revoked_at = NOW() WHERE user_id = $1',
      [tokenRecord.user_id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Password reset successfully. Please login with your new password.'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});