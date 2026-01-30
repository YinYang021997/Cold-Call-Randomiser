import { Resend } from 'resend';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from './db';

function getResendClient() {
  if (process.env.RESEND_API_KEY) {
    return new Resend(process.env.RESEND_API_KEY);
  }
  return null;
}

export async function createPasswordResetToken(email: string) {
  const resend = getResendClient();

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Always return success to prevent account enumeration
  // If user doesn't exist, we still generate a token but don't save it
  if (!user) {
    return { success: true, devMode: !resend };
  }

  // Generate a random token
  const rawToken = crypto.randomBytes(32).toString('hex');

  // Hash the token before storing
  const tokenHash = await bcrypt.hash(rawToken, 10);

  // Store the token in the database
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  });

  // Create reset URL
  const resetUrl = `${process.env.APP_BASE_URL || 'http://localhost:3000'}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

  // Send email or log to console
  if (resend) {
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM || 'Cold Call Randomizer <onboarding@resend.dev>',
        to: email,
        subject: 'Password Reset Request',
        html: `
          <h2>Password Reset Request</h2>
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <p><a href="${resetUrl}">Reset Password</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `,
      });
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      // Still return success to prevent account enumeration
    }
  } else {
    // Dev mode: log to console
    console.log('\n' + '='.repeat(80));
    console.log('PASSWORD RESET EMAIL (DEV MODE)');
    console.log('='.repeat(80));
    console.log(`To: ${email}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log('='.repeat(80) + '\n');
  }

  return { success: true, devMode: !resend };
}

export async function verifyPasswordResetToken(email: string, rawToken: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return null;
  }

  // Get all non-expired, unused tokens for this user
  const tokens = await prisma.passwordResetToken.findMany({
    where: {
      userId: user.id,
      usedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  // Check each token hash
  for (const token of tokens) {
    const isValid = await bcrypt.compare(rawToken, token.tokenHash);
    if (isValid) {
      return { userId: user.id, tokenId: token.id };
    }
  }

  return null;
}

export async function markTokenAsUsed(tokenId: string) {
  await prisma.passwordResetToken.update({
    where: { id: tokenId },
    data: { usedAt: new Date() },
  });
}

export async function cleanupExpiredTokens() {
  await prisma.passwordResetToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
}
