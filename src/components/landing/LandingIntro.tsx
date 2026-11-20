'use client';

// The landing intro: the top copy, the five source shapes with their rings of
// icons, and the canvas that draws the shapes, dots, sphere, map and pills.
// Timing and drawing live in src/lib/landing/intro-scene.ts; this file owns the
// DOM, the clock and the sizing.
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Instrument_Serif } from 'next/font/google';
import {
  AudioWaveform, Beer, Bike, BookOpen, Brain, Camera, ChefHat, CircleDashed, Coffee, Dices, Disc3, Drum, Dumbbell,
  Flower2, Footprints, Gamepad2, Guitar, Handshake, Headphones, HeartHandshake, Image as ImageIcon, Laugh, Martini,
  Megaphone, MessageCircle, Mic, MicVocal, Mountain, Music, Palette, PartyPopper, Piano, Radio, Sailboat, Sun, Tent,
  Ticket, Trophy, Tv, Users, Utensils, Waves, Wine, type LucideIcon,
} from 'lucide-react';
import { COLOR_HEX_MAP } from '@/lib/category-mappings';
import { bodyFont, displayFont } from '@/lib/theme/tokens';
import {
  BEAT_LENGTH, BEAT_START, BRAND_SIZE, BRAND_X, BRAND_Y, DESIGN_W, LOGO_TIME, RING_RADIUS, ROW_AT, SOURCES, TOTAL, beatAt, buildScene,
  clamp, drawIntro, drawPrelude, easeBack, easeIn, easeOut, logoPose, makeLayout, prog, type IntroFonts, type Layout, type Scene,
} from '@/lib/landing/intro-scene';

// The one face the intro adds to the site's Roboto / Open Sans pair: an italic
// serif for the headline. Loaded here so only the landing page downloads it.
const headlineFont = Instrument_Serif({ weight: '400', style: 'italic', subsets: ['latin'], display: 'swap' });

interface RingItem {
  Icon?: LucideIcon;
  logo?: string;
  caption?: string;
  color?: string;
}

const named = (Icon: LucideIcon, caption: string, color: string): RingItem => ({ Icon, caption, color });
const logo = (file: string): RingItem => ({ logo: `/home/sources/${file}.png` });
const icon = (Icon: LucideIcon): RingItem => ({ Icon });

/** What sits around each source shape, in the order of SOURCES. */
const RINGS: readonly RingItem[][] = [
  // Instagram stories: the event categories found in them, in their own colours.
  [
    named(Wine, 'Bars', COLOR_HEX_MAP.violet), named(Disc3, 'Clubs', COLOR_HEX_MAP.pink),
    named(Utensils, 'Dining', COLOR_HEX_MAP.orange), named(Martini, 'Ladies night', COLOR_HEX_MAP.purple),
    named(Beer, 'Happy hour', COLOR_HEX_MAP.teal), named(Waves, 'Pool', COLOR_HEX_MAP.blue),
    named(Sun, 'Brunch', COLOR_HEX_MAP.indigo), named(Tv, 'Sports', COLOR_HEX_MAP.red),
    named(Laugh, 'Comedy', COLOR_HEX_MAP.gray), named(MicVocal, 'Karaoke', COLOR_HEX_MAP.rose),
  ],
  // Instagram posts: music genres. Genres have no colour of their own on the site.
  [
    named(AudioWaveform, 'Techno', COLOR_HEX_MAP.sage), named(Headphones, 'House', COLOR_HEX_MAP.purple),
    named(Guitar, 'Live', COLOR_HEX_MAP.green), named(Piano, 'Jazz', COLOR_HEX_MAP.indigo),
    named(Mic, 'Hip-hop', COLOR_HEX_MAP.gold), named(Drum, 'Bollywood', COLOR_HEX_MAP.saffron),
    named(Radio, 'Afro', COLOR_HEX_MAP.burgundy), named(Music, 'R&B', COLOR_HEX_MAP.rose),
  ],
  ['bookmyshow', 'platinumlist', 'district', 'allevents', 'highape', 'fever', 'sortmyscene', 'ra', 'dubainight', 'bandsintown', 'songkick', 'cocacolaarena'].map(logo),
  [Utensils, BookOpen, Brain, Dices, Mic, HeartHandshake, Coffee, Tent, PartyPopper, Megaphone, Handshake, MessageCircle].map(icon),
  [Footprints, Trophy, Flower2, Mountain, Palette, Music, Dumbbell, Waves, Camera, ChefHat, Gamepad2, Sailboat].map(icon),
];
const GLYPHS: readonly LucideIcon[] = [CircleDashed, ImageIcon, Ticket, Users, Bike];

const MAX_STAGE_WIDTH = 480;
/** The logo opening plus the intro proper. */
const FULL_TIME = LOGO_TIME + TOTAL;
const SAT_SIZE = 38;

export type IntroMode = 'pending' | 'playing' | 'done';

export interface LandingIntroHandle {
  skipToEnd: () => void;
  getTime: () => number;
}

interface LandingIntroProps {
  mode: IntroMode;
  onComplete?: () => void;
}

interface Refs {
  glyphs: Array<HTMLDivElement | null>;
  names: Array<HTMLDivElement | null>;
  sats: Array<Array<HTMLDivElement | null>>;
}

function show(el: HTMLElement | null, visible: boolean): void {
  if (el) el.style.visibility = visible ? 'visible' : 'hidden';
}

/** Move the DOM pieces (glyph, ring, name, counter) to where they belong at time t. */
function updateDom(refs: Refs, counter: HTMLDivElement | null, label: HTMLDivElement | null, layout: Layout, t: number, ambient: number): void {
  const { cx, cy, mid } = layout;
  SOURCES.forEach((_, i) => {
    const start = beatAt(i);
    const end = i < SOURCES.length - 1 ? start + BEAT_LENGTH : ROW_AT;
    const live = t >= start && t < end + 0.12;
    const glyph = refs.glyphs[i];
    const name = refs.names[i];
    show(glyph, live);
    show(name, live);
    refs.sats[i].forEach((el) => show(el, live));
    if (!live) return;
    const out = prog(t, end - 0.04, end + 0.1);
    const pop = prog(t, start + 0.1, start + 0.38);
    if (glyph) {
      glyph.style.transform = `translate(${cx}px, ${cy}px) rotate(${(1 - easeOut(pop)) * -50}deg) scale(${clamp(easeBack(pop), 0, 1.15) * (1 - out) * mid})`;
    }
    if (name) {
      name.style.transform = `translateY(${(1 - easeOut(prog(t, start, start + 0.26))) * 105 - easeIn(prog(t, end - 0.1, end + 0.1)) * 105}%)`;
    }
    const count = refs.sats[i].length;
    refs.sats[i].forEach((el, j) => {
      if (!el) return;
      const k = prog(t, start + 0.06 + j * 0.012, start + 0.26 + j * 0.012);
      const angle = (j / count) * Math.PI * 2 - Math.PI / 2 + ambient * 0.35 + i * 0.4;
      const radius = RING_RADIUS * mid * (0.62 + 0.38 * easeOut(k));
      el.style.transform = `translate(${cx + Math.cos(angle) * radius}px, ${cy + Math.sin(angle) * radius}px) scale(${clamp(easeBack(k), 0, 1.12) * (1 - out) * mid})`;
    });
  });
  if (label) label.style.top = `${cy + (RING_RADIUS + SAT_SIZE / 2 + 29) * mid}px`;
  if (counter) {
    const current = clamp(Math.floor((t - BEAT_START) / BEAT_LENGTH), 0, SOURCES.length - 1);
    counter.textContent = `0${current + 1} / 0${SOURCES.length}`;
    counter.style.color = SOURCES[current].color;
    counter.style.opacity = String(prog(t, BEAT_START, BEAT_START + 0.2) * (1 - prog(t, ROW_AT - 0.08, ROW_AT + 0.06)));
  }
}

/** The logo grows in the middle, then rises into the top bar as the copy fades in. */
function updateBrand(logo: HTMLImageElement | null, wordmark: HTMLDivElement | null, copy: HTMLDivElement | null, layout: Layout, t: number): void {
  const pose = logoPose(layout, t);
  if (logo) {
    logo.style.width = `${pose.size}px`;
    logo.style.height = `${pose.size}px`;
    logo.style.transform = `translate(${pose.x - pose.size / 2}px, ${pose.y - pose.size / 2}px)`;
    logo.style.opacity = '1';
  }
  if (wordmark) wordmark.style.opacity = String(pose.wordmark);
  if (copy) {
    copy.style.opacity = String(pose.copy);
    copy.style.transform = `translateY(${(1 - easeOut(pose.copy)) * 14}px)`;
  }
}

export const LandingIntro = forwardRef<LandingIntroHandle, LandingIntroProps>(function LandingIntro({ mode, onComplete }, ref) {
  const hostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const sentenceRef = useRef<HTMLParagraphElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const domRefs = useRef<Refs>({ glyphs: [], names: [], sats: RINGS.map(() => []) });
  const clock = useRef({ t: 0, ambient: 0, completed: false });
  const modeRef = useRef<IntroMode>(mode);
  const onCompleteRef = useRef(onComplete);
  modeRef.current = mode;
  onCompleteRef.current = onComplete;

  useImperativeHandle(ref, () => ({
    skipToEnd: () => { clock.current.t = FULL_TIME; },
    getTime: () => clock.current.t,
  }), []);

  useEffect(() => {
    const host = hostRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!host || !stage || !canvas || !ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let scene: Scene | null = null;
    let fonts: IntroFonts = { display: 'sans-serif', body: 'sans-serif' };
    let frame = 0;
    let last: number | null = null;
    let drawnKey = '';
    let sceneVersion = 0;

    const measure = (): void => {
      const scale = Math.min(host.clientWidth, MAX_STAGE_WIDTH) / DESIGN_W;
      if (scale <= 0) return;
      const height = host.clientHeight / scale;
      stage.style.height = `${height}px`;
      stage.style.transform = `scale(${scale})`;
      const pixels = Math.min(3, Math.min(2, window.devicePixelRatio || 1) * Math.max(1, scale));
      canvas.width = Math.round(DESIGN_W * pixels);
      canvas.height = Math.round(height * pixels);
      canvas.style.height = `${height}px`;
      ctx.setTransform(pixels, 0, 0, pixels, 0, 0);
      const nameEl = domRefs.current.names[0];
      fonts = {
        display: nameEl ? getComputedStyle(nameEl).fontFamily : 'sans-serif',
        body: sentenceRef.current ? getComputedStyle(sentenceRef.current).fontFamily : 'sans-serif',
      };
      scene = buildScene(ctx, makeLayout(height), fonts);
      sceneVersion += 1;
    };

    const tick = (now: number): void => {
      frame = requestAnimationFrame(tick);
      const dt = last === null ? 0 : Math.min(0.05, (now - last) / 1000);
      last = now;
      const state = clock.current;
      const current = modeRef.current;
      if (current === 'done') state.t = FULL_TIME;
      else if (current === 'playing') state.t = Math.min(FULL_TIME, state.t + dt);
      if (current === 'playing' && state.t >= FULL_TIME && !state.completed) {
        state.completed = true;
        onCompleteRef.current?.();
      }
      if (!reducedMotion && current !== 'pending') state.ambient += dt;
      if (!scene || current === 'pending') return;
      // At rest only the markers breathe, so a third of the frames is plenty.
      const ambientKey = state.t >= FULL_TIME ? Math.floor(state.ambient * 20) : state.ambient;
      const key = `${state.t}|${ambientKey}|${sceneVersion}`;
      if (key === drawnKey) return;
      drawnKey = key;
      // The intro proper starts once the logo has gone up into the top bar.
      const introTime = state.t - LOGO_TIME;
      updateBrand(logoRef.current, wordmarkRef.current, copyRef.current, scene.layout, state.t);
      updateDom(domRefs.current, counterRef.current, labelRef.current, scene.layout, introTime, state.ambient);
      drawIntro(ctx, scene, fonts, introTime, state.ambient);
      drawPrelude(ctx, scene.layout, state.t, state.ambient);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    document.fonts?.ready.then(measure).catch(() => undefined);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={hostRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#000' }}>
      <div
        ref={stageRef}
        style={{
          position: 'absolute', top: 0, left: '50%', marginLeft: -DESIGN_W / 2, width: DESIGN_W,
          transformOrigin: 'top center', color: '#fff',
        }}
      >
        {/* The logo, wordmark and copy start hidden; the clock places them on its first frame. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={logoRef}
          src="/wmv-logo.gif"
          alt=""
          width={BRAND_SIZE}
          height={BRAND_SIZE}
          style={{ position: 'absolute', left: 0, top: 0, width: BRAND_SIZE, height: BRAND_SIZE, borderRadius: '50%', objectFit: 'cover', opacity: 0, zIndex: 7, willChange: 'transform, width, height' }}
        />
        <div
          ref={wordmarkRef}
          style={{ position: 'absolute', left: BRAND_X + BRAND_SIZE / 2 + 10, top: BRAND_Y - 7, fontFamily: displayFont, fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em', lineHeight: 1, opacity: 0, zIndex: 6 }}
        >
          Where&rsquo;s My Vibe
        </div>

        <div ref={copyRef} style={{ position: 'absolute', left: 24, right: 24, top: 82, zIndex: 6, opacity: 0 }}>
          <h1 className={headlineFont.className} style={{ fontStyle: 'italic', fontWeight: 400, fontSize: 47, lineHeight: 1, letterSpacing: '-0.005em', whiteSpace: 'nowrap', margin: 0 }}>
            Discover your plans.
          </h1>
          <p ref={sentenceRef} style={{ fontFamily: bodyFont, fontSize: 14.5, lineHeight: 1.55, fontWeight: 500, color: '#d9dad6', margin: '12px 0 0' }}>
            We scan Instagram stories, posts, ticketing platforms, community events and activities, and put everything on one map.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, fontFamily: bodyFont, fontSize: 12.5, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            Every event, one map
            <span aria-hidden style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(255,255,255,0.5), rgba(255,255,255,0))' }} />
          </div>
        </div>

        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Five sources break into dots, the dots form a sphere, and the sphere opens into a world map of events sorted by category"
          style={{ position: 'absolute', left: 0, top: 0, width: DESIGN_W, pointerEvents: 'none', zIndex: 3 }}
        />

        <div aria-hidden>
          {SOURCES.map((source, i) => {
            const Glyph = GLYPHS[i];
            return (
              <div key={source.label}>
                <div
                  ref={(el) => { domRefs.current.glyphs[i] = el; }}
                  style={{ position: 'absolute', left: 0, top: 0, width: 64, height: 64, margin: '-32px 0 0 -32px', color: '#0b0b0b', zIndex: 4, visibility: 'hidden', pointerEvents: 'none' }}
                >
                  <Glyph size={64} strokeWidth={1.7} />
                </div>
                {RINGS[i].map((item, j) => (
                  <div
                    key={j}
                    ref={(el) => { domRefs.current.sats[i][j] = el; }}
                    style={{ position: 'absolute', left: 0, top: 0, width: SAT_SIZE, height: SAT_SIZE, margin: `${-SAT_SIZE / 2}px 0 0 ${-SAT_SIZE / 2}px`, zIndex: 4, visibility: 'hidden', willChange: 'transform' }}
                  >
                    <div
                      style={{
                        width: SAT_SIZE, height: SAT_SIZE, borderRadius: '50%', display: 'grid', placeItems: 'center', overflow: 'hidden',
                        background: '#000', color: item.color ?? '#fff', border: `1.2px solid ${item.color ?? 'rgba(255,255,255,0.5)'}`,
                      }}
                    >
                      {item.logo
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={item.logo} alt="" width={SAT_SIZE} height={SAT_SIZE} style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#fff' }} />
                        : item.Icon ? <item.Icon size={18} strokeWidth={1.6} /> : null}
                    </div>
                    {item.caption && (
                      <span style={{ position: 'absolute', left: '50%', top: SAT_SIZE + 4, transform: 'translateX(-50%)', fontFamily: bodyFont, fontSize: 7.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        {item.caption}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            );
          })}

          <div ref={labelRef} style={{ position: 'absolute', left: 0, right: 0, top: 0, zIndex: 4, textAlign: 'center', pointerEvents: 'none' }}>
            <div ref={counterRef} style={{ fontFamily: displayFont, fontWeight: 500, fontSize: 11, letterSpacing: '0.24em', fontVariantNumeric: 'tabular-nums', opacity: 0 }} />
            <div style={{ position: 'relative', height: 40, overflow: 'hidden', marginTop: 4 }}>
              {SOURCES.map((source, i) => (
                <div
                  key={source.label}
                  ref={(el) => { domRefs.current.names[i] = el; }}
                  style={{ position: 'absolute', inset: 0, fontFamily: displayFont, fontWeight: 900, fontSize: 27, lineHeight: '40px', letterSpacing: '0.03em', textTransform: 'uppercase', whiteSpace: 'nowrap', visibility: 'hidden' }}
                >
                  {source.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
