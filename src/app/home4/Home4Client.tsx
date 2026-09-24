'use client';
/* eslint-disable @next/next/no-img-element -- Local compressed WebP files are shared exactly with Three.js textures. */

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Menu, X } from 'lucide-react';
import { ALL_CITIES, DEFAULT_CITY, getCityConfig, loadCitiesFromApi } from '@/config/cities.config';
import { VIBES_DATA } from '@/config/vibes-data';
import { FAQ_ITEMS } from '@/content/faq';
import styles from './home4.module.css';

const HeroSculpture = dynamic(() => import('./HeroSculpture'), { ssr: false });
const VibeInstallation = dynamic(() => import('./VibeInstallation'), { ssr: false });

const IMAGE = '/home3/';
const heroPoses = ['Portal', 'Spread', 'Orbit', 'Cascade'] as const;
const vibeDetails: Record<string, { image: string; alt: string; description: string }> = {
  clubs: { image: `${IMAGE}club-entry.webp`, alt: 'Friends entering a warmly lit club', description: 'A floor to disappear into. One more song before you leave.' },
  brunch: { image: `${IMAGE}brunch.webp`, alt: 'Friends at a sunny terrace brunch', description: 'A long table, good company, and nowhere else to be.' },
  rooftops: { image: `${IMAGE}rooftop.webp`, alt: 'Guests at a city rooftop after dark', description: 'Go a little higher. See the evening differently.' },
  ladies: { image: `${IMAGE}friends-night.webp`, alt: 'Friends laughing together in a late-night lounge', description: 'The right room. The right people. Your kind of night.' },
  beach: { image: `${IMAGE}beach-terrace.webp`, alt: 'An open-air terrace beside the water at dusk', description: 'Sea air, warm lights, and plans that stretch past sunset.' },
  happy: { image: `${IMAGE}cocktails.webp`, alt: 'Cocktails at a softly lit metal bar', description: 'A good drink, an easy conversation, another round.' },
  pool: { image: `${IMAGE}pool-terrace.webp`, alt: 'A pool terrace illuminated at twilight', description: 'Open skies and weekend energy, whenever you need it.' },
  live: { image: `${IMAGE}live-performance.webp`, alt: 'A singer performing in an intimate venue', description: 'For the nights you remember because you heard them live.' },
};
const quickFaq = [FAQ_ITEMS[0], FAQ_ITEMS[1], FAQ_ITEMS[2], FAQ_ITEMS[3]];
const clamp = (value: number) => Math.min(1, Math.max(0, value));

function SectionIndex({ number, title, dark = false }: { number: string; title: string; dark?: boolean }) {
  return <div className={`${styles.sectionIndex} ${dark ? styles.darkIndex : ''}`}><span>{number} / 04</span><span className={styles.indexRule} /><span>{title}</span></div>;
}

export default function Home3Client() {
  const scrollerRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const ideaRef = useRef<HTMLElement>(null);
  const howRef = useRef<HTMLElement>(null);
  const vibeRef = useRef<HTMLElement>(null);
  const goRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const heroElapsedRef = useRef(0);
  const heroLastTickRef = useRef<number | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const [selectedCity, setSelectedCity] = useState(DEFAULT_CITY);
  const [citySlugs, setCitySlugs] = useState<string[]>([...ALL_CITIES]);
  const [selectedVibe, setSelectedVibe] = useState(0);
  const [heroPose, setHeroPose] = useState(0);
  const [heroVisible, setHeroVisible] = useState(true);
  const [heroHovered, setHeroHovered] = useState(false);
  const [heroFocused, setHeroFocused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(false);
  const [heroReady, setHeroReady] = useState(false);
  const [vibeReady, setVibeReady] = useState(false);
  const [heroFailed, setHeroFailed] = useState(false);
  const [vibeFailed, setVibeFailed] = useState(false);
  const [vibeNear, setVibeNear] = useState(false);
  const logoSrc = motionEnabled ? "/wmv-logo.gif" : `${IMAGE}wmv-logo-still.png`;
  const activeVibe = VIBES_DATA[selectedVibe];
  const activeDetail = vibeDetails[activeVibe.id];
  const cityName = getCityConfig(selectedCity).displayName;

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setMotionEnabled(!media.matches);
    const change = () => setMotionEnabled(!media.matches);
    media.addEventListener('change', change);
    let storedCity: string | null = null;
    try { storedCity = localStorage.getItem('wmv_last_city'); } catch { /* Optional storage. */ }
    void loadCitiesFromApi().then(() => {
      const slugs = [...ALL_CITIES];
      setCitySlugs(slugs);
      if (storedCity && slugs.includes(storedCity)) setSelectedCity(storedCity);
    });
    return () => media.removeEventListener('change', change);
  }, []);

  useEffect(() => {
    if (!motionEnabled) { setHeroReady(false); setVibeReady(false); }
  }, [motionEnabled]);

  useEffect(() => {
    const stage = heroRef.current;
    const scroller = scrollerRef.current;
    if (!stage || !scroller || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setHeroVisible(entry.isIntersecting), { root: scroller, threshold: .12 });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!motionEnabled || !heroVisible || heroHovered || heroFocused) { heroLastTickRef.current = null; return; }
    const tick = () => {
      if (document.hidden) { heroLastTickRef.current = null; return; }
      const now = performance.now();
      if (heroLastTickRef.current !== null) heroElapsedRef.current += now - heroLastTickRef.current;
      heroLastTickRef.current = now;
      if (heroElapsedRef.current >= 5000) {
        heroElapsedRef.current = 0;
        setHeroPose((current) => (current + 1) % heroPoses.length);
      }
    };
    const timer = window.setInterval(tick, 100);
    const onVisibility = () => { heroLastTickRef.current = null; };
    document.addEventListener('visibilitychange', onVisibility);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisibility); heroLastTickRef.current = null; };
  }, [motionEnabled, heroVisible, heroHovered, heroFocused]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const section = vibeRef.current;
    if (!scroller || !section || typeof IntersectionObserver === 'undefined') { setVibeNear(true); return; }
    const observer = new IntersectionObserver(([entry]) => setVibeNear(entry.isIntersecting), { root: scroller, rootMargin: '500px' });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const mobileMotion = window.matchMedia('(max-width: 700px)').matches && !scroller.classList.contains(styles.still) && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const maxScroll = Math.max(1, scroller.scrollHeight - scroller.clientHeight);
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${scroller.scrollTop / maxScroll})`;
      if (ideaRef.current) {
        const rect = ideaRef.current.getBoundingClientRect();
        const composition = ideaRef.current.querySelector<HTMLElement>(`.${styles.ideaComposition}`);
        const targetRect = mobileMotion && composition ? composition.getBoundingClientRect() : rect;
        const p = mobileMotion ? clamp((scroller.clientHeight * .86 - targetRect.top) / (targetRect.height * .8)) : clamp((scroller.clientHeight * .82 - rect.top) / (rect.height + scroller.clientHeight * .25));
        const fragments = ideaRef.current.querySelectorAll<HTMLElement>('[data-fragment]');
        const scatter = [
          { x: -96, y: 75, r: -14 },
          { x: 33, y: -71, r: 10 },
          { x: 91, y: 82, r: 16 },
        ];
        fragments.forEach((element, index) => {
          const from = scatter[index];
          if (!from) return;
          const distance = mobileMotion ? .32 : 1;
          element.style.transform = `translate3d(${from.x * distance * (1 - p)}px,${from.y * distance * (1 - p)}px,0) rotate(${from.r * distance * (1 - p)}deg)`;
          element.style.opacity = mobileMotion ? String(.5 + p * .5) : '';
        });
        const trace = ideaRef.current.querySelector<SVGPathElement>('[data-idea-trace]');
        if (trace) trace.style.strokeDashoffset = String(1 - p);
      }
      if (howRef.current) {
        const rect = howRef.current.getBoundingClientRect();
        const p = clamp((scroller.clientHeight * .75 - rect.top) / (rect.height - scroller.clientHeight * .12));
        howRef.current.querySelectorAll<SVGPathElement>('[data-how-trace]').forEach((path) => { path.style.strokeDashoffset = String(1 - p); });
        howRef.current.querySelectorAll<HTMLElement>('[data-flow]').forEach((element, index) => {
          const entry = mobileMotion ? clamp((scroller.clientHeight * .82 - element.getBoundingClientRect().top) / (scroller.clientHeight * .34)) : p;
          element.style.transform = `translate3d(${(index % 2 ? -1 : 1) * (1 - entry) * 18}px,${(1 - entry) * 25}px,0)`;
          element.style.opacity = mobileMotion ? String(.48 + entry * .52) : '';
        });
      }
      if (goRef.current) {
        const rect = goRef.current.getBoundingClientRect();
        const p = clamp((scroller.clientHeight * .8 - rect.top) / (rect.height * .76));
        const route = goRef.current.querySelector<SVGPathElement>(`.${styles.atlasRoute}`);
        if (route) route.style.strokeDashoffset = mobileMotion ? String(950 * (1 - p)) : '';
        goRef.current.querySelectorAll<SVGCircleElement>(`.${styles.atlasPlate} circle`).forEach((pin, index) => {
          const reveal = clamp((p - index * .16) * 2.4);
          pin.style.opacity = mobileMotion ? String(reveal) : '';
          pin.style.transform = mobileMotion ? `scale(${.55 + .45 * reveal})` : '';
        });
      }
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    scroller.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
    return () => { scroller.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(frame); };
  }, []);

  useEffect(() => { scrollerRef.current?.dispatchEvent(new Event('scroll')); }, [motionEnabled]);

  const chooseCity = (city: string) => {
    if (!citySlugs.includes(city)) return;
    setSelectedCity(city);
    try { localStorage.setItem('wmv_last_city', city); } catch { /* Optional storage. */ }
  };
  const nextVibe = (step: number) => setSelectedVibe((current) => (current + step + VIBES_DATA.length) % VIBES_DATA.length);
  const chooseHeroPose = (index: number) => { heroElapsedRef.current = 0; heroLastTickRef.current = null; setHeroPose(index); };
  const onHeroReady = useCallback(() => setHeroReady(true), []);
  const onHeroFallback = useCallback(() => { setHeroReady(false); setHeroFailed(true); }, []);
  const onVibeReady = useCallback(() => setVibeReady(true), []);
  const onVibeFallback = useCallback(() => { setVibeReady(false); setVibeFailed(true); }, []);
  const onStagePointerDown = (event: React.PointerEvent) => { dragStartRef.current = { x: event.clientX, y: event.clientY }; };
  const onStagePointerUp = (event: React.PointerEvent) => {
    const start = dragStartRef.current;
    dragStartRef.current = null;
    if (!start) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy) * 1.25) nextVibe(dx < 0 ? 1 : -1);
  };

  return <main ref={scrollerRef} className={`${styles.page} ${motionEnabled ? '' : styles.still}`}>
    <div ref={progressRef} className={styles.progress} aria-hidden="true" />
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href="/home4" className={styles.brand} aria-label="Where's My Vibe home"><img className={styles.brandLogo} src={logoSrc} alt="" aria-hidden="true" width="44" height="44" /><span>WHERE&apos;S MY VIBE<span className={styles.brandPeriod}>.</span></span></Link>
        <nav className={styles.desktopNav} aria-label="Page sections"><a href="#idea">THE IDEA</a><a href="#vibes">VIBES</a><a href="#how">HOW IT WORKS</a></nav>
        <button type="button" className={styles.motionToggle} aria-pressed={motionEnabled} onClick={() => setMotionEnabled((value) => !value)}><span className={styles.toggleLight} /> MOTION {motionEnabled ? 'ON' : 'OFF'}</button>
        <a className={styles.headerExplore} href="#go">EXPLORE <ArrowUpRight size={17} aria-hidden="true" /></a>
        <button type="button" className={styles.menuButton} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="home4-menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
      </div>
      {menuOpen && <nav id="home4-menu" className={styles.mobileNav} aria-label="Mobile page sections"><a href="#idea" onClick={() => setMenuOpen(false)}>THE IDEA</a><a href="#vibes" onClick={() => setMenuOpen(false)}>VIBES</a><a href="#how" onClick={() => setMenuOpen(false)}>HOW IT WORKS</a><a href="#go" onClick={() => setMenuOpen(false)}>EXPLORE THE CITY</a></nav>}
    </header>

    <section id="top" className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.heroHorizon} aria-hidden="true" />
      <div className={styles.heroInner}>
        <div className={styles.heroCopy}>
          <div className={styles.kicker}><span className={styles.kickerLine} /> THE CITY, AFTER HOURS <span className={styles.kickerCounter}>{String(heroPose + 1).padStart(3, '0')} / 004</span></div>
          <h1 id="hero-title">LESS SCROLL.<br /><span>MORE TONIGHT.</span></h1>
          <p>We find the good nights hiding across venue stories, posts and plans. You find the one that feels like yours.</p>
          <div className={styles.heroActions}><a className={styles.mainCta} href="#vibes">FIND YOUR VIBE <ArrowUpRight size={19} aria-hidden="true" /></a><a className={styles.underCta} href="#how">HOW IT WORKS <ArrowDownRight size={18} aria-hidden="true" /></a></div>
          <div className={styles.heroFine}><span>FREE TO EXPLORE</span><span>NO ACCOUNT NEEDED</span></div>
        </div>
        <div ref={heroRef} data-pose={heroPoses[heroPose].toLowerCase()} className={styles.heroVisual} onPointerEnter={(event) => { if ((event.pointerType === 'mouse' || event.pointerType === 'pen') && window.matchMedia('(hover: hover) and (pointer: fine)').matches) setHeroHovered(true); }} onPointerLeave={() => setHeroHovered(false)} onFocusCapture={() => setHeroFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHeroFocused(false); }}>
          <div className={styles.heroPortal} data-pose={heroPoses[heroPose].toLowerCase()} data-scene-state={motionEnabled && !heroFailed ? heroReady ? 'ready' : 'loading' : 'fallback'}>
            <div className={styles.portalFallback} aria-hidden="true"><div className={styles.fallbackLoopOne} /><div className={styles.fallbackLoopTwo} /><div className={styles.fallbackLoopThree} /><div className={`${styles.fallbackPhoto} ${styles.fallbackPhotoClub}`}><img src={`${IMAGE}club-entry.webp`} alt="" /></div><div className={`${styles.fallbackPhoto} ${styles.fallbackPhotoRooftop}`}><img src={`${IMAGE}rooftop.webp`} alt="" /></div><div className={`${styles.fallbackPhoto} ${styles.fallbackPhotoBeach}`}><img src={`${IMAGE}beach-terrace.webp`} alt="" /></div><div className={`${styles.fallbackPhoto} ${styles.fallbackPhotoLive}`}><img src={`${IMAGE}live-performance.webp`} alt="" /></div><div className={`${styles.fallbackPhoto} ${styles.fallbackPhotoFriends}`}><img src={`${IMAGE}friends-night.webp`} alt="" /></div></div>
            {motionEnabled && !heroFailed && <HeroSculpture pose={heroPose} onReady={onHeroReady} onFallback={onHeroFallback} />}
            <span className={styles.portalTopLabel}>WMV / NIGHT OBJECT {String(heroPose + 1).padStart(2, '0')}</span><span className={styles.portalBottomLabel}>A CITY FULL OF POSSIBILITIES <span>↗</span></span>
          </div>
          <div className={styles.heroSceneControls} role="group" aria-label="Choose hero sculpture"><span className={styles.heroSceneReadout}>SCENE {String(heroPose + 1).padStart(2, '0')} / 04 <strong>{heroPoses[heroPose].toUpperCase()}</strong></span><div className={styles.heroSceneButtons}>{heroPoses.map((name, index) => <button key={name} type="button" aria-pressed={heroPose === index} onClick={() => chooseHeroPose(index)}>{name}</button>)}</div></div>
        </div>
      </div>
      <a className={styles.scrollPrompt} href="#idea">SCROLL TO DISCOVER <span>↓</span></a>
    </section>

    <div className={styles.interlude} aria-label="One city, every kind of night"><span>ONE CITY</span><span className={styles.interludeGlyph}>✳</span><span>EVERY KIND OF NIGHT</span><span className={styles.interludeGlyph}>✳</span><span>YOUR CALL</span></div>

    <section id="idea" ref={ideaRef} className={styles.idea} aria-labelledby="idea-title">
      <div className={styles.ideaSticky}>
        <div className={styles.ideaIntro}><SectionIndex number="01" title="THE IDEA" dark /><h2 id="idea-title">47 STORIES DEEP.<br /><span>STILL NO PLAN?</span></h2><p>Everyone is posting. Somewhere in the noise is the night you&apos;re looking for.</p></div>
        <div className={styles.ideaComposition} aria-label="An editorial collage of nightlife possibilities">
          <svg className={styles.ideaTrace} viewBox="0 0 650 570" aria-hidden="true"><path d="M70 415 C150 135 330 500 555 95" pathLength="1" data-idea-trace /></svg>
          <figure className={styles.ideaFragmentOne} data-fragment><img src={`${IMAGE}friends-night.webp`} alt="Friends sharing a night out" loading="lazy" /><figcaption>THE PEOPLE / 01</figcaption></figure>
          <figure className={styles.ideaFragmentTwo} data-fragment><img src={`${IMAGE}cocktails.webp`} alt="Cocktails on a sculptural bar" loading="lazy" /><figcaption>THE PLACE / 02</figcaption></figure>
          <figure className={styles.ideaFragmentThree} data-fragment><img src={`${IMAGE}live-performance.webp`} alt="A singer on stage" loading="lazy" /><figcaption>THE MOMENT / 03</figcaption></figure>
          <span className={styles.ideaCompositionLabel}>A LITTLE LESS NOISE.<br />A LOT MORE NIGHT.</span>
        </div>
        <div className={styles.ideaConclusion}><span>WE WATCH THE STORIES.</span><strong>YOU PICK THE VIBE.</strong><span className={styles.ideaConclusionArrow}>↗</span></div>
      </div>
    </section>

    <section id="vibes" ref={vibeRef} className={styles.vibes} aria-labelledby="vibes-title">
      <div className={styles.vibesInner}>
        <div className={styles.vibeHeading}><SectionIndex number="02" title="FIND YOUR VIBE" /><h2 id="vibes-title">WHAT KIND OF<br /><span>NIGHT IS IT?</span></h2><p>Start with a feeling. We&apos;ll take you somewhere.</p></div>
        <div className={styles.vibeStage} onPointerDown={onStagePointerDown} onPointerUp={onStagePointerUp} onPointerCancel={() => { dragStartRef.current = null; }} data-scene-state={motionEnabled && !vibeFailed && vibeNear ? vibeReady ? 'ready' : 'loading' : 'fallback'} aria-label="Nightlife category gallery. Drag horizontally to change the selected vibe.">
          <div className={styles.vibeFallback} aria-hidden="true">{VIBES_DATA.map((vibe, index) => { const raw = (index - selectedVibe + VIBES_DATA.length) % VIBES_DATA.length; const delta = raw > 4 ? raw - VIBES_DATA.length : raw; const depth = Math.abs(delta); return <div key={vibe.id} className={styles.fanCard} style={{ transform: `translate3d(calc(-50% + ${delta * 84}px), ${depth * 16}px, 0) rotate(${delta * 7}deg) scale(${depth ? Math.max(.58, .81 - depth * .045) : 1.12})`, zIndex: 10 - depth }}><img src={vibeDetails[vibe.id].image} alt="" loading="lazy" /></div>; })}</div>
          {motionEnabled && vibeNear && !vibeFailed && <VibeInstallation activeIndex={selectedVibe} onReady={onVibeReady} onFallback={onVibeFallback} />}
          <span className={styles.vibeStageCounter}>SELECTED / {String(selectedVibe + 1).padStart(2, '0')}—08</span><span className={styles.vibeDragHint}>DRAG TO EXPLORE <span>↔</span></span>
        </div>
        <div className={styles.vibeSelected}><div><span>THE FEELING / {String(selectedVibe + 1).padStart(2, '0')}</span><h3>{activeVibe.label}</h3><p>{activeDetail.description}</p></div><Link className={styles.vibeLink} href={`/${selectedCity}/vibe/${activeVibe.id}`} aria-label={`Explore ${activeVibe.label} in ${cityName}`}>EXPLORE {activeVibe.label.toUpperCase()} <ArrowUpRight size={19} aria-hidden="true" /></Link></div>
        <div className={styles.vibeIndex} role="group" aria-label="Select a nightlife vibe">{VIBES_DATA.map((vibe, index) => <button key={vibe.id} type="button" aria-pressed={selectedVibe === index} className={`${styles.vibeButton} ${selectedVibe === index ? styles.vibeButtonActive : ''}`} onClick={() => setSelectedVibe(index)}><span>{String(index + 1).padStart(2, '0')}</span>{vibe.label}<ArrowUpRight size={17} aria-hidden="true" /></button>)}</div>
      </div>
    </section>

    <section id="how" ref={howRef} className={styles.how} aria-labelledby="how-title"><div className={styles.howInner}><SectionIndex number="03" title="HOW IT WORKS" dark /><div className={styles.howHeading}><h2 id="how-title">FROM THEIR STORIES.<br /><span>TO YOUR PLANS.</span></h2><p>Three moves between seeing what&apos;s out there and actually going.</p></div>
      <div className={styles.howScene}>
        <svg className={styles.howPathDesktop} viewBox="0 0 1200 700" preserveAspectRatio="none" aria-hidden="true"><path className={styles.pathBase} d="M90 180 C290 140 310 370 520 300 S830 160 940 410 S1070 600 1130 540" /><path className={styles.pathActive} d="M90 180 C290 140 310 370 520 300 S830 160 940 410 S1070 600 1130 540" pathLength="1" data-how-trace /></svg>
        <svg className={styles.howPathMobile} viewBox="0 0 400 950" preserveAspectRatio="none" aria-hidden="true"><path className={styles.pathBase} d="M60 80 C270 130 290 240 180 360 S120 570 280 700 S240 860 310 900" /><path className={styles.pathActive} d="M60 80 C270 130 290 240 180 360 S120 570 280 700 S240 860 310 900" pathLength="1" data-how-trace /></svg>
        <div className={`${styles.howStop} ${styles.howFind}`}><div className={styles.howGraphicSources} data-flow><span>VENUE POSTS</span><span>STORIES</span><span>TICKETING FEEDS</span></div><div className={styles.howStepCopy}><span>01 / FIND</span><h3>WE FIND IT.</h3><p>Public venue stories, posts, feeds and sites are scanned every day.</p></div></div>
        <div className={`${styles.howStop} ${styles.howSort}`}><div className={styles.prism} data-flow aria-hidden="true"><span /><span /><span /></div><div className={styles.howStepCopy}><span>02 / SORT</span><h3>WE SORT IT.</h3><p>Events become clear choices by vibe, from brunch to live music.</p></div></div>
        <div className={`${styles.howStop} ${styles.howGo}`}><div className={styles.howMarker} data-flow aria-hidden="true"><span /></div><div className={styles.howStepCopy}><span>03 / GO</span><h3>YOU GO.</h3><p>Open the map or list. Find tonight&apos;s plan and get out the door.</p></div></div>
      </div><div className={styles.howBottom}><span>FROM SCATTERED SIGNALS</span><span className={styles.howBottomLine} /><span>TO ONE PLACE TO START</span></div></div></section>

    <section id="go" ref={goRef} className={styles.go} aria-labelledby="go-title"><div className={styles.goInner}><div className={styles.goCopy}><SectionIndex number="04" title="YOUR CITY" /><h2 id="go-title">YOUR NEXT<br />GOOD NIGHT<br /><span>STARTS HERE.</span></h2><p>Pick your city. We&apos;ll show you what&apos;s on.</p><div className={styles.cityControls}><label htmlFor="home4-city">YOUR CITY</label><div className={styles.citySelectWrap}><select id="home4-city" value={selectedCity} onChange={(event) => chooseCity(event.target.value)}>{citySlugs.map((slug) => <option key={slug} value={slug}>{getCityConfig(slug).displayName}</option>)}</select><span aria-hidden="true">⌄</span></div><Link className={styles.cityPrimary} href={`/${selectedCity}/map`}>SEE THE MAP <ArrowUpRight size={19} aria-hidden="true" /></Link><Link className={styles.citySecondary} href={`/${selectedCity}/cards`}>BROWSE THE LIST <ArrowRight size={18} aria-hidden="true" /></Link></div><span className={styles.cityNote}>FREE TO EXPLORE / NO ACCOUNT REQUIRED</span></div>
      <div className={styles.atlas} aria-label={`Illustrative route design for ${cityName}; use the links to open the actual map or list`}><div className={styles.atlasPlate}><div className={styles.atlasGrid} /><svg viewBox="0 0 650 560" aria-hidden="true"><path className={styles.atlasRouteShadow} d="M80 430 C165 370 230 455 285 310 S365 165 460 235 S520 110 580 100" /><path key={selectedCity} className={styles.atlasRoute} d="M80 430 C165 370 230 455 285 310 S365 165 460 235 S520 110 580 100" /><circle cx="80" cy="430" r="13" /><circle cx="285" cy="310" r="10" /><circle cx="460" cy="235" r="11" /><circle cx="580" cy="100" r="16" /></svg><span className={styles.atlasLabel}>A CITY TO EXPLORE <strong>{cityName.toUpperCase()}</strong></span></div><div className={styles.atlasFoot}>ILLUSTRATIVE CITY ATLAS <span>↗</span></div></div></div></section>

    <section className={styles.faq} aria-labelledby="faq-title"><div className={styles.faqInner}><div className={styles.faqIntro}><span className={styles.lightKicker}>A FEW GOOD QUESTIONS / 01—04</span><h2 id="faq-title">GOOD TO<br />KNOW<span>.</span></h2><Link href="/faq">ALL QUESTIONS <ArrowUpRight size={17} aria-hidden="true" /></Link></div><div className={styles.faqItems}>{quickFaq.map((item, index) => <details key={item.q}><summary><span>{String(index + 1).padStart(2, '0')}</span><strong>{item.q}</strong><i aria-hidden="true">+</i></summary><p>{item.a}</p></details>)}</div></div></section>

    <section className={styles.venue} aria-labelledby="venue-title"><div className={styles.venueSpotlight} aria-hidden="true" /><div className={styles.venuePhoto}><img src={`${IMAGE}live-performance.webp`} alt="A singer performing under a spotlight" loading="lazy" /></div><div className={styles.venueCopy}><span>TO THE PLACES THAT MAKE THE NIGHT</span><h2 id="venue-title">MAKE YOUR VENUE<br /><span>SOMEONE&apos;S NEXT PLAN.</span></h2><p>Your stories are probably already on our radar. Make sure your next night gets seen.</p><Link href="/list-your-venue">LIST YOUR VENUE <ArrowUpRight size={18} aria-hidden="true" /></Link></div><div className={styles.venueCorner}>WMV / FOR VENUES</div></section>

    <footer className={styles.footer}><div className={styles.footerTop}><div className={styles.footerIdentity}><img className={styles.footerLogo} src={logoSrc} alt="" aria-hidden="true" width="80" height="80" /><div><span className={styles.footerKicker}>WHERE&apos;S MY VIBE / AFTER HOURS</span><p>WE WATCH THE STORIES.<br />YOU PICK THE VIBE.</p></div></div><div className={styles.footerLinks}><div><span>EXPLORE</span><Link href={`/${selectedCity}/map`}>The map</Link><Link href={`/${selectedCity}/cards`}>The list</Link><a href="#vibes">Find your vibe</a></div><div><span>MORE</span><Link href="/how-it-works">How it works</Link><Link href="/faq">FAQ</Link><Link href="/list-your-venue">List your venue</Link></div></div></div><div className={styles.footerMark} aria-hidden="true" data-outline="WMV">WMV<span>.</span></div><div className={styles.footerBottom}><span>© {new Date().getFullYear()} WHERE&apos;S MY VIBE</span><span>BUILT FOR GOING OUT</span><a href="#top">BACK TO TOP ↑</a></div></footer>
  </main>;
}
