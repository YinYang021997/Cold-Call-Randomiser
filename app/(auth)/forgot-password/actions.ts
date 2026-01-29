'use server';

import { forgotPasswordSchema } from '@/lib/validators';
import { createPasswordResetToken } from '@/lib/email';

export async function forgotPasswordAction(formData: FormData) {
  const email = formData.get('email') as string;

  // Validate input
  const validation = forgotPasswordSchema.safeParse({ email });

  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  // Create and send reset token
  const result = await createPasswordResetToken(email);

  return { success: true, devMode: result.devMode };
}
