"use client";

import { useLoginAuth } from "@/components/login/login-auth-context";

/**
 * Marketing pricing strip on the login landing page (`#pricing`).
 */
export function LoginPricingCards() {
  const { openAuth } = useLoginAuth();

  const cardClass =
    "flex flex-col rounded-2xl border-2 border-brandcolor-text-strong bg-brandcolor-primary p-6 text-brandcolor-white shadow-sm";
  const btnClass =
    "mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full border-2 border-brandcolor-white bg-brandcolor-white px-6 py-3 font-sans text-[20px] font-semibold leading-snug text-brandcolor-primary hover:bg-brandcolor-fill";

  return (
    <section
      id="pricing"
      className="scroll-mt-28 mt-14 w-full min-w-0"
      aria-label="Pricing cards"
    >
      <h2 className="text-center font-serif text-[clamp(1.5rem,5vw,4rem)] font-semibold leading-tight tracking-tight text-brandcolor-text-strong">
        Join thousands of subscribers
      </h2>
      <p className="mt-3 text-center font-sans text-[24px] leading-relaxed text-brandcolor-text-weak md:text-nowrap">
        Starting from thousands of people tracking meals and how they feel—numbers grow every week.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className={cardClass}>
          <h3 className="text-center font-serif text-2xl font-semibold text-brandcolor-white sm:text-3xl">
            Monthly plan
          </h3>
          <p className="mt-3 text-center font-sans text-lg leading-relaxed text-white/90">
            Flexible billing each month. Cancel anytime.
          </p>
          <button type="button" onClick={() => openAuth({ tryGoogle: true })} className={btnClass}>
            Get monthly
          </button>
        </div>

        <div className={cardClass}>
          <h3 className="text-center font-serif text-2xl font-semibold text-brandcolor-white sm:text-3xl">
            Annual plan
          </h3>
          <p className="mt-3 text-center font-sans text-lg leading-relaxed text-white/90 text-nowrap">
            Best value when you&apos;re ready to commit for the year.
          </p>
          <button type="button" onClick={() => openAuth({ tryGoogle: true })} className={btnClass}>
            Get annual
          </button>
        </div>
      </div>
    </section>
  );
}
