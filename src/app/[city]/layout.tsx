import { notFound } from 'next/navigation';
import EntryMarker from '@/components/navigation/EntryMarker';
import { isKnownCity } from '@/lib/server-data';

interface Props {
  children: React.ReactNode;
  params: Promise<{ city: string }>;
}

// City pages (home, map, list, event, vibe, area) are public: anyone can read
// them without signing in, which is also what lets search engines and AI
// assistants read them. Sign-in is offered in the page for personal features.
// A first path segment that is not a city gets a real 404.
export default async function CityLayout({ children, params }: Props) {
  const { city } = await params;
  if (!(await isKnownCity(city))) notFound();
  return (
    <>
      <EntryMarker />
      {children}
    </>
  );
}
