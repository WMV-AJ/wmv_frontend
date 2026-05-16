'use client';

import React from 'react';

interface TutorialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

/*
 * Each callout: a text bubble + a thin curved arrow (inline SVG).
 * Positioned with viewport units so it scales across devices.
 * Arrow direction set via rotation on the SVG.
 */
interface Callout {
  label: string;
  /** CSS top (use vh) — omit if using bottom */
  top?: string;
  /** CSS bottom (use vh) — anchors from bottom of screen */
  bottom?: string;
  /** CSS left or right (use vw) */
  left?: string;
  right?: string;
  /** Where the arrow points relative to the bubble: 'up' | 'down' | 'up-left' | 'up-right' | 'down-left' | 'down-right' */
  arrowDir: 'up' | 'down' | 'up-left' | 'up-right' | 'down-left' | 'down-right';
  /** How to align the bubble */
  align?: 'left' | 'center' | 'right';
}

const CALLOUTS: Callout[] = [
  {
    // Points to date pills (Row 2). TopNav is pixel-based, so use px not vh.
    label: 'Select a date',
    top: '8px',
    left: '28vw',
    arrowDir: 'down',
    align: 'center',
  },
  {
    // Points to date range dropdown (left of Row 2, ~65px from top)
    label: 'Select date range',
    top: '88px',
    left: '1vw',
    arrowDir: 'up',
    align: 'left',
  },
  {
    // Points to category pills (Row 3, ~100-125px from top)
    label: 'Choose your vibe',
    top: '128px',
    left: '32vw',
    arrowDir: 'up',
    align: 'center',
  },
  {
    // Points to right side of category pills — swipe hint
    label: 'Swipe here\nfor more vibes',
    top: '128px',
    right: '2vw',
    arrowDir: 'up-right',
    align: 'right',
  },
  {
    // Points to list/map toggle button (top-right of Row 1, ~30px from top)
    label: 'Tap to view list',
    top: '52px',
    right: '1vw',
    arrowDir: 'up-right',
    align: 'right',
  },
  {
    // Points to map markers — mid-screen, so vh is fine here
    label: 'Tap marker\nto view details',
    top: '40vh',
    right: '5vw',
    arrowDir: 'down-left',
    align: 'right',
  },
  {
    // Points to expand button at bottom-right of mini card
    // Bottom-anchored px so it stays aligned across screen sizes
    label: 'Tap to view details',
    bottom: '80px',
    right: '2vw',
    arrowDir: 'down',
    align: 'right',
  },
];

/** Small curved arrow SVG — 40x40, arrow curves downward from top-center to bottom */
function ArrowSVG({ dir }: { dir: string }) {
  // rotation angles for each direction
  const rotations: Record<string, number> = {
    'down': 0,
    'up': 180,
    'down-left': 30,
    'down-right': -30,
    'up-left': 150,
    'up-right': -150,
  };
  const rot = rotations[dir] ?? 0;

  return (
    <svg
      width="28"
      height="32"
      viewBox="0 0 28 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: `rotate(${rot}deg)`, flexShrink: 0 }}
    >
      {/* Curved line */}
      <path
        d="M14 2 Q 6 16, 14 28"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Arrowhead */}
      <path
        d="M10 23 L14 30 L18 23"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[80]"
      onClick={onClose}
      style={{ animation: 'tutor-fade-in 0.4s ease-out forwards' }}
    >
      {/* Semi-transparent backdrop */}
      <div className="absolute inset-0 bg-black/35" />

      {/* Callouts */}
      {CALLOUTS.map((c, i) => {
        const isArrowAbove = c.arrowDir.startsWith('up');

        return (
          <div
            key={i}
            className="absolute pointer-events-none flex flex-col items-center"
            style={{
              top: c.top,
              bottom: c.bottom,
              left: c.left,
              right: c.right,
            }}
          >
            {/* Arrow above label */}
            {isArrowAbove && (
              <div className="mb-[-4px]">
                <ArrowSVG dir={c.arrowDir} />
              </div>
            )}

            {/* Text bubble */}
            <div
              className="px-3 py-1.5 rounded-xl max-w-[160px]"
              style={{
                background: 'rgba(26, 26, 36, 0.88)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
              }}
            >
              <p
                className="text-white font-semibold leading-snug"
                style={{
                  fontSize: '13px',
                  fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
                  textAlign: c.align === 'center' ? 'center' : c.align === 'right' ? 'right' : 'left',
                }}
              >
                {c.label.split('\n').map((line, idx) => (
                  <span key={idx}>
                    {idx > 0 && <br />}
                    {line}
                  </span>
                ))}
              </p>
            </div>

            {/* Arrow below label */}
            {!isArrowAbove && (
              <div className="mt-[-4px]">
                <ArrowSVG dir={c.arrowDir} />
              </div>
            )}
          </div>
        );
      })}

      {/* "Tap anywhere to dismiss" */}
      <div className="absolute bottom-5 left-0 right-0 flex justify-center pointer-events-none">
        <div
          className="px-5 py-2 rounded-full"
          style={{
            background: 'rgba(26, 26, 36, 0.88)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          <p className="text-gray-300 text-[13px] font-medium tracking-wide">
            Tap anywhere to dismiss
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes tutor-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default TutorialOverlay;
