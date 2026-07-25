'use client';

// Client island for marketing CTAs: a styled link that fires an analytics
// event before navigating. Used inside the (server-rendered) marketing pages.
import { useRouter } from 'next/navigation';
import { trackEvent } from '@/lib/analytics/track';
import type { AnalyticsEventName } from '@/lib/analytics/types';
import { T, mono } from '@/lib/theme/tokens';

interface CtaButtonProps {
  href: string;
  children: React.ReactNode;
  /** Analytics event to fire on click (defaults to marketing_cta_click). */
  event?: AnalyticsEventName;
  /** Extra properties for the analytics event (e.g. { cta: 'map' }). */
  eventProps?: Record<string, unknown>;
  variant?: 'primary' | 'ghost';
  /** External links (WhatsApp, mailto) open in a new tab. */
  external?: boolean;
}

export default function CtaButton({
  href,
  children,
  event = 'marketing_cta_click',
  eventProps,
  variant = 'primary',
  external = false,
}: CtaButtonProps) {
  const router = useRouter();

  const style: React.CSSProperties =
    variant === 'primary'
      ? {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 22px',
          borderRadius: 999,
          background: T.accent,
          color: T.inkInverse,
          fontFamily: mono,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          border: 'none',
          cursor: 'pointer',
        }
      : {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 22px',
          borderRadius: 999,
          background: 'transparent',
          color: T.ink,
          fontFamily: mono,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          border: `1px solid ${T.line}`,
          cursor: 'pointer',
        };

  return (
    <button
      style={style}
      onClick={() => {
        trackEvent(event, eventProps);
        if (external) {
          window.open(href, '_blank', 'noopener,noreferrer');
        } else {
          router.push(href);
        }
      }}
    >
      {children}
    </button>
  );
}
