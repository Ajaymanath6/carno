"use client";

import { useEffect } from "react";

/** Sends visitors to the login landing FAQ (`#faq`). */
export default function FaqPage() {
  useEffect(() => {
    window.location.replace("/login#faq");
  }, []);

  return (
    <main className="flex min-h-0 flex-1 flex-col items-center justify-center bg-brandcolor-fill px-4 py-16">
      <p className="text-sm text-brandcolor-text-weak">Opening questions…</p>
    </main>
  );
}
