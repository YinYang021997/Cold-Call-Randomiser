'use client';

import { useState } from 'react';
import Link from 'next/link';
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Forgot Password</h1>

        {success ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {devMode ? (
                <>
                  <p className="font-semibold">Dev Mode: Email not configured</p>
                  <p className="text-sm mt-1">
                    Check your server console for the password reset link.
                  </p>
                </>
              ) : (
                <p>
                  If an account exists with that email, you will receive a password reset link shortly.
                </p>
              )}
            </div>
            <Link
              href="/login"
              className="block text-center text-blue-600 hover:text-blue-800"
            >
              Return to login
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <p className="text-gray-600 mb-6 text-sm">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  required
                  autoComplete="email"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

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
