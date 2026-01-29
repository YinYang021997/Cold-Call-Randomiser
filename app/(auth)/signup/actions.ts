'use server';

import { createSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { signupSchema } from '@/lib/validators';
import bcrypt from 'bcryptjs';

export async function signupAction(formData: FormData) {
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as string;

  // Validate input
  const validation = signupSchema.safeParse({
    firstName,
    lastName,
    email,
    password,
    role,
  });

  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { error: 'An account with this email already exists' };
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      passwordHash,
      role,
    },
  });

  // Create session
  await createSession(user.id, user.email);

  return { success: true };
}
