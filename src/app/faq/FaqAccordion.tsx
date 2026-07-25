'use client';

// Accordion island for the FAQ page. Answers are always in the DOM (SEO);
// collapse is visual only. Fires faq_expand analytics.
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { FaqItem } from '@/content/faq';
import { trackEvent } from '@/lib/analytics/track';
import { T, mono } from '@/lib/theme/tokens';

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  const categories = Array.from(new Set(items.map((i) => i.category)));

  return (
    <div>
      {categories.map((cat) => (
        <div key={cat} style={{ marginBottom: 26 }}>
          <div
            style={{
              fontFamily: mono, fontSize: 10, letterSpacing: '0.16em',
              textTransform: 'uppercase', color: T.inkFaint, marginBottom: 10,
            }}
          >
            {cat}
          </div>
          {items.map((item, idx) => {
            if (item.category !== cat) return null;
            const isOpen = open === idx;
            return (
              <div key={item.q} style={{ borderBottom: `1px solid ${T.line}` }}>
                <button
                  onClick={() => {
                    setOpen(isOpen ? null : idx);
                    if (!isOpen) trackEvent('faq_expand', { question: item.q });
                  }}
                  style={{
                    width: '100%', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', gap: 10, padding: '14px 0',
                    background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <span style={{ color: T.ink, fontSize: 14, fontWeight: 600 }}>{item.q}</span>
                  <ChevronDown
                    size={16}
                    style={{
                      color: T.inkFaint, flexShrink: 0,
                      transform: isOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                </button>
                {/* Answer stays in the DOM for crawlers; height-collapsed visually */}
                <div
                  style={{
                    overflow: 'hidden',
                    maxHeight: isOpen ? 300 : 0,
                    transition: 'max-height 0.25s ease',
                  }}
                >
                  <p style={{ color: T.inkMuted, fontSize: 13, lineHeight: 1.6, margin: '0 0 14px' }}>
                    {item.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
