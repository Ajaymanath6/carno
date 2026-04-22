"use client";

export default function AppRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-16 text-center">
      <h1 className="text-lg font-semibold text-[var(--color-foreground)]">
        Something went wrong
      </h1>
      <p className="text-sm text-[var(--color-muted-foreground)]">
        In production, Next.js hides the detailed error to protect secrets. If you deploy on
        Vercel, open{" "}
        <strong className="text-[var(--color-foreground)]">
          Project → Deployments → [failed deployment] → Logs / Functions
        </strong>{" "}
        and confirm{" "}
        <code className="rounded bg-[var(--color-muted)] px-1 py-0.5 text-xs">
          DATABASE_URL
        </code>
        ,{" "}
        <code className="rounded bg-[var(--color-muted)] px-1 py-0.5 text-xs">
          AUTH_SECRET
        </code>
        , and{" "}
        <code className="rounded bg-[var(--color-muted)] px-1 py-0.5 text-xs">
          NEXTAUTH_URL
        </code>{" "}
        match your production URL.
      </p>
      {error.digest != null && (
        <p className="font-mono text-xs text-[var(--color-muted-foreground)]">
          Digest: {error.digest}
        </p>
      )}
      <button
        type="button"
        onClick={() => reset()}
        className="mx-auto rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)]"
      >
        Try again
      </button>
    </div>
  );
}
