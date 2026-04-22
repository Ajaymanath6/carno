import { auth, currentUser } from "@clerk/nextjs/server";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Maps Clerk identity to our Prisma User row (creates on first sign-in).
 */
export async function getOrCreateAppUser(): Promise<User | null> {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  const cu = await currentUser();
  if (!cu) {
    return null;
  }

  const email = cu.emailAddresses[0]?.emailAddress;
  if (!email) {
    return null;
  }

  const name =
    [cu.firstName, cu.lastName].filter(Boolean).join(" ").trim() ||
    cu.firstName ||
    cu.username ||
    null;

  const existing = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (existing) {
    if (existing.email !== email || existing.name !== name) {
      return prisma.user.update({
        where: { id: existing.id },
        data: { email, name },
      });
    }
    return existing;
  }

  return prisma.user.create({
    data: {
      clerkUserId: userId,
      email,
      name,
    },
  });
}
