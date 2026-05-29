import { useUser as useClerkUser } from "@clerk/nextjs";

export function useSafeUser() {
  const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
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

  try {
    return useClerkUser();
  } catch (e) {
    return { isLoaded: true, isSignedIn: false, user: null };
  }
}
