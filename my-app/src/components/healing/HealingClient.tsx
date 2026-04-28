"use client";

import Link from "next/link";
import type { KeyboardEvent } from "react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LearningsInquiryComposer } from "@/components/learnings/LearningsInquiryComposer";
import { NarrativeHealingArticle } from "@/components/healing/NarrativeHealingArticle";
import { DayDateBadge } from "@/components/chat/ChatClient";
import { salutationForTimezone } from "@/lib/time-greeting";
import { HEALING_PCOS_ARTICLE } from "@/config/healing-pcos";
import {
  HEALING_CONDITION_BADGES,
  HEALING_CONDITION_STUBS,
  type HealingConditionId,
} from "@/config/healing-conditions";

const INQUIRY_PLACEHOLDER =
  "Ask about carnivore nutrition, fat, plants, cholesterol…";

type Props = {
  localDate: string;
  timezone: string;
  displayName: string;
};

export function HealingClient({ localDate, timezone, displayName }: Props) {
  const router = useRouter();
  const inquiryRef = useRef<HTMLTextAreaElement>(null);
  const [inquiryDraft, setInquiryDraft] = useState("");
  const [articleId, setArticleId] = useState<HealingConditionId | null>(null);

  const salutation = salutationForTimezone(timezone);
  const sendDisabled = !inquiryDraft.trim();

  function onInquiryKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!sendDisabled) {
        goToChatWithDraft();
      }
    }
  }

  function goToChatWithDraft() {
    const text = inquiryDraft.trim();
    if (!text) {
      return;
    }
    router.push(`/chat?q=${encodeURIComponent(text)}`);
  }

  function closeArticle() {
    setArticleId(null);
  }

  function renderArticle(id: HealingConditionId) {
    switch (id) {
      case "pcos":
        return <NarrativeHealingArticle onBack={closeArticle} content={HEALING_PCOS_ARTICLE} />;
      case "diabetes":
      case "fibromyalgia":
      case "migraines":
      case "hypertension":
      case "autoimmune":
      case "arthritis":
        return (
          <NarrativeHealingArticle
            onBack={closeArticle}
            content={HEALING_CONDITION_STUBS[id]}
          />
        );
      default: {
        const _exhaustive: never = id;
        return _exhaustive;
      }
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-brandcolor-fill">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {articleId ? (
          renderArticle(articleId)
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-8">
            <div className="mx-auto w-full max-w-3xl">
              <Link href="/chat" className="text-sm text-brandcolor-primary hover:underline">
                ← Back
              </Link>
              <div className="mt-6 flex flex-col items-center gap-4 text-center">
                <DayDateBadge localDate={localDate} timezone={timezone} />
                <h2 className="font-serif text-2xl font-semibold text-brandcolor-text-strong md:text-3xl">
                  {salutation}, {displayName}
                </h2>
                <p className="max-w-md text-sm leading-relaxed text-brandcolor-text-weak">
                  Healing through carnivore is about steady fuel, lower inflammatory noise, and
                  stories that match what your body reports back. Explore conditions below or ask
                  anything in the bar.
                </p>
              </div>

              <div className="mt-10 w-full">
                <h3 className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-brandcolor-text-weak">
                  Conditions people revisit
                </h3>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-x-3 md:gap-y-4">
                  {HEALING_CONDITION_BADGES.map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      aria-label={label}
                      onClick={() => setArticleId(id)}
                      className="rounded-full border border-brandcolor-primary/35 bg-brandcolor-white px-3 py-2.5 text-center text-[11px] font-semibold leading-snug text-brandcolor-primary shadow-sm transition-colors hover:bg-brandcolor-fill sm:text-xs"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        <LearningsInquiryComposer
          id="healing-inquiry"
          inquiryRef={inquiryRef}
          value={inquiryDraft}
          onChange={setInquiryDraft}
          onKeyDown={onInquiryKeyDown}
          onSend={goToChatWithDraft}
          sendDisabled={sendDisabled}
          placeholder={INQUIRY_PLACEHOLDER}
          srLabel="Ask about carnivore nutrition"
        />
      </div>
    </div>
  );
}
