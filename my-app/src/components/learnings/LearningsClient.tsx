"use client";

import type { KeyboardEvent } from "react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PaperPlaneRight } from "@phosphor-icons/react";
import { LEARNINGS_TOPICS } from "@/config/learnings-topics";
import { WhyCarnivoresChatView } from "@/components/learnings/WhyCarnivoresChatView";
import { DayDateBadge } from "@/components/chat/ChatClient";
import { salutationForTimezone } from "@/lib/time-greeting";

const INQUIRY_PLACEHOLDER =
  "Ask about carnivore nutrition, fat, plants, cholesterol…";

type Props = {
  localDate: string;
  timezone: string;
  displayName: string;
};

export function LearningsClient({ localDate, timezone, displayName }: Props) {
  const router = useRouter();
  const inquiryRef = useRef<HTMLTextAreaElement>(null);
  const [inquiryDraft, setInquiryDraft] = useState("");
  const [showWhyCarnivoresChat, setShowWhyCarnivoresChat] = useState(false);

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

  function onTopicClick(topic: (typeof LEARNINGS_TOPICS)[number]) {
    if (topic.id === "why-carnivores") {
      setShowWhyCarnivoresChat(true);
      return;
    }
    setInquiryDraft(topic.question);
    queueMicrotask(focusInquiryField);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-brandcolor-fill">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {showWhyCarnivoresChat ? (
          <WhyCarnivoresChatView onBack={() => setShowWhyCarnivoresChat(false)} />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-8">
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
            <div className="mt-5 flex w-full max-w-md flex-col items-center gap-2">
              <div className="flex w-full flex-wrap justify-center gap-2">
                {LEARNINGS_TOPICS.slice(0, 3).map((topic) => {
                  const Icon = topic.Icon;
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      aria-label={topic.question}
                      title={topic.question}
                      onClick={() => onTopicClick(topic)}
                      className="group flex min-w-[5.5rem] flex-row items-center gap-1 rounded-lg border border-brandcolor-strokeweak bg-brandcolor-white px-2 py-1.5 text-left text-[11px] font-medium leading-tight text-brandcolor-text-strong transition-colors hover:border-brandcolor-strokeweak hover:bg-brandcolor-fill sm:min-w-0 sm:text-xs"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brandcolor-white group-hover:bg-brandcolor-fill">
                        <Icon
                          className="text-brandcolor-stroke-strong"
                          size={28}
                          weight="regular"
                          aria-hidden
                        />
                      </span>
                      <span className="min-w-0 truncate">{topic.question}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex w-full flex-wrap justify-center gap-2">
                {LEARNINGS_TOPICS.slice(3).map((topic) => {
                  const Icon = topic.Icon;
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      aria-label={topic.question}
                      title={topic.question}
                      onClick={() => onTopicClick(topic)}
                      className="group flex min-w-[5.5rem] flex-row items-center gap-1 rounded-lg border border-brandcolor-strokeweak bg-brandcolor-white px-2 py-1.5 text-left text-[11px] font-medium leading-tight text-brandcolor-text-strong transition-colors hover:border-brandcolor-strokeweak hover:bg-brandcolor-fill sm:min-w-0 sm:text-xs"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brandcolor-white group-hover:bg-brandcolor-fill">
                        <Icon
                          className="text-brandcolor-stroke-strong"
                          size={28}
                          weight="regular"
                          aria-hidden
                        />
                      </span>
                      <span className="min-w-0 truncate">{topic.question}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        <div className="flex shrink-0 justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <div className="pointer-events-auto w-full max-w-md">
            <div className="mx-auto w-full max-w-md">
              <label className="sr-only" htmlFor="learnings-inquiry">
                Ask about carnivore nutrition
              </label>
              <div className="flex min-h-[3rem] w-full items-end rounded-2xl border border-transparent bg-brandcolor-white pl-1 shadow-lg ring-1 ring-brandcolor-strokeweak/60 transition-colors hover:border-brandcolor-strokeweak focus-within:border-brandcolor-stroke-strong">
                <textarea
                  ref={inquiryRef}
                  id="learnings-inquiry"
                  rows={2}
                  value={inquiryDraft}
                  onChange={(e) => setInquiryDraft(e.target.value)}
                  onKeyDown={onInquiryKeyDown}
                  placeholder={INQUIRY_PLACEHOLDER}
                  className="min-h-[2.75rem] min-w-0 flex-1 resize-none border-0 bg-transparent py-3 pl-3 pr-2 text-base text-brandcolor-text-strong outline-none focus:ring-0"
                />
                <button
                  type="button"
                  disabled={sendDisabled}
                  aria-label="Send question to chat"
                  onClick={goToChatWithDraft}
                  className="mb-1.5 mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brandcolor-primary text-brandcolor-white hover:bg-brandcolor-primary-hover disabled:pointer-events-none disabled:opacity-50"
                >
                  <PaperPlaneRight className="-translate-x-px" size={22} weight="bold" aria-hidden />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
