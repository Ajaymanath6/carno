"use client";

import type { KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowsOut, PlayCircle, X } from "@phosphor-icons/react";
import { WhyCarnivoresArticle } from "@/components/content/WhyCarnivoresArticle";
import { NarrativeHealingArticle } from "@/components/healing/NarrativeHealingArticle";
import { LearningsInquiryComposer } from "@/components/learnings/LearningsInquiryComposer";
import { LEARNINGS_ALL_CHIPS } from "@/config/learnings-topics";
import type { LearningTopic } from "@/config/learnings-topics";
import { HEALING_PLANTS_ARTICLE } from "@/config/healing-plants-defense";
import { LEARNINGS_CARNIVORE_MISTAKES_ARTICLE } from "@/config/learnings-carnivore-mistakes";
import { LEARNINGS_HORMONES_ARTICLE } from "@/config/learnings-hormones";
import { LEARNINGS_CHOLESTEROL_ARTICLE } from "@/config/learnings-cholesterol";
import { DayDateBadge } from "@/components/chat/ChatClient";
import { salutationForTimezone } from "@/lib/time-greeting";

const INQUIRY_PLACEHOLDER =
  "Ask about carnivore nutrition, fat, plants, cholesterol…";
const LEARNINGS_VIDEO_URLS = ["https://www.youtube.com/watch?v=CkhT088b9x8"] as const;

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
  | "cholesterol"
  | null;

export function LearningsClient({ localDate, timezone, displayName }: Props) {
  const router = useRouter();
  const inquiryRef = useRef<HTMLTextAreaElement>(null);
  const [inquiryDraft, setInquiryDraft] = useState("");
  const [articleId, setArticleId] = useState<LearningsArticleId>(null);
  const [videoTitles, setVideoTitles] = useState<Record<string, string>>({});
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

  const salutation = salutationForTimezone(timezone);
  const sendDisabled = !inquiryDraft.trim();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        LEARNINGS_VIDEO_URLS.map(async (url) => {
          try {
            const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
            if (!res.ok) {
              return [url, "YouTube video"] as const;
            }
            const data = (await res.json()) as { title?: string };
            return [url, data.title?.trim() || "YouTube video"] as const;
          } catch {
            return [url, "YouTube video"] as const;
          }
        }),
      );
      if (!cancelled) {
        setVideoTitles(Object.fromEntries(entries));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeVideoId = activeVideoUrl ? youtubeVideoIdFromUrl(activeVideoUrl) : null;
  const activeVideoEmbedSrc =
    activeVideoId ? `https://www.youtube.com/embed/${activeVideoId}?autoplay=1&rel=0` : null;

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
    if (topic.id === "cholesterol") {
      setArticleId("cholesterol");
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
    if (articleId === "cholesterol") {
      return (
        <NarrativeHealingArticle onBack={closeArticle} content={LEARNINGS_CHOLESTEROL_ARTICLE} />
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
            <div className="mt-5 w-full max-w-2xl rounded-2xl border border-brandcolor-strokeweak bg-brandcolor-white p-3">
              <p className="px-1 pb-2 text-left text-sm font-semibold text-brandcolor-text-strong">
                Videos
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {LEARNINGS_VIDEO_URLS.map((url) => {
                  const videoId = youtubeVideoIdFromUrl(url);
                  const title = videoTitles[url] || "YouTube video";
                  const thumbnailSrc =
                    videoId != null ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "";
                  return (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setActiveVideoUrl(url)}
                      className="group flex min-h-[4.75rem] items-center gap-3 rounded-xl border border-brandcolor-strokeweak bg-brandcolor-fill p-2 text-left hover:bg-brandcolor-white"
                    >
                      <span className="relative inline-flex h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-brandcolor-white">
                        {thumbnailSrc ? (
                          <Image
                            src={thumbnailSrc}
                            alt={title}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        ) : null}
                        <span className="absolute inset-0 flex items-center justify-center">
                          <PlayCircle
                            className="h-8 w-8 text-brandcolor-white drop-shadow"
                            weight="fill"
                            aria-hidden
                          />
                        </span>
                      </span>
                      <span className="line-clamp-2 text-sm font-medium text-brandcolor-text-strong">
                        {title}
                      </span>
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
      {activeVideoUrl && activeVideoEmbedSrc ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-brandcolor-text-strong/35 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-brandcolor-strokeweak bg-brandcolor-white shadow-xl">
            <div className="flex items-center justify-between border-b border-brandcolor-strokeweak px-4 py-3">
              <p className="line-clamp-1 text-sm font-semibold text-brandcolor-text-strong">
                {videoTitles[activeVideoUrl] || "YouTube video"}
              </p>
              <div className="flex items-center gap-2">
                <a
                  href={activeVideoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-brandcolor-strokeweak px-3 py-1.5 text-xs font-semibold text-brandcolor-text-strong hover:bg-brandcolor-fill"
                >
                  <ArrowsOut className="h-3.5 w-3.5" weight="bold" aria-hidden />
                  Expand
                </a>
                <button
                  type="button"
                  onClick={() => setActiveVideoUrl(null)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-brandcolor-strokeweak text-brandcolor-text-strong hover:bg-brandcolor-fill"
                  aria-label="Close video"
                >
                  <X className="h-4 w-4" weight="bold" aria-hidden />
                </button>
              </div>
            </div>
            <div className="aspect-video w-full">
              <iframe
                title={videoTitles[activeVideoUrl] || "YouTube video"}
                src={activeVideoEmbedSrc}
                className="h-full w-full rounded-b-2xl"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function youtubeVideoIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace(/^\/+/, "").trim();
      return id || null;
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v")?.trim() || "";
      return id || null;
    }
    return null;
  } catch {
    return null;
  }
}
