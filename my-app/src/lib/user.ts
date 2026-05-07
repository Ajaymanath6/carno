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
 * Prefer `users.getUser(userId)` once `auth()` yields a Clerk id. It is more
 * stable in RSC render paths than `currentUser()`, which may throw in dev/SSR
 * when Clerk backend fetch fails transiently.
 */
export async function getOrCreateAppUser(): Promise<User | null> {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  let profile = null as Awaited<ReturnType<typeof currentUser>> | null;
  try {
    const client = await clerkClient();
    profile = await client.users.getUser(userId);
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    console.warn(
      `[getOrCreateAppUser] users.getUser failed for ${userId}${message ? `: ${message}` : ""}`,
    );
  }

  if (!profile) {
    try {
      profile = await currentUser();
    } catch (e) {
      const message = e instanceof Error ? e.message : "";
      console.warn(
        `[getOrCreateAppUser] currentUser fallback failed for ${userId}${message ? `: ${message}` : ""}`,
      );
      return null;
    }
  }
  if (!profile) {
    return null;
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
