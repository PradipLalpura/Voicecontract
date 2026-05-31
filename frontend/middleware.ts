import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// EMERGENCY BYPASS FOR VERCEL EDGE RUNTIME ERRORS
// This must be 'export default' for Next.js to recognize it as middleware.
export default function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
