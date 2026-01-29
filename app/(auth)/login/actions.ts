'use server';

import { verifyCredentials, createSession } from '@/lib/auth';
import { loginSchema } from '@/lib/validators';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Validate input
  const validation = loginSchema.safeParse({ email, password });

  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  // Verify credentials
  const user = await verifyCredentials(email, password);

  if (!user) {
    return { error: 'Invalid email or password' };
  }

  // Create session
  await createSession(user.id, user.email);

  return { success: true };
}
