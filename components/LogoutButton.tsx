'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@mui/material';
import { Logout as LogoutIcon } from '@mui/icons-material';
import { logoutAction } from '@/app/(app)/actions';

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await logoutAction();
    router.push('/login');
    router.refresh();
  };

  return (
    <Button
      onClick={handleLogout}
      variant="outlined"
      color="inherit"
      startIcon={<LogoutIcon />}
    >
      Logout
    </Button>
  );
}
