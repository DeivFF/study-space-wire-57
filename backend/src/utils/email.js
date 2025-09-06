import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database.js';

// Create transporter for MailDev (local SMTP testing)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || '127.0.0.1',
  port: process.env.SMTP_PORT || 1025,
  secure: false,
  auth: null,
});

/**
 * Generate a 6-digit verification code
 */
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Store verification code in database
 * @param {string} email - User email
 * @param {string} code - Verification code
 * @param {object} [client] - Optional database client (for transactions)
 */
export const storeVerificationCode = async (email, code, client = null) => {
  let shouldReleaseClient = false;
  let localClient = client;

  try {
    if (!localClient) {
      localClient = await pool.connect();
      shouldReleaseClient = true;
      await localClient.query('BEGIN');
    }

    // Get user ID from email
    const userResult = await localClient.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }
    
    const userId = userResult.rows[0].id;

    // Delete any existing verification tokens for this user
    await localClient.query(
      'DELETE FROM email_verification_tokens WHERE user_id = $1',
      [userId]
    );

    // Insert new verification token with 15-minute expiration
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
    await localClient.query(
      'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [userId, code, expiresAt]
    );

    if (shouldReleaseClient) {
      await localClient.query('COMMIT');
    }
  } catch (error) {
    if (shouldReleaseClient) {
      await localClient.query('ROLLBACK');
    }
    throw error;
  } finally {
    if (shouldReleaseClient && localClient) {
      localClient.release();
    }
  }
};

/**
 * Send verification email with 6-digit code
 */
export const sendVerificationEmail = async (email, firstName, verificationCode) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@studyspace.com',
    to: email,
    subject: 'Verify Your StudySpace Account',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4f46e5; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .code { 
            font-size: 32px; 
            font-weight: bold; 
            color: #4f46e5; 
            text-align: center; 
            margin: 20px 0; 
            letter-spacing: 5px;
          }
          .footer { 
            text-align: center; 
            margin-top: 30px; 
            color: #6b7280; 
            font-size: 14px; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>StudySpace</h1>
          </div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>Welcome to StudySpace! To complete your registration, please use the following verification code:</p>
            <div class="code">${verificationCode}</div>
            <p>This code will expire in 15 minutes for security reasons.</p>
            <p>If you didn't create an account with StudySpace, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2025 StudySpace. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email, firstName, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@studyspace.com',
    to: email,
    subject: 'Reset Your StudySpace Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4f46e5; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { 
            display: inline-block; 
            background: #4f46e5; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0; 
          }
          .footer { 
            text-align: center; 
            margin-top: 30px; 
            color: #6b7280; 
            font-size: 14px; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>StudySpace</h1>
          </div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>We received a request to reset your StudySpace password. Click the button below to create a new password:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>© 2025 StudySpace. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};