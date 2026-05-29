import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(['/', '/sign/(.*)', '/api/public/(.*)']);
const hasClerkKey = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default clerkMiddleware(async (auth, request) => {
  // If Clerk is not configured, skip all protection
  if (!hasClerkKey) return;

  if (!isPublicRoute(request)) {
    await auth().protect();
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
