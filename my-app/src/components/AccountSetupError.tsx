"use client";

import { SignOutButton } from "@clerk/nextjs";

/**
 * Shown when Clerk has an active session but {@link getOrCreateAppUser} cannot
 * create or load the Prisma user (avoids redirecting to `/login`, which would
 * immediately send the user back to `/chat`).
 */
export function AccountSetupError() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-brandcolor-fill px-4 py-16 text-center">
      <div className="flex max-w-md flex-col gap-2">
        <p className="font-serif text-lg font-medium text-brandcolor-text-strong">
          We couldn&apos;t finish setting up your account
        </p>
        <p className="text-sm text-brandcolor-text-weak">
          Your session is active, but the app couldn&apos;t sync your profile.
          Confirm your Clerk user has an email address and your database URL is
          configured (e.g. on Vercel). You can sign out and try again.
        </p>
      </div>
      <SignOutButton redirectUrl="/login">
        <button
          type="button"
          className="rounded-full bg-brandcolor-primary px-5 py-2 text-sm font-medium text-brandcolor-white hover:bg-brandcolor-primary-hover"
        >
          Sign out
        </button>
      </SignOutButton>
    </main>
  );
}
