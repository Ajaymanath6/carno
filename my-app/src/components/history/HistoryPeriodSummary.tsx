"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash } from "@phosphor-icons/react";
import {
  deleteAllHistory,
  generatePeriodClinicalSummary,
  type PeriodClinicalSummaryResult,
} from "@/app/actions/period-summary";

type Props = {
  dayCount: number;
};

export function HistoryPeriodSummary({ dayCount }: Props) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [result, setResult] = useState<PeriodClinicalSummaryResult | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (dayCount <= 0) {
    return null;
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  async function runSummary() {
    setPending(true);
    setResult(null);
    try {
      const out = await generatePeriodClinicalSummary();
      setResult(out);
    } finally {
      setPending(false);
    }
  }

  function openAndRun() {
    setResult(null);
    dialogRef.current?.showModal();
    void runSummary();
  }

  async function onDeleteHistory() {
    if (deletePending) {
      return;
    }
    const ok = window.confirm("Delete all history? This removes all logged days, meals, and reactions.");
    if (!ok) {
      return;
    }
    setDeletePending(true);
    setDeleteError(null);
    try {
      const out = await deleteAllHistory();
      if (!out.ok) {
        setDeleteError(out.error);
        return;
      }
      dialogRef.current?.close();
      router.refresh();
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <>
      <div className="flex w-full items-center justify-between gap-3">
        <button
          type="button"
          onClick={openAndRun}
          disabled={pending}
          className="inline-flex max-w-full items-center justify-center rounded-full border border-brandcolor-strokeweak bg-brandcolor-white px-4 py-3 text-left text-sm font-semibold text-brandcolor-primary shadow-sm hover:bg-brandcolor-fill disabled:opacity-60"
        >
          {pending ? "Generating…" : `Clinical summary · last ${dayCount} day${dayCount === 1 ? "" : "s"}`}
        </button>
        <button
          type="button"
          onClick={() => void onDeleteHistory()}
          disabled={deletePending}
          className="inline-flex items-center gap-1 text-sm font-semibold text-brandcolor-primary hover:underline disabled:opacity-50"
        >
          <Trash className="h-4 w-4" weight="bold" aria-hidden />
          {deletePending ? "Deleting…" : "Delete history"}
        </button>
      </div>
      {deleteError ? (
        <p className="mt-2 text-xs font-medium text-brandcolor-primary">{deleteError}</p>
      ) : null}

      <dialog
        ref={dialogRef}
        className="fixed left-1/2 top-1/2 z-[60] w-[min(calc(100vw-2rem),44rem)] max-h-[min(calc(100vh-2rem),calc(44rem+20px))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-brandcolor-strokeweak bg-brandcolor-white p-0 text-brandcolor-text-strong shadow-xl backdrop:bg-brandcolor-text-strong/35"
        aria-labelledby="period-summary-title"
      >
        <div className="flex max-h-[min(calc(100vh-2rem),calc(44rem+20px))] flex-col">
          <div className="border-b border-brandcolor-strokeweak px-5 py-4">
            <h2 id="period-summary-title" className="font-serif text-lg font-semibold">
              Clinical period summary
            </h2>
            <p className="mt-1 text-xs text-brandcolor-text-weak">
              For dietitian or clinician review — based only on self-reported logs in this app.
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {pending && (
              <p className="text-sm text-brandcolor-text-weak">Generating summary…</p>
            )}
            {result?.ok === false && (
              <p className="text-sm font-medium text-brandcolor-primary" role="alert">
                {result.error}
              </p>
            )}
            {result?.ok === true && (
              <div className="space-y-3">
                <p className="text-xs text-brandcolor-text-weak">
                  {result.dateRangeLabel} · {result.dayCount} day{result.dayCount === 1 ? "" : "s"}
                  {result.provider ? ` · ${result.provider}` : ""}
                </p>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-brandcolor-text-strong">
                  {result.article}
                </div>
                <p className="text-xs leading-relaxed text-brandcolor-text-weak">
                  Not medical advice or a diagnosis. Share with your care team as conversation support only.
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-brandcolor-strokeweak px-5 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="rounded-full border border-brandcolor-strokeweak px-4 py-2 text-sm font-medium text-brandcolor-text-strong hover:bg-brandcolor-fill"
              onClick={closeDialog}
            >
              Close
            </button>
            {!pending && result !== null && (
              <button
                type="button"
                className="rounded-full bg-brandcolor-primary px-4 py-2 text-sm font-semibold text-brandcolor-white hover:bg-brandcolor-primary-hover"
                onClick={() => void runSummary()}
              >
                Regenerate
              </button>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
