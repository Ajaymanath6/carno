"use client";

import { createContext, useContext } from "react";

export type LoginAuthOpenOpts = {
  /** Best-effort auto-click “Continue with Google” after Clerk mounts. */
  tryGoogle?: boolean;
};

export type LoginAuthContextValue = {
  openAuth: (opts?: LoginAuthOpenOpts) => void;
  closeAuth: () => void;
};

export const LoginAuthContext = createContext<LoginAuthContextValue | null>(null);

export function useLoginAuth(): LoginAuthContextValue {
  const ctx = useContext(LoginAuthContext);
  if (!ctx) {
    throw new Error("useLoginAuth must be used within LoginLandingShell");
  }
  return ctx;
}

export function tryClickClerkGoogle(scope: ParentNode | Document): void {
  const candidates = Array.from(scope.querySelectorAll("button,a"));
  const btn =
    candidates.find((el) =>
      (el.textContent ?? "").toLowerCase().includes("continue with google"),
    ) ??
    candidates.find((el) => (el.textContent ?? "").toLowerCase().includes("google"));
  if (btn instanceof HTMLElement) {
    btn.click();
  }
}
