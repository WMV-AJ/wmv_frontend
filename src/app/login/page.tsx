'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, Map, SlidersHorizontal, Star } from 'lucide-react';
import Image from 'next/image';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton';

const ERROR_MESSAGES: Record<string, string> = {
  auth_failed: 'Sign-in failed. Please try again.',
  invalid_state: 'Sign-in did not complete. Please try again.',
  missing_code: 'Sign-in did not complete. Please try again.',
  oauth_not_configured: 'Sign-in is not configured. Please contact support.',
  access_denied: 'You denied access to your Google account.',
};

const FEATURES = [
  { icon: Map, text: 'Interactive map of Dubai venues' },
  { icon: SlidersHorizontal, text: 'Smart filters — genres, vibes, areas' },
  { icon: Star, text: 'Curated events updated daily' },
];

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
      className="mb-6 flex items-start gap-2 rounded-xl px-4 py-3 text-sm"
      style={{
        background: 'rgba(239, 68, 68, 0.12)',
        border: '1px solid rgba(239, 68, 68, 0.35)',
        color: 'rgba(252, 165, 165, 1)',
      }}
    >
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span>{errorMessage}</span>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #080812 0%, #0d0d28 35%, #18082a 65%, #080d18 100%)',
      }}
    >
      {/* Ambient gold glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 35%, rgba(212, 175, 55, 0.07) 0%, transparent 70%)',
        }}
      />

      {/* Decorative top-right glow */}
      <div
        className="absolute top-0 right-0 w-96 h-96 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 80% 20%, rgba(120, 60, 200, 0.12) 0%, transparent 60%)',
        }}
      />

      <div className="w-full max-w-sm relative z-10">
        {/* Glass card */}
        <div
          className="rounded-3xl p-8"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow:
              '0 24px 64px rgba(0, 0, 0, 0.7), 0 8px 24px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          }}
        >
          {/* Logo + brand */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-5">
              <div
                className="rounded-2xl p-1"
                style={{
                  background: 'rgba(212, 175, 55, 0.1)',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                }}
              >
                <Image
                  src="/wmv-logo.gif"
                  alt="Where's My Vibe"
                  width={72}
                  height={72}
                  className="rounded-xl"
                  unoptimized
                />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">
              Where&apos;s My Vibe
            </h1>
            <p
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: 'rgba(212, 175, 55, 0.8)' }}
            >
              Dubai Events
            </p>
          </div>

          {/* Error banner */}
          <Suspense fallback={null}>
            <LoginErrorBanner />
          </Suspense>

          {/* Feature highlights */}
          <div className="mb-8 space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'rgba(212, 175, 55, 0.12)',
                    border: '1px solid rgba(212, 175, 55, 0.22)',
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: '#d4af37' }} />
                </div>
                <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
                  {text}
                </span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div
            className="mb-6"
            style={{ borderTop: '1px solid rgba(255, 255, 255, 0.07)' }}
          />

          {/* Google sign in */}
          <GoogleLoginButton />
        </div>

        {/* Footer */}
        <p
          className="text-center text-xs mt-5"
          style={{ color: 'rgba(255, 255, 255, 0.3)' }}
        >
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
