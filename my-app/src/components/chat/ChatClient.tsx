"use client";

import Image from "next/image";
import type { KeyboardEvent } from "react";
import { useActionState, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import type { ChatMessage, ConversationPhase, Prisma } from "@prisma/client";
import { Article, CaretDown, CircleNotch, PaperPlaneRight } from "@phosphor-icons/react";
import {
  generateDailySummary,
  pollDueFollowUps,
  previewDailySummary,
  sendMealMessage,
  submitReaction,
  type ActionState,
} from "@/app/actions/chat";
import {
  EOD_PANEL_START_HOUR,
  formatWeekdayMonthDayForLocalDateKey,
  getLocalHourInTimeZone,
  weekdayLongForLocalDateKey,
} from "@/lib/date";
import {
  CARNO_LOGO_AGENT,
  MEAL_QUICK_BROWN_EGGS,
  MEAL_QUICK_CHICKEN,
  MEAL_QUICK_MUTTON,
  MEAL_QUICK_PANEER,
  MEAL_QUICK_RED_MEAT,
} from "@/lib/brand";
import {
  REACTION_SLIDER_FIELDS,
  ReactionMetricsTableRows,
} from "@/components/reaction-metrics";
import type { ReactionSnapshot } from "@/lib/reaction-summary";

const MEAL_FORM_ID = "carno-meal-form";

const MEAL_QUICK_PICKS = [
  { label: "Chicken", value: "Chicken", imageSrc: MEAL_QUICK_CHICKEN },
  { label: "Mutton", value: "Mutton", imageSrc: MEAL_QUICK_MUTTON },
  { label: "Paneer", value: "Paneer", imageSrc: MEAL_QUICK_PANEER },
  { label: "BEEF", value: "BEEF", imageSrc: MEAL_QUICK_RED_MEAT },
  { label: "Brown eggs", value: "Brown eggs", imageSrc: MEAL_QUICK_BROWN_EGGS },
] as const;

type Props = {
  messages: Pick<ChatMessage, "id" | "role" | "body" | "createdAt" | "metadata">[];
  sessionId: string;
  phase: ConversationPhase;
  sessionStatus: "ACTIVE" | "CLOSED";
  pendingFoodEntryId: string | null;
  timezone: string;
  displayName: string;
  localDate: string;
};

const initialActionState: ActionState = {};

function salutationForHour(timezone: string): string {
  const h = getLocalHourInTimeZone(timezone);
  if (h < 12) {
    return "Good morning";
  }
  if (h < 17) {
    return "Good afternoon";
  }
  return "Good evening";
}

export function ChatClient({
  messages,
  sessionId,
  phase,
  sessionStatus,
  pendingFoodEntryId,
  timezone,
  displayName,
  localDate,
}: Props) {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const mealFormRef = useRef<HTMLFormElement>(null);
  const [mealDraft, setMealDraft] = useState("");
  const [showEodPanel, setShowEodPanel] = useState(
    () => getLocalHourInTimeZone(timezone) >= EOD_PANEL_START_HOUR,
  );

  const [mealState, mealAction, mealPending] = useActionState(
    sendMealMessage,
    initialActionState,
  );
  const [reactionState, reactionAction, reactionPending] = useActionState(
    submitReaction,
    initialActionState,
  );
  const [summaryState, summaryAction, summaryPending] = useActionState(
    generateDailySummary,
    initialActionState,
  );
  const [previewState, previewAction, previewPending] = useActionState(
    previewDailySummary,
    initialActionState,
  );

  const agentBusy = mealPending || reactionPending || summaryPending || previewPending;
  const mealSendDisabled = mealPending || !mealDraft.trim();
  const hasUserMessage = messages.some((m) => m.role === "USER");
  const canLogMeals = sessionStatus === "ACTIVE" && phase === "CHAT";
  const showOnboarding = canLogMeals && !hasUserMessage;
  const salutation = salutationForHour(timezone);

  useEffect(() => {
    function tick() {
      setShowEodPanel(getLocalHourInTimeZone(timezone) >= EOD_PANEL_START_HOUR);
    }
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [timezone]);

  useEffect(() => {
    if (mealState.ok) {
      queueMicrotask(() => setMealDraft(""));
    }
  }, [mealState.ok]);

  useEffect(() => {
    if (previewState.ok) {
      router.refresh();
    }
  }, [previewState.ok, router]);

  /** Follow-ups are written server-side when due; without polling nothing appears until refresh. */
  useEffect(() => {
    if (sessionStatus !== "ACTIVE" || phase !== "CHAT") {
      return;
    }
    const POLL_MS = 8000;
    const run = () => {
      void pollDueFollowUps(sessionId).then(() => router.refresh());
    };
    const intervalId = setInterval(run, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        run();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [sessionId, phase, sessionStatus, router]);

  const showReaction =
    sessionStatus === "ACTIVE" &&
    phase === "ASK_REACTION" &&
    !!pendingFoodEntryId;

  const showSummaryBadge =
    sessionStatus === "ACTIVE" &&
    phase === "CHAT" &&
    !showReaction &&
    hasUserMessage;

  useEffect(() => {
    if (hasUserMessage || showReaction) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, phase, mealState.ok, reactionState.ok, hasUserMessage, showReaction]);

  /** Fixed bottom dock so the thread can scroll underneath (hidden when EOD panel needs the stack). */
  const floatingMealDock =
    canLogMeals &&
    !showReaction &&
    !showEodPanel &&
    (showOnboarding || hasUserMessage);
  const inlineTranscriptMealWithEod =
    canLogMeals && hasUserMessage && !showReaction && showEodPanel;

  function onMealKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (mealSendDisabled) {
        return;
      }
      mealFormRef.current?.requestSubmit();
    }
  }

  function submitQuickPick(value: string) {
    if (mealPending) {
      return;
    }
    flushSync(() => setMealDraft(value));
    mealFormRef.current?.requestSubmit();
  }

  const mealComposer = (
    maxWidthClass: string,
    options?: { elevated?: boolean },
  ) => (
    <div className={`mx-auto w-full ${maxWidthClass}`}>
      {showSummaryBadge ? (
        <form action={previewAction} className="mb-2 flex justify-start">
          <input type="hidden" name="sessionId" value={sessionId} />
          <button
            type="submit"
            disabled={previewPending || mealPending || reactionPending}
            className="inline-flex items-center gap-1.5 rounded-full border border-brandcolor-strokeweak bg-brandcolor-white px-3 py-1.5 text-xs font-semibold tracking-wide text-brandcolor-text-strong shadow-sm hover:bg-brandcolor-fill disabled:opacity-60"
          >
            {previewPending ? (
              <CircleNotch className="h-3.5 w-3.5 animate-spin" weight="bold" aria-hidden />
            ) : (
              <Article className="h-3.5 w-3.5 text-brandcolor-stroke-strong" weight="regular" aria-hidden />
            )}
            Summary
          </button>
        </form>
      ) : null}
      <form id={MEAL_FORM_ID} ref={mealFormRef} action={mealAction} className="flex w-full">
        <label className="sr-only" htmlFor="meal-message">
          What did you eat?
        </label>
        <div
          className={`flex min-h-[3rem] w-full items-end rounded-2xl border border-transparent bg-brandcolor-white pl-1 transition-colors hover:border-brandcolor-strokeweak focus-within:border-brandcolor-stroke-strong ${
            options?.elevated ? "shadow-lg ring-1 ring-brandcolor-strokeweak/60" : ""
          }`}
        >
          <textarea
            id="meal-message"
            name="message"
            rows={2}
            value={mealDraft}
            onChange={(e) => setMealDraft(e.target.value)}
            onKeyDown={onMealKeyDown}
            placeholder="Log a meal — e.g. 500g chicken"
            className="min-h-[2.75rem] min-w-0 flex-1 resize-none border-0 bg-transparent py-3 pl-3 pr-2 text-base text-brandcolor-text-strong outline-none focus:ring-0"
          />
          <button
            type="submit"
            disabled={mealSendDisabled}
            aria-label={mealPending ? "Sending…" : "Send meal"}
            className="mb-1.5 mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brandcolor-primary text-brandcolor-white hover:bg-brandcolor-primary-hover disabled:pointer-events-none disabled:opacity-50"
          >
            {mealPending ? (
              <CircleNotch className="animate-spin" size={22} weight="bold" aria-hidden />
            ) : (
              <PaperPlaneRight className="-translate-x-px" size={22} weight="bold" aria-hidden />
            )}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-brandcolor-fill">
      {!showOnboarding && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="sticky top-0 z-10 flex justify-center bg-brandcolor-fill/90 px-4 py-2 backdrop-blur-sm">
              <DayDateBadge localDate={localDate} timezone={timezone} />
            </div>
            <ul className="mx-auto flex max-w-3xl flex-col gap-3 px-4 pb-4 pt-1">
              {messages.map((m) => (
                <li
                  key={m.id}
                  className={`flex gap-2 ${m.role === "USER" ? "justify-end" : "items-end justify-start"}`}
                >
                  {m.role !== "USER" && (
                    <div
                      className={`relative shrink-0 rounded-full bg-brandcolor-fill p-0.5 shadow-sm ${
                        agentBusy ? "animate-carno-speak" : ""
                      }`}
                    >
                      <Image
                        src={CARNO_LOGO_AGENT}
                        alt="Carno"
                        width={32}
                        height={32}
                        unoptimized
                        className="h-8 w-8 rounded-full object-contain"
                      />
                    </div>
                  )}
                  <div
                    className={`max-w-[min(85%,calc(100%-2.75rem))] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                      m.role === "USER"
                        ? "bg-brandcolor-white text-brandcolor-text-strong"
                        : "border border-brandcolor-strokeweak bg-brandcolor-white text-brandcolor-text-strong"
                    }`}
                  >
                    <AssistantBubbleBody metadata={m.metadata} body={m.body} />
                  </div>
                </li>
              ))}
              {showReaction && pendingFoodEntryId ? (
                <li className="flex gap-2 items-start justify-start">
                  <div
                    className={`relative shrink-0 rounded-full bg-brandcolor-fill p-0.5 shadow-sm ${
                      reactionPending ? "animate-carno-speak" : ""
                    }`}
                  >
                    <Image
                      src={CARNO_LOGO_AGENT}
                      alt="Carno"
                      width={32}
                      height={32}
                      unoptimized
                      className="h-8 w-8 rounded-full object-contain"
                    />
                  </div>
                  <div className="max-w-[min(95%,calc(100%-2.75rem))] flex-1 rounded-2xl border border-brandcolor-strokeweak bg-brandcolor-white px-4 py-3 text-sm text-brandcolor-text-strong shadow-sm">
                    <SymptomCheckInForm
                      foodEntryId={pendingFoodEntryId}
                      formAction={reactionAction}
                      pending={reactionPending}
                    />
                  </div>
                </li>
              ) : null}
              <div ref={bottomRef} />
            </ul>
          </div>
          {floatingMealDock && (
            <div className="flex shrink-0 justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
              <div className="pointer-events-auto w-full max-w-3xl">
                {mealComposer("max-w-3xl", { elevated: true })}
              </div>
            </div>
          )}
        </div>
      )}

      {!showReaction && showOnboarding && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-8">
            <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
              <DayDateBadge localDate={localDate} timezone={timezone} />
              <h2 className="font-serif text-2xl font-semibold text-brandcolor-text-strong md:text-3xl">
                {salutation}, {displayName}
              </h2>
              <p className="text-sm leading-relaxed text-brandcolor-text-weak">
                Start logging your meals to build a clearer picture of what works for you. Tap a
                shortcut below or describe what you ate.
              </p>
            </div>
            {showEodPanel ? (
              <div className="mt-5 w-full max-w-md">{mealComposer("max-w-md")}</div>
            ) : null}
            <div className="mt-5 flex w-full max-w-md flex-col items-center gap-2">
              <div className="flex w-full flex-wrap justify-center gap-2">
                {MEAL_QUICK_PICKS.slice(0, 3).map(({ label, value, imageSrc }) => (
                  <button
                    key={value}
                    type="button"
                    disabled={mealPending}
                    onClick={() => submitQuickPick(value)}
                    className="group flex min-w-[5.5rem] flex-row items-center gap-1 rounded-lg border border-brandcolor-strokeweak bg-brandcolor-white px-2 py-1.5 text-left text-[11px] font-medium leading-tight text-brandcolor-text-strong transition-colors hover:border-brandcolor-strokeweak hover:bg-brandcolor-fill sm:min-w-0 sm:text-xs disabled:opacity-50"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brandcolor-white group-hover:bg-brandcolor-fill">
                      <Image
                        src={imageSrc}
                        alt=""
                        width={32}
                        height={32}
                        className="max-h-8 max-w-8 object-contain mix-blend-multiply"
                      />
                    </span>
                    <span className="min-w-0 truncate">{label}</span>
                  </button>
                ))}
              </div>
              <div className="flex w-full flex-wrap justify-center gap-2">
                {MEAL_QUICK_PICKS.slice(3).map(({ label, value, imageSrc }) => (
                  <button
                    key={value}
                    type="button"
                    disabled={mealPending}
                    onClick={() => submitQuickPick(value)}
                    className="group flex min-w-[5.5rem] flex-row items-center gap-1 rounded-lg border border-brandcolor-strokeweak bg-brandcolor-white px-2 py-1.5 text-left text-[11px] font-medium leading-tight text-brandcolor-text-strong transition-colors hover:border-brandcolor-strokeweak hover:bg-brandcolor-fill sm:min-w-0 sm:text-xs disabled:opacity-50"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brandcolor-white group-hover:bg-brandcolor-fill">
                      <Image
                        src={imageSrc}
                        alt=""
                        width={32}
                        height={32}
                        className="max-h-8 max-w-8 object-contain mix-blend-multiply"
                      />
                    </span>
                    <span className="min-w-0 truncate">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          {floatingMealDock && (
            <div className="flex shrink-0 justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
              <div className="w-full max-w-md">{mealComposer("max-w-md", { elevated: true })}</div>
            </div>
          )}
        </div>
      )}

      {sessionStatus === "CLOSED" && (
        <p className="mx-auto max-w-3xl px-4 pb-4 text-center text-sm text-brandcolor-text-weak">
          This day is closed. Open <strong>History</strong> to review or come back
          tomorrow for a new chat.
        </p>
      )}

      {mealState.error && (
        <p className="mx-auto max-w-3xl px-4 pb-2 text-center text-sm font-medium text-brandcolor-primary">
          {mealState.error}
        </p>
      )}
      {reactionState.error && (
        <p className="mx-auto max-w-3xl px-4 pb-2 text-center text-sm font-medium text-brandcolor-primary">
          {reactionState.error}
        </p>
      )}
      {summaryState.error && (
        <p className="mx-auto max-w-3xl px-4 pb-2 text-center text-sm font-medium text-brandcolor-primary">
          {summaryState.error}
        </p>
      )}
      {previewState.error && (
        <p className="mx-auto max-w-3xl px-4 pb-2 text-center text-sm font-medium text-brandcolor-primary">
          {previewState.error}
        </p>
      )}

      {sessionStatus === "ACTIVE" && !showReaction && showEodPanel && (
        <div className="border-t border-brandcolor-strokeweak bg-brandcolor-fill px-4 py-3">
          <form action={summaryAction} className="mx-auto max-w-3xl space-y-2">
            <input type="hidden" name="sessionId" value={sessionId} />
            <label className="block text-sm font-medium text-brandcolor-text-strong">
              End of day — how was your day overall?
              <textarea
                name="dayOverallSurvey"
                rows={2}
                className="mt-1 w-full rounded-xl border border-brandcolor-strokeweak bg-brandcolor-white px-3 py-2 text-sm text-brandcolor-text-strong"
                placeholder="Optional reflection before we save today’s summary"
              />
            </label>
            <button
              type="submit"
              disabled={summaryPending}
              className="rounded-full border border-brandcolor-strokeweak bg-brandcolor-white px-4 py-2 text-sm font-medium text-brandcolor-text-strong hover:bg-brandcolor-fill disabled:opacity-60"
            >
              {summaryPending ? "Saving summary…" : "Save daily summary & close day"}
            </button>
          </form>
          <p className="mx-auto mt-2 max-w-3xl text-xs text-brandcolor-text-weak">
            Time zone for reminders: {timezone}. After closing, tomorrow opens a fresh chat.
          </p>
        </div>
      )}

      {inlineTranscriptMealWithEod && (
        <div className="flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <div className="w-full max-w-3xl">{mealComposer("max-w-3xl")}</div>
        </div>
      )}

    </div>
  );
}

function mealThumbFromMetadata(metadata: Prisma.JsonValue | null): string | null {
  if (metadata == null || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }
  const thumb = (metadata as Record<string, unknown>).mealThumb;
  return typeof thumb === "string" ? thumb : null;
}

function SymptomCheckInForm({
  foodEntryId,
  formAction,
  pending,
}: {
  foodEntryId: string;
  formAction: (formData: FormData) => void;
  pending: boolean;
}) {
  return (
    <form action={formAction} className="space-y-3">
      <input name="foodEntryId" type="hidden" value={foodEntryId} />
      <p className="text-sm font-medium text-brandcolor-text-strong">
        Symptom check-in (1 = low / none, 5 = high)
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {REACTION_SLIDER_FIELDS.map(({ name, label, Icon }) => (
          <SliderRow key={name} name={name} label={label} Icon={Icon} />
        ))}
      </div>
      <label className="block text-sm">
        <span className="text-brandcolor-text-weak">Notes</span>
        <textarea
          name="notes"
          rows={2}
          className="mt-1 w-full rounded-xl border border-brandcolor-strokeweak bg-brandcolor-fill px-3 py-2 text-sm text-brandcolor-text-strong"
          placeholder="Optional details"
        />
      </label>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-brandcolor-text-strong">
          Did you eat the same meal yesterday?
        </legend>
        <div className="flex flex-wrap gap-2">
          <ReactionChip name="ateYesterdaySame" value="yes" label="Yes" />
          <ReactionChip name="ateYesterdaySame" value="no" label="No" />
        </div>
      </fieldset>
      <label className="block text-sm">
        <span className="text-brandcolor-text-weak">Did anything feel different vs usual?</span>
        <textarea
          name="feltDifferentNotes"
          rows={2}
          className="mt-1 w-full rounded-xl border border-brandcolor-strokeweak bg-brandcolor-fill px-3 py-2 text-sm text-brandcolor-text-strong"
        />
      </label>
      <label className="block text-sm">
        <span className="text-brandcolor-text-weak">Symptoms vs last time</span>
        <select
          name="symptomsBetterOrWorse"
          className="mt-1 w-full rounded-xl border border-brandcolor-strokeweak bg-brandcolor-fill px-3 py-2 text-sm text-brandcolor-text-strong"
          defaultValue=""
        >
          <option value="">Select…</option>
          <option value="better">Better</option>
          <option value="same">About the same</option>
          <option value="worse">Worse</option>
        </select>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="flex min-h-11 w-full items-center justify-center rounded-full bg-brandcolor-primary px-4 py-2 text-sm font-semibold text-brandcolor-white hover:bg-brandcolor-primary-hover disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save check-in"}
      </button>
    </form>
  );
}

function isDailyAiSummaryMetadata(
  metadata: Prisma.JsonValue | null,
): metadata is Prisma.JsonObject & {
  type: string;
  greeting: string;
  articleText: string;
  builtWithAi?: boolean;
} {
  if (metadata == null || typeof metadata !== "object" || Array.isArray(metadata)) {
    return false;
  }
  const m = metadata as Record<string, unknown>;
  return (
    m.type === "daily_ai_summary" &&
    typeof m.greeting === "string" &&
    typeof m.articleText === "string"
  );
}

function isDailyAiSummaryPreviewMetadata(
  metadata: Prisma.JsonValue | null,
): metadata is Prisma.JsonObject & {
  type: string;
  greeting: string;
  articleText: string;
  builtWithAi?: boolean;
} {
  if (metadata == null || typeof metadata !== "object" || Array.isArray(metadata)) {
    return false;
  }
  const m = metadata as Record<string, unknown>;
  return (
    m.type === "daily_ai_summary_preview" &&
    typeof m.greeting === "string" &&
    typeof m.articleText === "string"
  );
}

function DailyAiSummaryBubble({
  metadata,
  preview,
}: {
  metadata: Record<string, unknown>;
  preview?: boolean;
}) {
  const greeting = String(metadata.greeting ?? "");
  const article = String(metadata.articleText ?? "");
  const builtWithAi = metadata.builtWithAi === true;
  return (
    <div className="w-full min-w-0 space-y-2">
      <div className="rounded-xl bg-brandcolor-fill px-4 py-3 text-sm text-brandcolor-text-strong">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Article
            className="h-5 w-5 shrink-0 text-brandcolor-stroke-strong"
            weight="regular"
            aria-hidden
          />
          <span className="font-semibold">Summary</span>
          {preview ? (
            <span className="text-xs font-medium text-brandcolor-text-weak">
              Preview — day still open
            </span>
          ) : null}
          {builtWithAi ? (
            <span className="text-xs text-brandcolor-text-weak">Built with AI</span>
          ) : null}
        </div>
        <p className="font-medium text-brandcolor-text-strong">{greeting}</p>
        <p className="mt-2 whitespace-pre-wrap leading-relaxed">{article}</p>
      </div>
    </div>
  );
}

function isReactionSavedMetadata(
  metadata: Prisma.JsonValue | null,
): metadata is Prisma.JsonObject & {
  type: string;
  shortSummary: string;
  reaction: ReactionSnapshot;
} {
  if (metadata == null || typeof metadata !== "object" || Array.isArray(metadata)) {
    return false;
  }
  const m = metadata as Record<string, unknown>;
  return (
    m.type === "reaction_saved" &&
    typeof m.shortSummary === "string" &&
    m.reaction != null &&
    typeof m.reaction === "object" &&
    !Array.isArray(m.reaction)
  );
}

function ReactionSavedBubble({
  body,
  metadata,
}: {
  body: string;
  metadata: Record<string, unknown>;
}) {
  const [open, setOpen] = useState(false);
  const shortSummary = String(metadata.shortSummary ?? "");
  const reaction = metadata.reaction as ReactionSnapshot;
  const foodDisplay =
    typeof metadata.foodDisplay === "string" ? metadata.foodDisplay.trim() : "";
  const mealThumbSaved =
    typeof metadata.mealThumb === "string" ? metadata.mealThumb : null;

  const vsLast =
    reaction.symptomsBetterOrWorse === "better"
      ? "Better"
      : reaction.symptomsBetterOrWorse === "same"
        ? "About the same"
        : reaction.symptomsBetterOrWorse === "worse"
          ? "Worse"
          : "—";

  return (
    <div className="w-full min-w-0 space-y-2">
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{body}</p>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-xl border border-brandcolor-strokeweak bg-brandcolor-fill px-3 py-2 text-left transition-colors hover:bg-brandcolor-fill/80"
        aria-expanded={open}
      >
        <span className="min-w-0 flex-1 text-xs font-medium leading-snug text-brandcolor-text-strong">
          {shortSummary}
        </span>
        <CaretDown
          className={`h-5 w-5 shrink-0 text-brandcolor-stroke-strong transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          weight="bold"
          aria-hidden
        />
      </button>
      {open ? (
        <div className="overflow-x-auto rounded-xl border border-brandcolor-strokeweak bg-brandcolor-fill/70">
          <table className="w-full min-w-[17rem] border-collapse text-left text-xs text-brandcolor-text-strong">
            <tbody className="divide-y divide-brandcolor-strokeweak/80">
              {foodDisplay || mealThumbSaved ? (
                <tr>
                  <td className="px-3 py-2" colSpan={2}>
                    <div className="flex items-center gap-2">
                      {mealThumbSaved ? (
                        <span className="inline-flex shrink-0 items-center leading-none">
                          <Image
                            src={mealThumbSaved}
                            alt=""
                            width={28}
                            height={28}
                            unoptimized
                            className="h-7 w-7 object-contain mix-blend-multiply"
                          />
                        </span>
                      ) : null}
                      {foodDisplay ? (
                        <span className="font-medium text-brandcolor-text-strong">{foodDisplay}</span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ) : null}
              <ReactionMetricsTableRows reaction={reaction} />
              <tr>
                <th className="px-3 py-2 align-top font-normal text-brandcolor-text-weak">Notes</th>
                <td className="px-3 py-2 whitespace-pre-wrap">
                  {reaction.notes?.trim() ? reaction.notes : "—"}
                </td>
              </tr>
              <tr>
                <th className="px-3 py-2 font-normal text-brandcolor-text-weak">
                  Same meal yesterday?
                </th>
                <td className="px-3 py-2 font-medium">
                  {reaction.ateYesterdaySame ? "Yes" : "No"}
                </td>
              </tr>
              <tr>
                <th className="px-3 py-2 align-top font-normal text-brandcolor-text-weak">
                  Different vs usual?
                </th>
                <td className="px-3 py-2 whitespace-pre-wrap">
                  {reaction.feltDifferentNotes?.trim() ? reaction.feltDifferentNotes : "—"}
                </td>
              </tr>
              <tr>
                <th className="px-3 py-2 font-normal text-brandcolor-text-weak">
                  Symptoms vs last time
                </th>
                <td className="px-3 py-2 font-medium">{vsLast}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

function AssistantBubbleBody({
  metadata,
  body,
}: {
  metadata: Prisma.JsonValue | null;
  body: string;
}) {
  if (isDailyAiSummaryPreviewMetadata(metadata)) {
    return (
      <DailyAiSummaryBubble metadata={metadata as Record<string, unknown>} preview />
    );
  }

  if (isDailyAiSummaryMetadata(metadata)) {
    return <DailyAiSummaryBubble metadata={metadata as Record<string, unknown>} />;
  }

  if (isReactionSavedMetadata(metadata)) {
    return (
      <ReactionSavedBubble body={body} metadata={metadata as Record<string, unknown>} />
    );
  }

  const thumb = mealThumbFromMetadata(metadata);
  return (
    <span className="inline-flex max-w-full flex-wrap items-center gap-2 align-top">
      {thumb != null ? (
        <span className="inline-flex shrink-0 items-center self-center bg-transparent leading-none">
          <Image
            src={thumb}
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 object-contain mix-blend-multiply"
          />
        </span>
      ) : null}
      <span className="min-w-0 flex-1 whitespace-pre-wrap">{body}</span>
    </span>
  );
}

function DayDateBadge({ localDate, timezone }: { localDate: string; timezone: string }) {
  const weekday = weekdayLongForLocalDateKey(localDate, timezone);
  const dateLine = formatWeekdayMonthDayForLocalDateKey(localDate, timezone);
  return (
    <span className="inline-flex max-w-[min(100%,22rem)] flex-wrap items-center justify-center gap-x-1.5 rounded-full border border-brandcolor-strokeweak bg-brandcolor-fill px-3 py-1 text-center font-sans text-xs font-medium tracking-wide text-brandcolor-text-strong">
      <span className="capitalize">{weekday}</span>
      <span className="text-brandcolor-text-weak" aria-hidden>
        ·
      </span>
      <span>Today</span>
      <span className="text-brandcolor-text-weak" aria-hidden>
        ·
      </span>
      <span>{dateLine}</span>
    </span>
  );
}

function SliderRow({
  name,
  label,
  Icon,
}: {
  name: string;
  label: string;
  Icon: (typeof REACTION_SLIDER_FIELDS)[number]["Icon"];
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-brandcolor-text-strong">
      <span className="inline-flex items-center gap-2">
        <Icon
          className="shrink-0 text-brandcolor-stroke-strong"
          size={18}
          weight="regular"
          aria-hidden
        />
        {label}
      </span>
      <input
        type="range"
        name={name}
        min={1}
        max={5}
        step={1}
        defaultValue={3}
        className="w-full accent-brandcolor-primary"
      />
    </label>
  );
}

function ReactionChip({
  name,
  value,
  label,
}: {
  name: string;
  value: string;
  label: string;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-brandcolor-strokeweak bg-brandcolor-fill px-3 py-2 text-sm text-brandcolor-text-strong has-[:checked]:border-brandcolor-primary has-[:checked]:bg-brandcolor-white">
      <input
        type="radio"
        name={name}
        value={value}
        className="accent-brandcolor-primary"
      />
      {label}
    </label>
  );
}
