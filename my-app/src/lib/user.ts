import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function emailFromClerkLike(profile: {
  primaryEmailAddressId?: string | null;
  emailAddresses?: Array<{ id?: string | null; emailAddress?: string | null }>;
}): string | null {
  const list = profile.emailAddresses ?? [];
  const primaryId = profile.primaryEmailAddressId;
  const primary = primaryId
    ? list.find((e) => e.id === primaryId)?.emailAddress
    : undefined;
  return primary ?? list[0]?.emailAddress ?? null;
}

function nameFromClerkLike(profile: {
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
}): string | null {
  const combined = [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim();
  return combined || profile.firstName || profile.username || null;
}

/**
 * Maps Clerk identity to our Prisma User row (creates on first sign-in).
 *
 * Uses `currentUser()` when available; falls back to `users.getUser(userId)` because
 * `currentUser()` is often null on the first RSC render after OAuth redirect (production).
 */
export async function getOrCreateAppUser(): Promise<User | null> {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  let profile = await currentUser();
  if (!profile) {
    try {
      const client = await clerkClient();
      profile = await client.users.getUser(userId);
    } catch (e) {
      console.error("[getOrCreateAppUser] clerkClient.users.getUser failed:", e);
      return null;
    }
  }

  const email = emailFromClerkLike(profile);
  if (!email) {
    console.error("[getOrCreateAppUser] No email for Clerk user", userId);
    return null;
  }

  const name = nameFromClerkLike(profile);

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

  // Same email, new Clerk user id (new dev instance, deleted Clerk user, etc.)
  const rowForEmail = await prisma.user.findUnique({
    where: { email },
  });
  if (rowForEmail && rowForEmail.clerkUserId !== userId) {
    return prisma.user.update({
      where: { id: rowForEmail.id },
      data: { clerkUserId: userId, name },
    });
  }
  if (rowForEmail) {
    return rowForEmail;
  }

  try {
    return await prisma.user.create({
      data: {
        clerkUserId: userId,
        email,
        name,
      },
    });
  } catch (e: unknown) {
    const code =
      typeof e === "object" && e !== null && "code" in e
        ? String((e as { code?: string }).code)
        : "";
    if (code === "P2002") {
      const byClerk = await prisma.user.findUnique({
        where: { clerkUserId: userId },
      });
      if (byClerk) {
        return byClerk;
      }
      const byEmail = await prisma.user.findUnique({ where: { email } });
      if (byEmail) {
        return prisma.user.update({
          where: { id: byEmail.id },
          data: { clerkUserId: userId, name },
        });
      }
      return null;
    }
    console.error("[getOrCreateAppUser] prisma.user.create failed:", e);
    throw e;
  }
}
