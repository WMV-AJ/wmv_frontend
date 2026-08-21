'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    // Only log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f1e6]">
      <div className="text-center space-y-4 p-8">
        <h2 className="text-2xl font-bold text-gray-900">Something went wrong!</h2>
        <button
          onClick={reset}
          className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
