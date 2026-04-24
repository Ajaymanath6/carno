"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { ChatCircle, ClockCounterClockwise, ChartBar } from "@phosphor-icons/react";

function NavLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: typeof ChatCircle;
}) {
  const pathname = usePathname();
  const active =
    href === "/chat"
      ? pathname === "/chat"
      : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      className={`inline-flex items-center gap-1.5 text-sm font-medium hover:underline ${
        active
          ? "text-brandcolor-primary"
          : "text-brandcolor-nav-chrome-fg hover:text-brandcolor-tallow"
      }`}
      href={href}
    >
      <Icon className="shrink-0" size={20} weight="regular" aria-hidden />
      {label}
    </Link>
  );
}

export function AppNav() {
  return (
    <header className="border-b border-white/10 bg-brandcolor-nav-chrome text-brandcolor-nav-chrome-fg">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <nav className="flex flex-wrap items-center gap-4">
          <NavLink href="/chat" label="Chat" icon={ChatCircle} />
          <NavLink href="/history" label="History" icon={ClockCounterClockwise} />
          <NavLink href="/reports" label="Reports" icon={ChartBar} />
        </nav>
        <SignOutButton redirectUrl="/login">
          <button
            type="button"
            className="rounded-full border border-white/25 px-3 py-1.5 text-sm text-brandcolor-nav-chrome-fg hover:bg-white/10"
          >
            Sign out
          </button>
        </SignOutButton>
      </div>
    </header>
  );
}
