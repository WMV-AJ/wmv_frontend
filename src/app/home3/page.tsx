import type { Metadata } from 'next';
import Home3Client from './Home3Client';

export const metadata: Metadata = {
  title: "Where's My Vibe — Less scroll. More tonight.",
  description: "Find your kind of night. We bring venue stories, parties and plans into one place so you can go from scrolling to going.",
  robots: { index: false, follow: true },
};

export default function Home3Page() {
  return <Home3Client />;
}
