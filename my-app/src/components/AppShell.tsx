"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { SignOutButton } from "@clerk/nextjs";
import {
  CaretDoubleLeft,
  CaretDoubleRight,
  List,
  SignOut,
  X,
} from "@phosphor-icons/react";
import { APP_NAV_ITEMS } from "@/config/app-nav";
import { CARNO_LOGO_CREAM } from "@/lib/brand";

const SIDEBAR_EXPANDED_KEY = "carno-sidebar-expanded";

function isActivePath(pathname: string, href: string) {
  if (href === "/chat") {
    return pathname === "/chat";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function MobileDrawerLink({
  href,
  label,
  icon: Icon,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: (typeof APP_NAV_ITEMS)[number]["Icon"];
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const active = isActivePath(pathname, href);
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium ${
        active
          ? "border border-brandcolor-strokeweak bg-brandcolor-white text-brandcolor-primary"
          : "text-brandcolor-text-strong hover:bg-brandcolor-fill"
      }`}
    >
      <Icon
        className={`shrink-0 ${active ? "text-brandcolor-primary" : "text-brandcolor-stroke-strong"}`}
        size={22}
        weight="regular"
        aria-hidden
      />
      {label}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerId = useId();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(SIDEBAR_EXPANDED_KEY) === "1") {
        queueMicrotask(() => setSidebarExpanded(true));
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_EXPANDED_KEY, sidebarExpanded ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [sidebarExpanded]);

  useEffect(() => {
    if (!drawerOpen) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  return (
    <div className="flex min-h-0 flex-1 flex-col md:min-h-0 md:flex-row">
      <aside
        className={`relative z-30 hidden min-h-0 shrink-0 flex-col border-r border-brandcolor-strokeweak bg-brandcolor-fill text-brandcolor-text-strong transition-[width] duration-200 ease-out md:flex md:min-h-[100dvh] ${
          sidebarExpanded ? "w-52" : "w-16"
        }`}
        aria-label="Main navigation"
      >
        <div className="flex flex-1 flex-col pt-3">
          <Link
            href="/chat"
            className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-brandcolor-strokeweak bg-brandcolor-white p-1 hover:border-brandcolor-strokeweak"
            title="Carno — Chat"
          >
            <Image
              src={CARNO_LOGO_CREAM}
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
              priority
            />
          </Link>
          <nav className="mt-4 flex flex-1 flex-col gap-1 px-2">
            {APP_NAV_ITEMS.map(({ href, label, Icon }) => {
              const active = isActivePath(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  title={label}
                  className={`flex items-center rounded-xl py-2.5 text-sm font-medium hover:bg-brandcolor-white ${
                    sidebarExpanded ? "gap-3 px-3" : "justify-center px-0"
                  } ${active ? "text-brandcolor-primary" : "text-brandcolor-text-strong"}`}
                >
                  <Icon
                    className={`shrink-0 ${active ? "text-brandcolor-primary" : "text-brandcolor-stroke-strong"}`}
                    size={22}
                    weight="regular"
                    aria-hidden
                  />
                  {sidebarExpanded ? <span className="truncate">{label}</span> : null}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto border-t border-brandcolor-strokeweak p-2">
          <button
            type="button"
            onClick={() => setSidebarExpanded((v) => !v)}
            className="mb-2 flex w-full items-center justify-center rounded-lg py-2 text-brandcolor-stroke-strong hover:bg-brandcolor-white"
            title={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarExpanded ? (
              <CaretDoubleLeft size={22} weight="bold" aria-hidden />
            ) : (
              <CaretDoubleRight size={22} weight="bold" aria-hidden />
            )}
          </button>
          <SignOutButton redirectUrl="/login">
            <button
              type="button"
              className={`flex w-full items-center rounded-full border border-brandcolor-strokeweak py-2 text-sm text-brandcolor-text-strong hover:bg-brandcolor-white ${
                sidebarExpanded ? "justify-center gap-2 px-3" : "justify-center px-0"
              }`}
              title="Sign out"
            >
              {sidebarExpanded ? (
                "Sign out"
              ) : (
                <SignOut
                  className="text-brandcolor-stroke-strong"
                  size={22}
                  weight="regular"
                  aria-hidden
                />
              )}
            </button>
          </SignOutButton>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="shrink-0 border-b border-brandcolor-strokeweak bg-brandcolor-fill text-brandcolor-text-strong md:hidden">
          <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
            <button
              type="button"
              className="-ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-brandcolor-stroke-strong hover:bg-brandcolor-white"
              aria-expanded={drawerOpen}
              aria-controls={drawerId}
              aria-label={drawerOpen ? "Close menu" : "Open menu"}
              onClick={() => setDrawerOpen((v) => !v)}
            >
              {drawerOpen ? (
                <X size={26} weight="regular" />
              ) : (
                <List size={26} weight="regular" />
              )}
            </button>
            <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
              <Image
                src={CARNO_LOGO_CREAM}
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 shrink-0 rounded-md border border-brandcolor-strokeweak bg-brandcolor-white object-contain p-0.5"
              />
              <span className="font-serif text-base font-semibold tracking-tight text-brandcolor-text-strong">
                Carno
              </span>
            </div>
            <SignOutButton redirectUrl="/login">
              <button
                type="button"
                className="shrink-0 rounded-full border border-brandcolor-strokeweak px-3 py-1.5 text-sm text-brandcolor-text-strong hover:bg-brandcolor-white"
              >
                Sign out
              </button>
            </SignOutButton>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>

      {drawerOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-brandcolor-text-strong/40 backdrop-blur-[1px] md:hidden"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
          />
          <div
            id={drawerId}
            className="fixed inset-y-0 left-0 z-50 flex w-[min(18.5rem,88vw)] flex-col border-r border-brandcolor-strokeweak bg-brandcolor-white py-4 shadow-xl md:hidden"
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
                className="flex h-9 w-9 items-center justify-center rounded-lg text-brandcolor-stroke-strong hover:bg-brandcolor-fill"
                aria-label="Close menu"
                onClick={() => setDrawerOpen(false)}
              >
                <X size={22} weight="regular" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 pt-3">
              {APP_NAV_ITEMS.map((item) => (
                <MobileDrawerLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.Icon}
                  onNavigate={() => setDrawerOpen(false)}
                />
              ))}
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
