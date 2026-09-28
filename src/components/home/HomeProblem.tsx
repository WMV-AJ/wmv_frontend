'use client';

// Problem → relief (content plan §2, headline #1): the plan was in a story
// and it expired. Shows it: a story built from a real event photo plays, its
// clock runs out to 00:00 and it goes "unavailable" — then the same event
// slides in pinned on a map, still there. Loops while on screen; still
// (final frame) under reduced motion.

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { H4_LABEL, TILE_RULE, type CardAccent } from '@/components/shared/card-style';
import EventMedia from '@/components/shared/EventMedia';
import { T } from '@/lib/theme/tokens';
import { HF } from './home-fonts';
import { useInViewOnce, prefersReducedMotion } from './useRevealOnce';
import styles from './home.module.css';

export interface ProblemStory {
  photo: string | null;
  fallbackImage: string;
  venueName: string;
  eventName: string;
  accent: CardAccent;
}

type Phase = 'play' | 'expired' | 'pinned';
const CLOCK = ['23:56', '23:57', '23:58', '23:59', '00:00'];

export default function HomeProblem({ story, scrollRoot }: {
  story: ProblemStory | null;
  scrollRoot: React.RefObject<HTMLElement | null>;
}) {
  const [ref, inView] = useInViewOnce<HTMLDivElement>(scrollRoot, 0.35);
  const [phase, setPhase] = useState<Phase>('play');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (prefersReducedMotion()) { setPhase('pinned'); setTick(CLOCK.length - 1); return; }
    const timers: ReturnType<typeof setTimeout>[] = [];
    const run = () => {
      setPhase('play');
      setTick(0);
      CLOCK.forEach((_, i) => { if (i) timers.push(setTimeout(() => setTick(i), i * 900)); });
      timers.push(setTimeout(() => setPhase('expired'), CLOCK.length * 900));
      timers.push(setTimeout(() => setPhase('pinned'), CLOCK.length * 900 + 1500));
      timers.push(setTimeout(run, CLOCK.length * 900 + 5200));
    };
    run();
    return () => timers.forEach(clearTimeout);
  }, [inView]);

  const venue = story?.venueName || 'Your favourite bar';
  const event = story?.eventName || 'Tonight’s lineup';

  return (
    <section className="px-[18px] pt-16 mt-14" aria-labelledby="home-problem-title" style={{ borderTop: `1px solid ${TILE_RULE}` }}>
      <div className={`${H4_LABEL} flex items-center gap-2.5 text-silver-dim`}>
        <span>Why this exists</span>
        <span aria-hidden className="flex-1 h-px" style={{ background: TILE_RULE }} />
      </div>
      <h2 id="home-problem-title" className={`${HF.problem} text-pale mt-5`}>
        The plan was in a story.<br /><em className="italic" style={{ color: T.accent }}>It expired at midnight.</em>
      </h2>
      <p className="text-[15px] leading-relaxed text-silver mt-4">
        Venues post tonight&rsquo;s lineup to Instagram stories. 24 hours later it&rsquo;s gone, and you never saw it.
      </p>

      <div ref={ref} className={styles.storyStage} data-phase={phase} aria-hidden="true">
        {/* The story */}
        <div className={styles.storyCard}>
          {story?.photo
            ? <EventMedia src={story.photo} alt="" sizes="200px" fill />
            : <Image src={story?.fallbackImage ?? '/home3/friends-night.webp'} alt="" fill sizes="200px" className="object-cover" />}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(rgba(0,0,0,0.55), transparent 30%, transparent 60%, rgba(0,0,0,0.75))' }} />
          <div className="absolute top-2 inset-x-2 flex gap-1">
            {[0, 1, 2].map((i) => (
              <span key={i} className={styles.storySeg}><span style={{ animationDelay: `${i * 1.5}s` }} /></span>
            ))}
          </div>
          <div className="absolute top-5 inset-x-2.5 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full flex-shrink-0" style={{ border: `2px solid ${story?.accent.edge ?? T.accent}`, background: '#202020' }} />
            <span className="text-[11px] font-semibold text-white truncate">{venue}</span>
            <span className="text-[11px] text-white/70 tabular-nums ml-auto">{CLOCK[tick]}</span>
          </div>
          <div className="absolute bottom-3 inset-x-3 text-[13px] font-semibold text-white leading-tight line-clamp-2">{event}</div>
          <div className={styles.storyGone}>
            <span className="text-[26px] font-semibold text-white tabular-nums">00:00</span>
            <span className={`${H4_LABEL} text-silver mt-1`}>Story unavailable</span>
          </div>
        </div>

        {/* The same night, still on the map */}
        <div className={styles.pinCard}>
          <div className={styles.pinMap}>
            <span className={styles.pinDrop} style={{ color: story?.accent.text ?? T.accent }}>
              <MapPin className="w-8 h-8" fill="currentColor" strokeWidth={1.5} color="#0b0b0b" />
            </span>
          </div>
          <div className="p-3">
            <span className={H4_LABEL} style={{ color: story?.accent.text ?? T.accent }}>Still here &rarr;</span>
            <div className="text-[13px] font-semibold text-pale leading-tight mt-1 line-clamp-2">{event}</div>
            <div className="text-[11px] text-silver truncate mt-0.5">{venue}</div>
          </div>
        </div>
      </div>

      <p className="text-[15px] leading-relaxed text-silver">
        We read every venue&rsquo;s stories so you don&rsquo;t have to.{' '}
        <span className="text-pale font-semibold">They sell tickets. <span style={{ color: T.accent }}>We find vibes.</span></span>
      </p>
    </section>
  );
}
