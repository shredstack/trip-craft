import { auth } from "./auth";

/**
 * Verify the current session belongs to an admin user.
 * Returns the userId if admin, throws if not authenticated or not an admin.
 * Used by all /api/admin/* routes.
 */
export async function requireAdmin(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  if (!session.user.isAdmin) {
    throw new Error("Not authorized: admin access required");
  }
  return session.user.id;
}
