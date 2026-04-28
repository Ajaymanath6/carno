"use client";

import type { KeyboardEvent, RefObject } from "react";
import { PaperPlaneRight } from "@phosphor-icons/react";

type Props = {
  id: string;
  inquiryRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  sendDisabled: boolean;
  placeholder: string;
  srLabel: string;
};

export function LearningsInquiryComposer({
  id,
  inquiryRef,
  value,
  onChange,
  onKeyDown,
  onSend,
  sendDisabled,
  placeholder,
  srLabel,
}: Props) {
  return (
    <div className="sticky bottom-0 z-10 flex shrink-0 justify-center bg-brandcolor-fill px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
      <div className="pointer-events-auto w-full max-w-md">
        <div className="mx-auto w-full max-w-md">
          <label className="sr-only" htmlFor={id}>
            {srLabel}
          </label>
          <div className="flex min-h-[3rem] w-full items-end rounded-2xl border border-transparent bg-brandcolor-white pl-1 shadow-lg ring-1 ring-brandcolor-strokeweak/60 transition-colors hover:border-brandcolor-strokeweak focus-within:border-brandcolor-stroke-strong">
            <textarea
              ref={inquiryRef}
              id={id}
              rows={2}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={placeholder}
              className="min-h-[2.75rem] min-w-0 flex-1 resize-none border-0 bg-transparent py-3 pl-3 pr-2 text-base text-brandcolor-text-strong outline-none focus:ring-0"
            />
            <button
              type="button"
              disabled={sendDisabled}
              aria-label="Send question to chat"
              onClick={onSend}
              className="mb-1.5 mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brandcolor-primary text-brandcolor-white hover:bg-brandcolor-primary-hover disabled:pointer-events-none disabled:opacity-50"
            >
              <PaperPlaneRight className="-translate-x-px" size={22} weight="bold" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
