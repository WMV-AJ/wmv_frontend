// Browser-side Sentry init (Next.js 15.3+ client instrumentation file).
// No-op when NEXT_PUBLIC_SENTRY_DSN is unset.
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    // Send reports to our own HTTPS address; src/app/api/error-report passes
    // them on. Posting straight to the tracker's HTTP address is blocked by
    // browsers on an HTTPS page.
    tunnel: '/api/error-report',
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    // Errors always; keep performance sampling low on the public site.
    tracesSampleRate: 0.05,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.2,
    integrations: [Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false })],
    sendDefaultPii: false,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
