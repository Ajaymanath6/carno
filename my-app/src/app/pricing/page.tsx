import Link from "next/link";

export default function PricingPage() {
  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-brandcolor-fill px-4 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <Link href="/login" className="text-sm text-brandcolor-primary hover:underline">
          ← Back
        </Link>
        <h1 className="mt-3 font-serif text-2xl font-semibold text-brandcolor-text-strong">
          Pricing
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-brandcolor-text-weak">
          Pricing details will live here. Keep this page simple and consistent with the Carno
          theme.
        </p>

        <div className="mt-6 rounded-2xl border border-brandcolor-strokeweak bg-brandcolor-white p-6">
          <h2 className="font-medium text-brandcolor-text-strong">Early access</h2>
          <p className="mt-2 text-sm text-brandcolor-text-weak">
            If you’re seeing this page, pricing is not finalized yet. Use “Get access” on the
            login page to sign in.
          </p>
          <div className="mt-5">
            <Link
              href="/login#access"
              className="inline-flex items-center justify-center rounded-full bg-brandcolor-primary px-5 py-3 text-sm font-semibold text-brandcolor-white hover:bg-brandcolor-primary-hover"
            >
              Get access
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

