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
      <h1 className="font-serif text-lg font-semibold text-brandcolor-text-strong">
        Something went wrong
      </h1>
      <p className="text-sm text-brandcolor-text-weak">
        In production, Next.js hides the detailed error to protect secrets. If you deploy on
        Vercel, open{" "}
        <strong className="text-brandcolor-text-strong">
          Project → Deployments → [failed deployment] → Logs / Functions
        </strong>{" "}
        and confirm{" "}
        <code className="rounded bg-brandcolor-fill px-1 py-0.5 text-xs text-brandcolor-text-strong">
          DATABASE_URL
        </code>
        ,{" "}
        <code className="rounded bg-brandcolor-fill px-1 py-0.5 text-xs text-brandcolor-text-strong">
          AUTH_SECRET
        </code>
        , and{" "}
        <code className="rounded bg-brandcolor-fill px-1 py-0.5 text-xs text-brandcolor-text-strong">
          NEXTAUTH_URL
        </code>{" "}
        match your production URL.
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
