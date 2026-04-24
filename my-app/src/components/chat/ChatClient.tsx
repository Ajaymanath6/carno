"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { ChatMessage, ConversationPhase } from "@prisma/client";
import {
  generateDailySummary,
  sendMealMessage,
  submitReaction,
  type ActionState,
} from "@/app/actions/chat";
import { EOD_PANEL_START_HOUR, getLocalHourInTimeZone } from "@/lib/date";

type Props = {
  messages: Pick<ChatMessage, "id" | "role" | "body" | "createdAt">[];
  sessionId: string;
  phase: ConversationPhase;
  sessionStatus: "ACTIVE" | "CLOSED";
  pendingFoodEntryId: string | null;
  timezone: string;
};

const initialActionState: ActionState = {};

export function ChatClient({
  messages,
  sessionId,
  phase,
  sessionStatus,
  pendingFoodEntryId,
  timezone,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, phase, mealState.ok, reactionState.ok]);

  useEffect(() => {
    function tick() {
      setShowEodPanel(getLocalHourInTimeZone(timezone) >= EOD_PANEL_START_HOUR);
    }
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [timezone]);

  const canLogMeals = sessionStatus === "ACTIVE" && phase === "CHAT";
  const showReaction =
    sessionStatus === "ACTIVE" &&
    phase === "ASK_REACTION" &&
    !!pendingFoodEntryId;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-brandcolor-fill">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ul className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-4">
          {messages.map((m) => (
            <li
              key={m.id}
              className={`flex ${m.role === "USER" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "USER"
                    ? "bg-brandcolor-primary text-brandcolor-primary-foreground"
                    : "bg-brandcolor-chat-assistant text-brandcolor-text-strong"
                }`}
              >
                {m.body}
              </div>
            </li>
          ))}
          <div ref={bottomRef} />
        </ul>
      </div>

      {sessionStatus === "CLOSED" && (
        <p className="mx-auto max-w-3xl px-4 pb-4 text-center text-sm text-brandcolor-text-weak">
          This day is closed. Open <strong>History</strong> to review or come back
          tomorrow for a new chat.
        </p>
      )}

      {mealState.error && (
        <p className="mx-auto max-w-3xl px-4 pb-2 text-center text-sm text-brandcolor-destructive">
          {mealState.error}
        </p>
      )}
      {reactionState.error && (
        <p className="mx-auto max-w-3xl px-4 pb-2 text-center text-sm text-brandcolor-destructive">
          {reactionState.error}
        </p>
      )}
      {summaryState.error && (
        <p className="mx-auto max-w-3xl px-4 pb-2 text-center text-sm text-brandcolor-destructive">
          {summaryState.error}
        </p>
      )}

      {sessionStatus === "ACTIVE" && !showReaction && showEodPanel && (
        <div className="border-t border-brandcolor-strokeweak bg-brandcolor-bone px-4 py-3">
          <form action={summaryAction} className="mx-auto max-w-3xl space-y-2">
            <input type="hidden" name="sessionId" value={sessionId} />
            <label className="block text-sm font-medium text-brandcolor-text-strong">
              End of day — how was your day overall?
              <textarea
                name="dayOverallSurvey"
                rows={2}
                className="mt-1 w-full rounded-xl border border-brandcolor-strokeweak bg-brandcolor-surface px-3 py-2 text-sm text-brandcolor-text-strong"
                placeholder="Optional reflection before we save today’s summary"
              />
            </label>
            <button
              type="submit"
              disabled={summaryPending}
              className="rounded-full border border-brandcolor-strokeweak bg-brandcolor-surface px-4 py-2 text-sm font-medium text-brandcolor-text-strong hover:bg-brandcolor-neutralhover disabled:opacity-60"
            >
              {summaryPending ? "Saving summary…" : "Save daily summary & close day"}
            </button>
          </form>
          <p className="mx-auto mt-2 max-w-3xl text-xs text-brandcolor-text-weak">
            Time zone for reminders: {timezone}. After closing, tomorrow opens a fresh chat.
          </p>
        </div>
      )}

      {showReaction && pendingFoodEntryId && (
        <div className="border-t border-brandcolor-strokeweak bg-brandcolor-surface p-4 shadow-sm">
          <form action={reactionAction} className="mx-auto max-w-3xl space-y-3">
            <input name="foodEntryId" type="hidden" value={pendingFoodEntryId} />
            <p className="text-sm font-medium text-brandcolor-text-strong">
              Symptom check-in (1 = low / none, 5 = high)
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <SliderRow name="energyLevel" label="Energy" />
              <SliderRow name="bloating" label="Bloating" />
              <SliderRow name="gas" label="Gas" />
              <SliderRow name="stomachDiscomfort" label="Stomach discomfort" />
              <SliderRow name="mood" label="Mood" />
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
                <Chip name="ateYesterdaySame" value="yes" label="Yes" />
                <Chip name="ateYesterdaySame" value="no" label="No" />
              </div>
            </fieldset>
            <label className="block text-sm">
              <span className="text-brandcolor-text-weak">
                Did anything feel different vs usual?
              </span>
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
              disabled={reactionPending}
              className="flex min-h-11 w-full items-center justify-center rounded-full bg-brandcolor-primary px-4 py-2 text-sm font-semibold text-brandcolor-primary-foreground hover:bg-brandcolor-primary-hover disabled:opacity-60"
            >
              {reactionPending ? "Saving…" : "Save check-in"}
            </button>
          </form>
        </div>
      )}

      {canLogMeals && (
        <div className="border-t border-brandcolor-strokeweak bg-brandcolor-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <form action={mealAction} className="mx-auto flex max-w-3xl gap-2">
            <label className="sr-only" htmlFor="meal-message">
              What did you eat?
            </label>
            <textarea
              id="meal-message"
              name="message"
              rows={2}
              required
              placeholder='e.g. "600g chicken and rice"'
              className="min-h-[2.75rem] flex-1 resize-none rounded-2xl border border-brandcolor-strokeweak bg-brandcolor-fill px-4 py-3 text-base text-brandcolor-text-strong"
            />
            <button
              type="submit"
              disabled={mealPending}
              className="min-h-[2.75rem] shrink-0 self-end rounded-full bg-brandcolor-primary px-5 text-sm font-semibold text-brandcolor-primary-foreground hover:bg-brandcolor-primary-hover disabled:opacity-60"
            >
              {mealPending ? "…" : "Send"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function SliderRow({ name, label }: { name: string; label: string }) {
  return (
    <label className="flex flex-col gap-1 text-sm text-brandcolor-text-strong">
      <span>{label}</span>
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

function Chip({
  name,
  value,
  label,
}: {
  name: string;
  value: string;
  label: string;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-brandcolor-strokeweak bg-brandcolor-fill px-3 py-2 text-sm text-brandcolor-text-strong has-[:checked]:border-brandcolor-primary has-[:checked]:bg-brandcolor-bone">
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
