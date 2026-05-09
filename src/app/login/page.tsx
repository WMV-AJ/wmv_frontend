'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sparkles, AlertCircle } from 'lucide-react';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton';

const ERROR_MESSAGES: Record<string, string> = {
  auth_failed: 'Sign-in failed. Please try again.',
  invalid_state: 'Sign-in did not complete. Please try again.',
  missing_code: 'Sign-in did not complete. Please try again.',
  oauth_not_configured: 'Sign-in is not configured. Please contact support.',
  access_denied: 'You denied access to your Google account.',
};

function LoginErrorBanner() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get('error');
  const errorMessage = errorCode
    ? ERROR_MESSAGES[errorCode] || 'Sign-in failed. Please try again.'
    : null;
  if (!errorMessage) return null;
  return (
    <div
      role="alert"
      className="mb-4 flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
    >
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span>{errorMessage}</span>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#f5f1e6] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl mb-4 shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
            Welcome to Dubai Events
          </h1>
          <p className="text-gray-600">Sign in to discover the best events in Dubai</p>
        </div>

        <Suspense fallback={null}>
          <LoginErrorBanner />
        </Suspense>

        {/* Auth Container — Google only for now */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <GoogleLoginButton />
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
