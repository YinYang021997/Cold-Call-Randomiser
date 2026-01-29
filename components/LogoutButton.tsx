'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, CircularProgress } from '@mui/material';
import { Logout as LogoutIcon } from '@mui/icons-material';
import { logoutAction } from '@/app/(app)/actions';

export function LogoutButton() {
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setLoggingOut(true);
    await logoutAction();
    router.push('/login');
    router.refresh();
  };

  return (
    <Button
      onClick={handleLogout}
      variant="outlined"
      color="inherit"
      startIcon={loggingOut ? <CircularProgress size={20} color="inherit" /> : <LogoutIcon />}
      disabled={loggingOut}
    >
      {loggingOut ? 'Logging out...' : 'Logout'}
    </Button>
  );
}
