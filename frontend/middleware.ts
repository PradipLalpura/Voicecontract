import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// VoiceContract - Elite Legal Grid
// This middleware is kept minimal to ensure compatibility with Vercel Edge Runtime.
// Authentication is handled at the page level to maximize stability during the buildathon.

export default function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
