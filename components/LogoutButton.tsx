'use client';

import { useRouter } from 'next/navigation';
import { logoutAction } from '@/app/(app)/actions';

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await logoutAction();
    router.push('/login');
    router.refresh();
  };

  return (
    <button onClick={handleLogout} className="btn-secondary">
      Logout
    </button>
  );
}
