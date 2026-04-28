"use client";

import type { KeyboardEvent } from "react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { WhyCarnivoresArticle } from "@/components/content/WhyCarnivoresArticle";
import { NarrativeHealingArticle } from "@/components/healing/NarrativeHealingArticle";
import { LearningsInquiryComposer } from "@/components/learnings/LearningsInquiryComposer";
import { LEARNINGS_ALL_CHIPS } from "@/config/learnings-topics";
import type { LearningTopic } from "@/config/learnings-topics";
import { HEALING_PLANTS_ARTICLE } from "@/config/healing-plants-defense";
import { LEARNINGS_CARNIVORE_MISTAKES_ARTICLE } from "@/config/learnings-carnivore-mistakes";
import { LEARNINGS_HORMONES_ARTICLE } from "@/config/learnings-hormones";
import { DayDateBadge } from "@/components/chat/ChatClient";
import { salutationForTimezone } from "@/lib/time-greeting";

const INQUIRY_PLACEHOLDER =
  "Ask about carnivore nutrition, fat, plants, cholesterol…";

type Props = {
  localDate: string;
  timezone: string;
  displayName: string;
};

type LearningsArticleId =
  | "why-carnivores"
  | "plants"
  | "worst-hormones"
  | "carnivore-mistakes"
  | null;

export function LearningsClient({ localDate, timezone, displayName }: Props) {
  const router = useRouter();
  const inquiryRef = useRef<HTMLTextAreaElement>(null);
  const [inquiryDraft, setInquiryDraft] = useState("");
  const [articleId, setArticleId] = useState<LearningsArticleId>(null);

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

  function focusInquiryField() {
    inquiryRef.current?.focus();
  }

  function closeArticle() {
    setArticleId(null);
  }

  function onTopicClick(topic: LearningTopic) {
    if (topic.id === "why-carnivores") {
      setArticleId("why-carnivores");
      return;
    }
    if (topic.id === "plants") {
      setArticleId("plants");
      return;
    }
    if (topic.id === "worst-hormones") {
      setArticleId("worst-hormones");
      return;
    }
    if (topic.id === "carnivore-mistakes") {
      setArticleId("carnivore-mistakes");
      return;
    }
    setInquiryDraft(topic.question);
    queueMicrotask(focusInquiryField);
  }

  function renderArticle() {
    if (articleId === "why-carnivores") {
      return <WhyCarnivoresArticle onBack={closeArticle} />;
    }
    if (articleId === "plants") {
      return <NarrativeHealingArticle onBack={closeArticle} content={HEALING_PLANTS_ARTICLE} />;
    }
    if (articleId === "worst-hormones") {
      return (
        <NarrativeHealingArticle onBack={closeArticle} content={LEARNINGS_HORMONES_ARTICLE} />
      );
    }
    if (articleId === "carnivore-mistakes") {
      return (
        <NarrativeHealingArticle
          onBack={closeArticle}
          content={LEARNINGS_CARNIVORE_MISTAKES_ARTICLE}
        />
      );
    }
    return null;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-brandcolor-fill">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {articleId ? (
          renderArticle()
        ) : (
          <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-4 py-8">
            <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
              <DayDateBadge localDate={localDate} timezone={timezone} />
              <h2 className="font-serif text-2xl font-semibold text-brandcolor-text-strong md:text-3xl">
                {salutation}, {displayName}
              </h2>
              <p className="text-sm leading-relaxed text-brandcolor-text-weak">
                This space is for carnivore learning — solid principles, myths cleared up, and
                doubts answered so you can feel confident about how you eat. Tap a topic or ask your
                own question below.
              </p>
            </div>
            <div className="mt-6 w-full max-w-2xl">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-x-3 sm:gap-y-4">
                {LEARNINGS_ALL_CHIPS.map((topic) => {
                  const Icon = topic.Icon;
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      aria-label={topic.question}
                      title={topic.question}
                      onClick={() => onTopicClick(topic)}
                      className="group flex min-h-[5.25rem] flex-col items-center justify-start gap-1.5 rounded-lg border border-brandcolor-strokeweak bg-brandcolor-white px-2 py-2.5 text-center text-[11px] font-medium leading-snug text-brandcolor-text-strong transition-colors hover:border-brandcolor-strokeweak hover:bg-brandcolor-fill sm:min-h-[5.5rem] sm:text-xs"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brandcolor-white group-hover:bg-brandcolor-fill">
                        <Icon
                          className="text-brandcolor-stroke-strong"
                          size={28}
                          weight="regular"
                          aria-hidden
                        />
                      </span>
                      <span className="line-clamp-2 min-h-[2.5rem] w-full text-pretty">{topic.question}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        <LearningsInquiryComposer
          id="learnings-inquiry"
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
