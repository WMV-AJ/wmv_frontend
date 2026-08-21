'use client';

// Root-level error boundary. Catches errors thrown in the root layout that
// app/error.tsx cannot see, and reports them to Sentry.
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
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
      </body>
    </html>
  );
}
