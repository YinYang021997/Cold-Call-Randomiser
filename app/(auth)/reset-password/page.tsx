'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Reset Password</h1>

        {success ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              <p>Password reset successful! Redirecting to login...</p>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {!token || !email ? (
              <div className="text-center">
                <Link
                  href="/forgot-password"
                  className="text-blue-600 hover:text-blue-800"
                >
                  Request a new password reset
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    required
                    minLength={4}
                    autoComplete="new-password"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field"
                    required
                    minLength={4}
                    autoComplete="new-password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            )}

            <div className="mt-4 text-center">
              <Link
                href="/login"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Back to login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
