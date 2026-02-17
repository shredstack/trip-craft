import { auth } from "./auth";

/**
 * Get the authenticated user's ID from the NextAuth session.
 * Throws if no session exists (should not happen if middleware is configured correctly).
 */
export async function getAuthenticatedUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  return session.user.id;
}
