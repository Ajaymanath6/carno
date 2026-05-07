"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  resetActiveDaySessionForToday,
  type ResetDaySessionState,
} from "@/app/actions/day-session";

const initialResetState: ResetDaySessionState = {};

type Props = {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
};

export function NewDayChatDialog({ dialogRef }: Props) {
  const router = useRouter();
  const [resetState, resetAction, resetPending] = useActionState(
    resetActiveDaySessionForToday,
    initialResetState,
  );

  useEffect(() => {
    if (resetState.ok) {
      router.refresh();
    }
  }, [resetState.ok, router]);

  function closeDialog() {
    dialogRef.current?.close();
  }

  return (
    <dialog
      ref={dialogRef}
      className="fixed left-1/2 top-1/2 z-[60] w-[min(calc(100vw-2rem),24rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-brandcolor-strokeweak bg-brandcolor-white p-6 text-brandcolor-text-strong shadow-xl backdrop:bg-brandcolor-text-strong/35"
      aria-labelledby="new-day-chat-title"
    >
      <h2 id="new-day-chat-title" className="font-serif text-lg font-semibold">
        Today&apos;s chat
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-brandcolor-text-weak">
        You&apos;re still on the same calendar day. You can keep logging here as usual, or start
        fresh and clear today&apos;s messages and meal logs from this app (your history for today
        will reset).
      </p>
      {resetState.error != null && (
        <p className="mt-3 text-sm font-medium text-brandcolor-primary" role="alert">
          {resetState.error}
        </p>
      )}
      {resetState.ok && (
        <p className="mt-3 text-sm font-medium text-green-700" role="status">
          Started fresh for today. You can close this modal and continue logging.
        </p>
      )}
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          className="rounded-full border border-brandcolor-strokeweak px-4 py-2 text-sm font-medium text-brandcolor-text-strong hover:bg-brandcolor-fill"
          onClick={closeDialog}
        >
          Continue today&apos;s chat
        </button>
        <form action={resetAction}>
          <button
            type="submit"
            disabled={resetPending}
            className="w-full rounded-full bg-brandcolor-primary px-4 py-2 text-sm font-semibold text-brandcolor-white hover:bg-brandcolor-primary-hover disabled:opacity-50 sm:w-auto"
          >
            {resetPending ? "Resetting…" : "Start fresh today"}
          </button>
        </form>
      </div>
    </dialog>
  );
}
