// Font-trial route: /[city]/home2 renders the same city home with the
// Futura / Lyon Text / Life combination (see CityHome2Client.tsx).
// noindex — this is an internal comparison page, not a public duplicate.
import type { Metadata } from 'next';
import CityHome2Client from './CityHome2Client';

export const metadata: Metadata = {
  title: 'Home — font trial (Futura / Lyon / Life)',
  robots: { index: false, follow: false },
};

export default function CityHome2Page() {
  return <CityHome2Client />;
}
