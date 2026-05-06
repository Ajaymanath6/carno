"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChatCircleDots,
  ClipboardText,
  ClockCounterClockwise,
  Question,
  Tag,
  TrendUp,
} from "@phosphor-icons/react";
import { useLoginAuth } from "@/components/login/login-auth-context";
import { CARNO_LOGO_AGENT } from "@/lib/brand";

export function LoginLandingHeader() {
  const { openAuth } = useLoginAuth();

  return (
    <header className="fixed inset-x-0 top-4 z-50 px-4">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between rounded-full border border-brandcolor-strokeweak bg-brandcolor-white/90 px-3 py-2 shadow-sm backdrop-blur">
        <div className="flex items-center justify-start">
          <Link
            href="/login"
            className="inline-flex items-center gap-0 text-brandcolor-text-strong hover:opacity-90"
          >
            <Image
              src={CARNO_LOGO_AGENT}
              alt=""
              width={44}
              height={44}
              unoptimized
              className="h-11 w-11 shrink-0 rounded-md object-contain"
              priority
              aria-hidden
            />
            <span className="font-serif text-xl font-semibold leading-none tracking-tight">
              Carno
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <nav className="hidden items-center gap-2 sm:flex">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-brandcolor-text-weak hover:bg-brandcolor-fill hover:text-brandcolor-text-strong"
            >
              <Tag size={16} weight="regular" aria-hidden />
              Pricing
            </Link>
            <Link
              href="/faq"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-brandcolor-text-weak hover:bg-brandcolor-fill hover:text-brandcolor-text-strong"
            >
              <Question size={16} weight="regular" aria-hidden />
              FAQ
            </Link>
          </nav>
          <button
            type="button"
            onClick={() => openAuth({ tryGoogle: true })}
            className="inline-flex items-center gap-2 rounded-full bg-brandcolor-primary px-4 py-2 text-sm font-semibold text-brandcolor-white hover:bg-brandcolor-primary-hover"
          >
            Get access
            <ArrowRight size={16} weight="bold" aria-hidden />
          </button>
        </div>
      </div>
    </header>
  );
}

export function LoginBenefits() {
  return (
    <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {[
        { label: "Chat-style meal logging", Icon: ChatCircleDots },
        { label: "Reaction check-ins (energy, digestion, mood)", Icon: TrendUp },
        { label: "Daily summaries + multi-day clinical summary", Icon: ClipboardText },
        { label: "History by day", Icon: ClockCounterClockwise },
      ].map(({ label, Icon }) => (
        <li
          key={label}
          className="flex items-start gap-4 rounded-2xl border border-brandcolor-strokeweak bg-brandcolor-white px-4 py-4 text-[24px] leading-relaxed text-brandcolor-text-strong"
        >
          <span className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brandcolor-fill text-brandcolor-stroke-strong">
            <Icon size={28} weight="regular" aria-hidden />
          </span>
          <span>{label}</span>
        </li>
      ))}
    </ul>
  );
}

