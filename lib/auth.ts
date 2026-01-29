import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from './db';
import bcrypt from 'bcryptjs';

const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'default-secret-change-in-production'
);

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface SessionData {
  userId: string;
  email: string;
}

export async function createSession(userId: string, email: string) {
  const token = await new SignJWT({ userId, email } as SessionData)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(SESSION_SECRET);

  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000,
    path: '/',
  });
}

export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token, SESSION_SECRET);
    return payload as SessionData;
  } catch (error) {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

export async function verifyCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    return null;
  }

  return { id: user.id, email: user.email };
}

export async function updatePassword(userId: string, newPassword: string) {
  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}
