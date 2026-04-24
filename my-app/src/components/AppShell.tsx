"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { SignOutButton } from "@clerk/nextjs";
import { List, Plus, Sidebar, SignOut, X } from "@phosphor-icons/react";
import { APP_NAV_ITEMS } from "@/config/app-nav";
import { CARNO_LOGO_AGENT } from "@/lib/brand";
import { NewDayChatDialog } from "@/components/NewDayChatDialog";

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
  const newChatDialogRef = useRef<HTMLDialogElement>(null);

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
          {sidebarExpanded ? (
            <div className="flex w-full items-center justify-between gap-2 px-2">
              <Link
                href="/chat"
                className="flex h-8 shrink-0 items-center justify-center rounded-lg bg-brandcolor-white p-0.5 transition-opacity hover:opacity-90"
                title="Carno — Chats"
              >
                <Image
                  src={CARNO_LOGO_AGENT}
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-md object-contain"
                  priority
                />
              </Link>
              <button
                type="button"
                onClick={() => setSidebarExpanded(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brandcolor-strokeweak text-brandcolor-stroke-strong hover:bg-brandcolor-fill"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <Sidebar className="-scale-x-100" size={20} weight="regular" aria-hidden />
              </button>
            </div>
          ) : (
            <div className="flex justify-center px-2">
              <button
                type="button"
                onClick={() => setSidebarExpanded(true)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-brandcolor-strokeweak text-brandcolor-stroke-strong hover:bg-brandcolor-fill"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <Sidebar size={20} weight="regular" aria-hidden />
              </button>
            </div>
          )}
          <nav className="mt-4 flex flex-1 flex-col gap-1 px-2">
            <button
              type="button"
              onClick={() => newChatDialogRef.current?.showModal()}
              className={`group flex items-center rounded-xl py-2.5 text-brandcolor-stroke-strong transition-colors ${
                sidebarExpanded ? "gap-2 px-2" : "justify-center px-0"
              }`}
              title="New chat for today — keep or clear today’s log"
              aria-label="New chat options for today"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors group-hover:bg-brandcolor-white">
                <Plus size={22} weight="bold" aria-hidden />
              </span>
              {sidebarExpanded ? (
                <span className="truncate text-sm font-medium text-brandcolor-text-strong">
                  New chat
                </span>
              ) : null}
            </button>
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
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-3 py-2">
            <Link
              href="/chat"
              className="shrink-0 rounded-lg bg-brandcolor-white p-0.5"
              title="Carno — Chats"
            >
              <Image
                src={CARNO_LOGO_AGENT}
                alt="Carno"
                width={32}
                height={32}
                className="h-8 w-8 shrink-0 rounded-md object-contain"
              />
            </Link>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-brandcolor-stroke-strong hover:bg-brandcolor-white"
                aria-expanded={drawerOpen}
                aria-controls={drawerId}
                aria-label={drawerOpen ? "Close menu" : "Open menu"}
                onClick={() => setDrawerOpen((v) => !v)}
              >
                {drawerOpen ? (
                  <X size={22} weight="regular" />
                ) : (
                  <List size={22} weight="regular" />
                )}
              </button>
              <SignOutButton redirectUrl="/login">
                <button
                  type="button"
                  className="shrink-0 rounded-full border border-brandcolor-strokeweak px-3 py-1.5 text-sm text-brandcolor-text-strong hover:bg-brandcolor-white"
                >
                  Sign out
                </button>
              </SignOutButton>
            </div>
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
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  queueMicrotask(() => newChatDialogRef.current?.showModal());
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-base font-medium text-brandcolor-text-strong hover:bg-brandcolor-fill"
              >
                <Plus
                  className="shrink-0 text-brandcolor-stroke-strong"
                  size={22}
                  weight="bold"
                  aria-hidden
                />
                New chat for today
              </button>
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
      <NewDayChatDialog dialogRef={newChatDialogRef} />
    </div>
  );
}
