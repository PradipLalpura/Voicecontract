import { useUser as useClerkUser } from "@clerk/nextjs";

export function useSafeUser() {
  const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  // Always call the hook unconditionally to satisfy React's Rules of Hooks.
  // useClerkUser() will throw if there's no ClerkProvider in the tree,
  // so we wrap it in a try/catch for resilience.
  let clerkResult: any = { isLoaded: true, isSignedIn: false, user: null };
  try {
    clerkResult = useClerkUser();
  } catch (e) {
    // Clerk not available (no ClerkProvider in tree)
  }
  
  if (!hasClerk) {
    return {
      isLoaded: true,
      isSignedIn: true,
      user: {
        id: "mock_user_123",
        firstName: "Guest",
        lastName: "Chief",
        imageUrl: "https://ui-avatars.com/api/?name=Guest+Chief&background=00C2CC&color=fff",
      }
    };
  }

  return clerkResult;
}
