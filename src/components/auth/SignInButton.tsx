'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';

interface SignInButtonProps {
  variant?: 'desktop' | 'compact';
  className?: string;
}

export default function SignInButton({ variant = 'desktop', className = '' }: SignInButtonProps) {
  const router = useRouter();

  if (variant === 'compact') {
    return (
      <button
        onClick={() => router.push('/login')}
        className={`w-8 h-8 md:w-6 md:h-6 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 flex-shrink-0 ${className}`}
        style={{ background: 'rgba(124, 58, 237, 0.85)' }}
        aria-label="Sign in"
      >
        <LogIn className="w-4 h-4 md:w-3 md:h-3 text-white" />
      </button>
    );
  }

  return (
    <button
      onClick={() => router.push('/login')}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${className}`}
      style={{
        background: 'rgba(124, 58, 237, 0.85)',
        color: '#fff',
        boxShadow: '0 0 12px rgba(124, 58, 237, 0.35)',
      }}
    >
      <LogIn className="w-4 h-4" />
      Sign In
    </button>
  );
}
