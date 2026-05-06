import Link from "next/link";

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "What is Carno?",
    a: "A calm, chat-style food + symptom diary designed to make patterns easier to review day by day and across a period.",
  },
  {
    q: "Is this medical advice?",
    a: "No. It’s a personal tracking tool. Use it to support conversations with your clinician.",
  },
  {
    q: "What do I log?",
    a: "Meals and optional reaction check-ins (energy, digestion, mood). The app can generate daily and multi-day summaries based on your logs.",
  },
];

export default function FaqPage() {
  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-brandcolor-fill px-4 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <Link href="/login" className="text-sm text-brandcolor-primary hover:underline">
          ← Back
        </Link>
        <h1 className="mt-3 font-serif text-2xl font-semibold text-brandcolor-text-strong">
          FAQ
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-brandcolor-text-weak">
          Quick answers about what this app does and what it doesn’t do.
        </p>

        <ul className="mt-6 flex flex-col gap-3">
          {FAQS.map((f) => (
            <li
              key={f.q}
              className="rounded-2xl border border-brandcolor-strokeweak bg-brandcolor-white p-6"
            >
              <h2 className="font-medium text-brandcolor-text-strong">{f.q}</h2>
              <p className="mt-2 text-sm leading-relaxed text-brandcolor-text-weak">{f.a}</p>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <Link
            href="/login#access"
            className="inline-flex items-center justify-center rounded-full bg-brandcolor-primary px-5 py-3 text-sm font-semibold text-brandcolor-white hover:bg-brandcolor-primary-hover"
          >
            Get access
          </Link>
        </div>
      </div>
    </main>
  );
}

