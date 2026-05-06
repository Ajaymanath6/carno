"use client";

import { SignIn } from "@clerk/nextjs";
import { Info, X } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { LoginFaqItem } from "@/components/login/LoginFaqAccordion";
import { LoginFaqAccordion } from "@/components/login/LoginFaqAccordion";
import {
  LoginAuthContext,
  tryClickClerkGoogle,
  useLoginAuth,
  type LoginAuthOpenOpts,
} from "@/components/login/login-auth-context";
import { LoginLandingFooter } from "@/components/login/LoginLandingFooter";
import { LoginBenefits, LoginLandingHeader } from "@/components/login/LoginLandingHeader";
import { LoginPricingCards } from "@/components/login/LoginPricingCards";
import { LOGIN_HERO_HOW_IT_WORKS, LOGIN_HERO_LOG_LEARN } from "@/lib/brand";

function LoginHeroCTAs() {
  const { openAuth } = useLoginAuth();
  const btnClass =
    "inline-flex min-h-12 items-center justify-center rounded-full px-6 py-3 font-sans text-[24px] font-semibold leading-snug";
  return (
    <div className="mt-6 flex w-full flex-col items-start gap-3 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={() => openAuth({ tryGoogle: true })}
        className={`${btnClass} bg-brandcolor-primary text-brandcolor-white hover:bg-brandcolor-primary-hover`}
      >
        Sign in
      </button>
      <Link
        href="/register"
        className={`${btnClass} border border-brandcolor-strokeweak bg-brandcolor-white text-brandcolor-text-strong hover:bg-brandcolor-fill`}
      >
        Create account
      </Link>
    </div>
  );
}

type Props = {
  faqs: LoginFaqItem[];
};

export function LoginLandingShell({ faqs }: Props) {
  const [authVisible, setAuthVisible] = useState(false);

  const closeAuth = useCallback(() => {
    setAuthVisible(false);
    if (typeof window !== "undefined" && window.location.hash === "#access") {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
  }, []);

  const openAuth = useCallback((opts?: LoginAuthOpenOpts) => {
    setAuthVisible(true);
    queueMicrotask(() => {
      if (opts?.tryGoogle) {
        for (const ms of [450, 900, 1500]) {
          window.setTimeout(() => {
            const el = document.getElementById("access");
            if (el) tryClickClerkGoogle(el);
          }, ms);
        }
      }
    });
  }, []);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith("/login/") && path !== "/login") {
      setAuthVisible(true);
      return;
    }
    if (window.location.hash === "#access") {
      setAuthVisible(true);
    }
  }, []);

  useEffect(() => {
    const scrollToSection = () => {
      const { hash } = window.location;
      if (hash !== "#pricing" && hash !== "#faq") return;
      window.requestAnimationFrame(() => {
        document.querySelector(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    };
    scrollToSection();
    window.addEventListener("hashchange", scrollToSection);
    return () => window.removeEventListener("hashchange", scrollToSection);
  }, []);

  useEffect(() => {
    if (!authVisible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [authVisible]);

  useEffect(() => {
    if (!authVisible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAuth();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [authVisible, closeAuth]);

  return (
    <LoginAuthContext.Provider value={{ openAuth, closeAuth }}>
      <main className="scroll-smooth flex min-h-0 flex-1 flex-col overflow-x-clip overflow-y-auto bg-brandcolor-fill">
        <LoginLandingHeader />

        <div className="relative mx-auto grid w-full max-w-5xl grid-cols-1 gap-8 px-4 pb-10 pt-24 lg:gap-10 lg:pb-16 lg:pt-28">
          <section className="flex min-w-0 flex-col justify-start">
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:gap-10">
              <div className="min-w-0 text-left">
                <h1 className="text-left font-serif text-[clamp(1.5rem,5vw,4rem)] font-semibold leading-tight tracking-tight text-brandcolor-text-strong">
                  A calmer way to learn what food does to you.
                </h1>
                <p className="mt-4 text-left font-sans text-[24px] leading-relaxed text-brandcolor-text-weak">
                  Log meals and reactions in seconds—share clinician-ready summaries when you need them.
                  <br />
                  Quick logs first; richer detail only when it helps. Patterns by day or rolled up across days.
                  <br />
                  Your diary for clarity, not perfection—notes you own.
                </p>
                <LoginHeroCTAs />
                <p className="mt-3 text-left font-sans text-[24px] leading-relaxed text-brandcolor-text-weak">
                  No judgement. Just data you can use.
                </p>
              </div>
              <div className="flex justify-center lg:justify-end">
                <div className="w-full max-w-xl rounded-2xl bg-brandcolor-fill">
                  <Image
                    src={LOGIN_HERO_LOG_LEARN}
                    alt="Log: chat-style meals and drinks in your own words. Learn: simple insights and patterns."
                    width={1024}
                    height={898}
                    unoptimized
                    className="h-auto w-full rounded-2xl object-contain"
                    priority
                  />
                </div>
              </div>
            </div>

            <div className="mt-10">
              <h2 className="text-center font-serif text-[clamp(1.5rem,5vw,4rem)] font-semibold leading-tight tracking-tight text-brandcolor-text-strong">
                How the Carno app works
              </h2>
              <div className="relative left-1/2 mt-5 w-screen max-w-[100vw] -translate-x-1/2 px-4">
                <div className="mx-auto w-full max-w-[min(100%,1400px)] rounded-2xl bg-brandcolor-fill">
                  <Image
                    src={LOGIN_HERO_HOW_IT_WORKS}
                    alt="Three steps: what you eat and drink, your body sends signals, patterns over time"
                    width={1024}
                    height={749}
                    unoptimized
                    className="h-auto w-full rounded-2xl object-contain"
                  />
                </div>
              </div>
            </div>

            <LoginBenefits />

            <div className="mt-6 flex gap-3 rounded-2xl border border-brandcolor-strokeweak bg-brandcolor-white px-4 py-4 text-[24px] leading-relaxed text-brandcolor-text-weak">
              <span className="mt-1 shrink-0 text-brandcolor-stroke-strong" aria-hidden>
                <Info size={28} weight="regular" />
              </span>
              <span>
                Built for personal tracking. Not medical advice. You own your logs.
              </span>
            </div>
          </section>
        </div>

        {authVisible ?
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-brandcolor-text-strong/40 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sign-in-title"
            onClick={closeAuth}
          >
            <div
              id="access"
              className="relative max-h-[min(90vh,880px)] w-full max-w-md overflow-y-auto rounded-2xl border border-brandcolor-strokeweak bg-brandcolor-white p-6 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={closeAuth}
                className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full text-brandcolor-text-weak hover:bg-brandcolor-fill hover:text-brandcolor-text-strong"
                aria-label="Close sign in"
              >
                <X size={22} weight="bold" />
              </button>
              <h2
                id="sign-in-title"
                className="font-serif text-[clamp(1.5rem,5vw,4rem)] font-semibold leading-tight tracking-tight text-brandcolor-text-strong pr-10"
              >
                Welcome back
              </h2>
              <p className="mt-1 text-sm text-brandcolor-text-weak">
                Use your email to continue.
              </p>

              <div className="mt-6">
                <SignIn
                  routing="path"
                  path="/login"
                  signUpUrl="/register"
                  fallbackRedirectUrl="/chat"
                  signUpFallbackRedirectUrl="/chat"
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                    },
                  }}
                />
              </div>

              <p className="mt-4 text-xs leading-relaxed text-brandcolor-text-weak">
                By continuing, you agree to our{" "}
                <Link href="/terms" className="text-brandcolor-primary hover:underline">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-brandcolor-primary hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>
        : null}

        <div className="mx-auto w-full max-w-5xl px-4 pb-10 lg:pb-12">
          <LoginPricingCards />
        </div>

        <div className="mx-auto w-full max-w-5xl px-4 pb-16 lg:pb-20">
          <LoginFaqAccordion items={faqs} />
        </div>

        <LoginLandingFooter />
      </main>
    </LoginAuthContext.Provider>
  );
}
