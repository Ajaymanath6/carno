"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { SignOutButton } from "@clerk/nextjs";
import {
  ChatCircle,
  ChartBar,
  ClockCounterClockwise,
  List,
  X,
} from "@phosphor-icons/react";

function DrawerNavLink({
  href,
  label,
  icon: Icon,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: typeof ChatCircle;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const active =
    href === "/chat"
      ? pathname === "/chat"
      : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium ${
        active
          ? "bg-brandcolor-bone text-brandcolor-primary"
          : "text-brandcolor-text-strong hover:bg-brandcolor-fill"
      }`}
    >
      <Icon className="shrink-0" size={22} weight="regular" aria-hidden />
      {label}
    </Link>
  );
}

export function AppNav() {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <header className="border-b border-white/10 bg-brandcolor-nav-chrome text-brandcolor-nav-chrome-fg">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <button
            type="button"
            className="-ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-brandcolor-nav-chrome-fg hover:bg-white/10"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={26} weight="regular" /> : <List size={26} weight="regular" />}
          </button>
          <span className="min-w-0 flex-1 text-center font-serif text-base font-semibold tracking-tight text-brandcolor-nav-chrome-fg">
            Carno
          </span>
          <SignOutButton redirectUrl="/login">
            <button
              type="button"
              className="shrink-0 rounded-full border border-white/25 px-3 py-1.5 text-sm text-brandcolor-nav-chrome-fg hover:bg-white/10"
            >
              Sign out
            </button>
          </SignOutButton>
        </div>
      </header>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-brandcolor-marrow/45 backdrop-blur-[1px]"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div
            id={panelId}
            className="fixed inset-y-0 left-0 z-50 flex w-[min(18.5rem,88vw)] flex-col border-r border-brandcolor-strokeweak bg-brandcolor-surface py-4 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
          >
            <div className="flex items-center justify-between border-b border-brandcolor-strokeweak px-3 pb-3">
              <span className="font-serif text-lg font-semibold text-brandcolor-text-strong">
                Menu
              </span>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-brandcolor-text-strong hover:bg-brandcolor-fill"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <X size={22} weight="regular" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 pt-3">
              <DrawerNavLink
                href="/chat"
                label="Chat"
                icon={ChatCircle}
                onNavigate={() => setOpen(false)}
              />
              <DrawerNavLink
                href="/history"
                label="History"
                icon={ClockCounterClockwise}
                onNavigate={() => setOpen(false)}
              />
              <DrawerNavLink
                href="/reports"
                label="Reports"
                icon={ChartBar}
                onNavigate={() => setOpen(false)}
              />
            </nav>
          </div>
        </>
      )}
    </>
  );
}
