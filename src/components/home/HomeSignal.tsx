'use client';

// The idea: kicker, heading, one line with the live count, then WMV drawn at
// the centre of where the listings come from (SourceOrbit) and a legend of
// what's live vs next.

import { HF } from './home-fonts';
import { SectionKickerRule } from './HomeParts';
import SourceOrbit from './SourceOrbit';

export default function HomeSignal({ liveCount, loading, countryCode, scrollRoot }: {
  liveCount: number;
  loading: boolean;
  /** City's ISO country (city config region) — picks the ticketing sites shown. */
  countryCode?: string;
  scrollRoot: React.RefObject<HTMLElement | null>;
}) {
  return (
    <section className="px-[18px] pt-16" aria-labelledby="home-signal-title">
      <SectionKickerRule count={loading ? undefined : `${liveCount} live now`}>The idea</SectionKickerRule>
      <h2 id="home-signal-title" className={`${HF.idea} text-pale mt-4`}>
        We watch every venue&rsquo;s stories.<br /><em className="italic text-silver">You pick the vibe.</em>
      </h2>
      <p className="text-[15px] leading-relaxed text-silver mt-3">
        We read every venue&rsquo;s stories so you don&rsquo;t have to &mdash; plus their posts and
        listings &mdash; and pull it all into one place, every day.
      </p>
      <SourceOrbit countryCode={countryCode} scrollRoot={scrollRoot} />
    </section>
  );
}
