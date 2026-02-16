import { prisma } from "./db";

export async function getOrCreateUser(userId: string) {
  let user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        id: userId,
        email: `${userId}@tripcraft.local`,
      },
    });
  }

  return user;
}

export function getUserIdFromRequest(request: Request): string {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    throw new Error("Missing x-user-id header");
  }
  return userId;
}
