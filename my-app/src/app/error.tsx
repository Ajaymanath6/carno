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
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="text-sm text-neutral-600">
        On production, details are hidden. Check{" "}
        <strong>Vercel → Deployments → [latest] → Runtime / Function Logs</strong>. Common
        fixes: set <code className="rounded bg-neutral-100 px-1">DATABASE_URL</code>,{" "}
        <code className="rounded bg-neutral-100 px-1">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code>
        , <code className="rounded bg-neutral-100 px-1">CLERK_SECRET_KEY</code>, then{" "}
        <strong>Redeploy</strong>. Run{" "}
        <code className="rounded bg-neutral-100 px-1">npx prisma migrate deploy</code> against
        Neon if the DB schema is behind.
      </p>
      {error.digest != null && (
        <p className="font-mono text-xs text-neutral-500">Digest: {error.digest}</p>
      )}
      <button
        type="button"
        onClick={() => reset()}
        className="mx-auto rounded-full bg-teal-600 px-4 py-2 text-sm font-medium text-white"
      >
        Try again
      </button>
    </div>
  );
}
