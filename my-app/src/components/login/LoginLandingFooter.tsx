"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { useLoginAuth } from "@/components/login/login-auth-context";
import { CARNO_LOGO_AGENT } from "@/lib/brand";

export function LoginLandingFooter() {
  const { openAuth } = useLoginAuth();

  return (
    <footer>
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-4 pb-10 pt-0">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-brandcolor-text-strong hover:opacity-90"
        >
          <Image
            src={CARNO_LOGO_AGENT}
            alt=""
            width={44}
            height={44}
            unoptimized
            className="h-11 w-11 shrink-0 rounded-md object-contain"
            aria-hidden
          />
          <span className="font-serif text-xl font-semibold leading-none tracking-tight">
            Carno
          </span>
        </Link>
        <button
          type="button"
          onClick={() => openAuth({ tryGoogle: true })}
          className="inline-flex items-center gap-2 rounded-full bg-brandcolor-primary px-5 py-2.5 text-sm font-semibold text-brandcolor-white hover:bg-brandcolor-primary-hover"
        >
          Get access
          <ArrowRight size={16} weight="bold" aria-hidden />
        </button>
      </div>
    </footer>
  );
}
