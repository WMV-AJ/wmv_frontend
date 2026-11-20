import RequireAuth from '@/components/auth/RequireAuth';

// Every city page (home, map, list, event, vibe, area) requires sign-in.
// The marketing pages and the landing page live outside this segment.
export default function CityLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
