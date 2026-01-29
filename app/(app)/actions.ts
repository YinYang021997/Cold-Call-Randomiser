'use server';

import { destroySession } from '@/lib/auth';

export async function logoutAction() {
  await destroySession();
}
