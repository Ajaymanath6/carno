"use client";

import Image from "next/image";
import { CARNO_LOGO_AGENT } from "@/lib/brand";

export type NarrativeHealingContent = {
  userBubble: string;
  pageTitle: string;
  leadBubble: string;
  sections: ReadonlyArray<{
    title: string;
    bullets: ReadonlyArray<string>;
  }>;
};

type Props = {
  onBack: () => void;
  content: NarrativeHealingContent;
};

export function NarrativeHealingArticle({ onBack, content }: Props) {
  const { userBubble, pageTitle, leadBubble, sections } = content;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
          <div>
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-brandcolor-primary hover:underline"
            >
              ← Back
            </button>
            <h1 className="mt-2 font-serif text-xl font-semibold text-brandcolor-text-strong">
              {pageTitle}
            </h1>
          </div>

          <ul className="flex flex-col gap-3">
            <li className="flex justify-end">
              <div className="max-w-[min(85%,calc(100%-2.75rem))] rounded-2xl bg-brandcolor-white px-4 py-2 text-sm text-brandcolor-text-strong">
                {userBubble}
              </div>
            </li>

            <li className="flex items-end justify-start gap-2">
              <div className="relative shrink-0 rounded-full bg-brandcolor-fill p-0.5 shadow-sm">
                <Image
                  src={CARNO_LOGO_AGENT}
                  alt="Carno"
                  width={32}
                  height={32}
                  unoptimized
                  className="h-8 w-8 rounded-full object-contain"
                />
              </div>
              <div className="max-w-[min(85%,calc(100%-2.75rem))] rounded-2xl border border-brandcolor-strokeweak bg-brandcolor-white px-4 py-2 text-sm leading-relaxed text-brandcolor-text-strong">
                {leadBubble}
              </div>
            </li>

            {sections.map((section) => (
              <li key={section.title} className="flex items-end justify-start gap-2">
                <div className="relative shrink-0 rounded-full bg-brandcolor-fill p-0.5 shadow-sm">
                  <Image
                    src={CARNO_LOGO_AGENT}
                    alt="Carno"
                    width={32}
                    height={32}
                    unoptimized
                    className="h-8 w-8 rounded-full object-contain"
                  />
                </div>
                <div className="max-w-[min(85%,calc(100%-2.75rem))] rounded-2xl border border-brandcolor-strokeweak bg-brandcolor-white px-4 py-2 text-sm leading-relaxed text-brandcolor-text-strong">
                  <h2 className="mb-1 text-sm font-semibold">{section.title}</h2>
                  <ul className="list-disc space-y-1.5 pl-5 text-brandcolor-text-weak marker:text-brandcolor-primary">
                    {section.bullets.map((line, i) => (
                      <li key={`${section.title}-${i}`}>{line}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
