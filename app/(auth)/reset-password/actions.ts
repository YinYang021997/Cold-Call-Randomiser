'use server';

import { resetPasswordSchema } from '@/lib/validators';
import { verifyPasswordResetToken, markTokenAsUsed } from '@/lib/email';
import { updatePassword } from '@/lib/auth';

export async function resetPasswordAction(formData: FormData) {
  const email = formData.get('email') as string;
  const token = formData.get('token') as string;
  const password = formData.get('password') as string;

  // Validate input
  const validation = resetPasswordSchema.safeParse({ email, token, password });

  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  // Verify the reset token
  const result = await verifyPasswordResetToken(email, token);

  if (!result) {
    return { error: 'Invalid or expired reset token' };
  }

  // Update the password
  await updatePassword(result.userId, password);

  // Mark token as used
  await markTokenAsUsed(result.tokenId);

  return { success: true };
}
