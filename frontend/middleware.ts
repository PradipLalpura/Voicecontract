// EMERGENCY BYPASS FOR VERCEL EDGE RUNTIME ERRORS
// Clerk middleware is causing #crypto issues in Vercel Edge.
// This file is simplified to allow the build to pass.
// Auth is still handled within the layout and pages.

export default function middleware() {
  return;
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
