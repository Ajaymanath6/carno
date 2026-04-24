"use client";

import Link from "next/link";
import { SignOutButton } from "@clerk/nextjs";

export function AppNav() {
  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <nav className="flex flex-wrap items-center gap-3 text-sm font-medium">
          <Link className="text-[var(--color-primary)] hover:underline" href="/chat">
            Chat
          </Link>
          <Link className="hover:underline" href="/history">
            History
          </Link>
          <Link className="hover:underline" href="/reports">
            Reports
          </Link>
        </nav>
        <SignOutButton redirectUrl="/login">
          <button
            type="button"
            className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-[var(--color-muted)]"
          >
            Sign out
          </button>
        </SignOutButton>
      </div>
    </header>
  );
}
