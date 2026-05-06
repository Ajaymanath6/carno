"use client";

import { useMemo, useState } from "react";
import { CaretDown } from "@phosphor-icons/react";

export type LoginFaqItem = { q: string; a: string };

type Props = {
  items: LoginFaqItem[];
};

export function LoginFaqAccordion({ items }: Props) {
  const [openQ, setOpenQ] = useState<string | null>(null);

  const list = useMemo(() => items.filter((i) => i.q.trim()), [items]);
  if (list.length === 0) return null;

  return (
    <section id="faq" className="scroll-mt-28 mt-8 w-full min-w-0">
      <h2 className="text-center font-serif text-[clamp(1.5rem,5vw,4rem)] font-semibold leading-tight tracking-tight text-brandcolor-text-strong">
        Questions?
      </h2>
      <ul className="mt-3 flex w-full flex-col gap-3">
        {list.map((f) => {
          const open = openQ === f.q;
          return (
            <li
              key={f.q}
              className="w-full rounded-2xl border border-brandcolor-strokeweak bg-brandcolor-white"
            >
              <button
                type="button"
                className="relative flex w-full items-center gap-3 py-4 pl-4 pr-12 text-left"
                onClick={() => setOpenQ(open ? null : f.q)}
                aria-expanded={open}
              >
                <span className="min-w-0 flex-1 text-left text-[24px] font-semibold leading-snug text-brandcolor-text-strong">
                  {f.q}
                </span>
                <CaretDown
                  size={28}
                  weight="bold"
                  className={`absolute right-4 top-1/2 shrink-0 -translate-y-1/2 text-brandcolor-stroke-strong transition-transform ${open ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>
              {open ? (
                <div className="px-4 pb-4 pt-0">
                  <p className="text-left text-[24px] leading-relaxed text-brandcolor-text-weak">
                    {f.a}
                  </p>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

