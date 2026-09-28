import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper">
      <div className="text-center space-y-4 p-8">
        <h2 className="text-2xl font-bold text-ink">404 - Page Not Found</h2>
        <p className="text-ink-muted">Could not find the requested page.</p>
        <Link
          href="/"
          className="inline-block px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
