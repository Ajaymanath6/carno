"use client";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-16 text-center">
      <h1 className="font-serif text-lg font-semibold text-brandcolor-text-strong">
        Something went wrong
      </h1>
      <p className="text-sm text-brandcolor-text-weak">
        On production, details are hidden. Check{" "}
        <strong className="text-brandcolor-text-strong">
          Vercel → Deployments → [latest] → Runtime / Function Logs
        </strong>
        . Common fixes: set{" "}
        <code className="rounded bg-brandcolor-fill px-1 py-0.5 text-xs text-brandcolor-text-strong">
          DATABASE_URL
        </code>
        ,{" "}
        <code className="rounded bg-brandcolor-fill px-1 py-0.5 text-xs text-brandcolor-text-strong">
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
        </code>
        ,{" "}
        <code className="rounded bg-brandcolor-fill px-1 py-0.5 text-xs text-brandcolor-text-strong">
          CLERK_SECRET_KEY
        </code>
        , then <strong className="text-brandcolor-text-strong">Redeploy</strong>. Run{" "}
        <code className="rounded bg-brandcolor-fill px-1 py-0.5 text-xs text-brandcolor-text-strong">
          npx prisma migrate deploy
        </code>{" "}
        against Neon if the DB schema is behind.
      </p>
      {error.digest != null && (
        <p className="font-mono text-xs text-brandcolor-text-weak">Digest: {error.digest}</p>
      )}
      <button
        type="button"
        onClick={() => reset()}
        className="mx-auto rounded-full bg-brandcolor-primary px-4 py-2 text-sm font-medium text-brandcolor-white hover:bg-brandcolor-primary-hover"
      >
        Try again
      </button>
    </div>
  );
}
