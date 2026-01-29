'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  CircularProgress,
} from '@mui/material';
import { VpnKey as VpnKeyIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { resetPasswordAction } from './actions';

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!token || !email) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!token || !email) {
      setError('Invalid reset link');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('token', token);
      formData.append('password', password);

      const result = await resetPasswordAction(formData);

      if (result.error) {
        setError(result.error);
        setLoading(false);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="sm">
        <Card elevation={3}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <VpnKeyIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" component="h1" gutterBottom>
                Reset Password
              </Typography>
            </Box>

            {success ? (
              <Alert severity="success">
                Password reset successful! Redirecting to login...
              </Alert>
            ) : (
              <>
                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}

                {!token || !email ? (
                  <Box sx={{ textAlign: 'center' }}>
                    <Link href="/forgot-password" style={{ textDecoration: 'none' }}>
                      <Button variant="outlined">
                        Request a new password reset
                      </Button>
                    </Link>
                  </Box>
                ) : (
                  <Box component="form" onSubmit={handleSubmit}>
                    <TextField
                      fullWidth
                      id="password"
                      label="New Password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      inputProps={{ minLength: 4 }}
                      autoComplete="new-password"
                      sx={{ mb: 2 }}
                    />

                    <TextField
                      fullWidth
                      id="confirmPassword"
                      label="Confirm Password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      inputProps={{ minLength: 4 }}
                      autoComplete="new-password"
                      sx={{ mb: 3 }}
                    />

                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={loading}
                      sx={{ mb: 2 }}
                    >
                      {loading ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        'Reset Password'
                      )}
                    </Button>
                  </Box>
                )}

                <Link href="/login" style={{ textDecoration: 'none' }}>
                  <Button
                    fullWidth
                    variant="text"
                    startIcon={<ArrowBackIcon />}
                  >
                    Back to login
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
