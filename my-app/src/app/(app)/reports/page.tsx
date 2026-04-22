import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getOrCreateAppUser } from "@/lib/user";
import { redirect } from "next/navigation";
import { shiftLocalDateKey } from "@/lib/date";

type RangeKey = "week" | "month" | "custom";

function resolveRange(
  range: RangeKey,
  todayKey: string,
  customFrom?: string,
  customTo?: string,
): { from: string; to: string } {
  const to = todayKey;
  if (range === "week") {
    return { from: shiftLocalDateKey(to, -6), to };
  }
  if (range === "month") {
    return { from: shiftLocalDateKey(to, -29), to };
  }
  const from = customFrom && /^\d{4}-\d{2}-\d{2}$/.test(customFrom) ? customFrom : shiftLocalDateKey(to, -20);
  const toResolved =
    customTo && /^\d{4}-\d{2}-\d{2}$/.test(customTo) ? customTo : to;
  return from <= toResolved ? { from, to: toResolved } : { from: toResolved, to: from };
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const user = await getOrCreateAppUser();
  if (!user) {
    redirect("/login");
  }

  const sp = await searchParams;
  const rangeParam = (sp.range as RangeKey) || "week";
  const range: RangeKey =
    rangeParam === "month" || rangeParam === "custom" || rangeParam === "week"
      ? rangeParam
      : "week";

  const todayKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: user.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const { from, to } = resolveRange(range, todayKey, sp.from, sp.to);

  const sessions = await prisma.daySession.findMany({
    where: {
      userId: user.id,
      localDate: { gte: from, lte: to },
    },
    include: {
      foodEntries: {
        include: { reactions: true },
      },
    },
    orderBy: { localDate: "asc" },
  });

  const totalMeals = sessions.reduce((n, s) => n + s.foodEntries.length, 0);
  const totalReactions = sessions.reduce(
    (n, s) => n + s.foodEntries.reduce((m, f) => m + f.reactions.length, 0),
    0,
  );

  const byFood = new Map<
    string,
    {
      count: number;
      bloatingSum: number;
      bloatingN: number;
      discomfortSum: number;
      discomfortN: number;
    }
  >();

  for (const day of sessions) {
    for (const food of day.foodEntries) {
      const key = food.foodNameNormalized || "unknown";
      const agg = byFood.get(key) ?? {
        count: 0,
        bloatingSum: 0,
        bloatingN: 0,
        discomfortSum: 0,
        discomfortN: 0,
      };
      agg.count += 1;
      for (const r of food.reactions) {
        if (r.bloating != null) {
          agg.bloatingSum += r.bloating;
          agg.bloatingN += 1;
        }
        if (r.stomachDiscomfort != null) {
          agg.discomfortSum += r.stomachDiscomfort;
          agg.discomfortN += 1;
        }
      }
      byFood.set(key, agg);
    }
  }

  const rankedFoods = [...byFood.entries()].sort((a, b) => b[1].count - a[1].count);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-xl font-semibold">Reports</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Range {from} → {to} ({user.timezone}).
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/reports?range=week"
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            range === "week"
              ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
              : "border border-[var(--color-border)] bg-[var(--color-surface)]"
          }`}
        >
          Last 7 days
        </Link>
        <Link
          href="/reports?range=month"
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            range === "month"
              ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
              : "border border-[var(--color-border)] bg-[var(--color-surface)]"
          }`}
        >
          Last 30 days
        </Link>
        <span className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-muted-foreground)]">
          Custom: use form below
        </span>
      </div>

      <form
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
        action="/reports"
        method="get"
      >
        <input type="hidden" name="range" value="custom" />
        <label className="flex flex-col text-sm">
          From
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="mt-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
        </label>
        <label className="flex flex-col text-sm">
          To
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="mt-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-foreground)]"
        >
          Apply
        </button>
      </form>

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted)] p-4">
        <h2 className="font-medium">Totals</h2>
        <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-[var(--color-muted-foreground)]">Days in range</dt>
            <dd className="font-semibold">{sessions.length}</dd>
          </div>
          <div>
            <dt className="text-[var(--color-muted-foreground)]">Meals logged</dt>
            <dd className="font-semibold">{totalMeals}</dd>
          </div>
          <div>
            <dt className="text-[var(--color-muted-foreground)]">Reactions logged</dt>
            <dd className="font-semibold">{totalReactions}</dd>
          </div>
        </dl>
      </section>

      <section>
        <h2 className="font-medium">Foods & average symptoms</h2>
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          Scales are 1–5 (higher bloating / discomfort = more reported intensity).
        </p>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-[var(--color-border)]">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="bg-[var(--color-surface)] text-xs uppercase text-[var(--color-muted-foreground)]">
              <tr>
                <th className="px-3 py-2">Food (normalized)</th>
                <th className="px-3 py-2">Times logged</th>
                <th className="px-3 py-2">Avg bloating</th>
                <th className="px-3 py-2">Avg stomach</th>
              </tr>
            </thead>
            <tbody>
              {rankedFoods.map(([name, agg]) => (
                <tr key={name} className="border-t border-[var(--color-border)]">
                  <td className="px-3 py-2">{name}</td>
                  <td className="px-3 py-2">{agg.count}</td>
                  <td className="px-3 py-2">
                    {agg.bloatingN
                      ? (agg.bloatingSum / agg.bloatingN).toFixed(1)
                      : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {agg.discomfortN
                      ? (agg.discomfortSum / agg.discomfortN).toFixed(1)
                      : "—"}
                  </td>
                </tr>
              ))}
              {rankedFoods.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-[var(--color-muted-foreground)]" colSpan={4}>
                    No meals in this range yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-xs text-[var(--color-muted-foreground)]">
        Share this view with a clinician by exporting your history (screenshot or copy).
        PDF export can be added later.
      </p>
    </main>
  );
}
