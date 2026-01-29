'use client';

import { useState } from 'react';
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
import { LockReset as LockResetIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { forgotPasswordAction } from './actions';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [devMode, setDevMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('email', email);

      const result = await forgotPasswordAction(formData);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setDevMode(result.devMode || false);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
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
              <LockResetIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" component="h1" gutterBottom>
                Forgot Password
              </Typography>
            </Box>

            {success ? (
              <Box>
                <Alert severity={devMode ? 'info' : 'success'} sx={{ mb: 3 }}>
                  {devMode ? (
                    <>
                      <Typography variant="subtitle2" fontWeight="bold">
                        Dev Mode: Email not configured
                      </Typography>
                      <Typography variant="body2">
                        Check your server console for the password reset link.
                      </Typography>
                    </>
                  ) : (
                    'If an account exists with that email, you will receive a password reset link shortly.'
                  )}
                </Alert>
                <Link href="/login" style={{ textDecoration: 'none' }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                  >
                    Return to login
                  </Button>
                </Link>
              </Box>
            ) : (
              <>
                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}

                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Enter your email address and we'll send you a link to reset your password.
                </Typography>

                <Box component="form" onSubmit={handleSubmit}>
                  <TextField
                    fullWidth
                    id="email"
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
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
                      'Send Reset Link'
                    )}
                  </Button>

                  <Link href="/login" style={{ textDecoration: 'none' }}>
                    <Button
                      fullWidth
                      variant="text"
                      startIcon={<ArrowBackIcon />}
                    >
                      Back to login
                    </Button>
                  </Link>
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
