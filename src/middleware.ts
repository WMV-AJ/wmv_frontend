// Auth is handled client-side via AuthContext, which talks to the backend at
// ${NEXT_PUBLIC_BACKEND_URL}/api/auth/*. This middleware is a pass-through —
// no route protection (the app is intentionally public; login is optional).
import { NextResponse } from 'next/server';

export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|404|_error|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
