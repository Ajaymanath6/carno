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
    <main className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="font-serif text-xl font-semibold text-brandcolor-text-strong">
          Reports
        </h1>
        <p className="mt-1 text-sm text-brandcolor-text-weak">
          Range {from} → {to} ({user.timezone}).
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/reports?range=week"
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            range === "week"
              ? "bg-brandcolor-primary text-brandcolor-white"
              : "border border-brandcolor-strokeweak bg-brandcolor-white text-brandcolor-text-strong hover:bg-brandcolor-fill"
          }`}
        >
          Last 7 days
        </Link>
        <Link
          href="/reports?range=month"
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            range === "month"
              ? "bg-brandcolor-primary text-brandcolor-white"
              : "border border-brandcolor-strokeweak bg-brandcolor-white text-brandcolor-text-strong hover:bg-brandcolor-fill"
          }`}
        >
          Last 30 days
        </Link>
        <span className="rounded-full border border-brandcolor-strokeweak px-4 py-2 text-sm text-brandcolor-text-weak">
          Custom: use form below
        </span>
      </div>

      <form
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-brandcolor-strokeweak bg-brandcolor-white p-4"
        action="/reports"
        method="get"
      >
        <input type="hidden" name="range" value="custom" />
        <label className="flex flex-col text-sm text-brandcolor-text-strong">
          From
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="mt-1 rounded-xl border border-brandcolor-strokeweak bg-brandcolor-fill px-3 py-2 text-brandcolor-text-strong"
          />
        </label>
        <label className="flex flex-col text-sm text-brandcolor-text-strong">
          To
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="mt-1 rounded-xl border border-brandcolor-strokeweak bg-brandcolor-fill px-3 py-2 text-brandcolor-text-strong"
          />
        </label>
        <button
          type="submit"
          className="rounded-full bg-brandcolor-primary px-4 py-2 text-sm font-semibold text-brandcolor-white hover:bg-brandcolor-primary-hover"
        >
          Apply
        </button>
      </form>

      <section className="rounded-2xl border border-brandcolor-strokeweak bg-brandcolor-white p-4">
        <h2 className="font-medium text-brandcolor-text-strong">Totals</h2>
        <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-brandcolor-text-weak">Days in range</dt>
            <dd className="font-semibold text-brandcolor-text-strong">{sessions.length}</dd>
          </div>
          <div>
            <dt className="text-brandcolor-text-weak">Meals logged</dt>
            <dd className="font-semibold text-brandcolor-text-strong">{totalMeals}</dd>
          </div>
          <div>
            <dt className="text-brandcolor-text-weak">Reactions logged</dt>
            <dd className="font-semibold text-brandcolor-text-strong">{totalReactions}</dd>
          </div>
        </dl>
      </section>

      <section>
        <h2 className="font-medium text-brandcolor-text-strong">Foods & average symptoms</h2>
        <p className="mt-1 text-xs text-brandcolor-text-weak">
          Scales are 1–5 (higher bloating / discomfort = more reported intensity).
        </p>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-brandcolor-strokeweak bg-brandcolor-white">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="bg-brandcolor-fill text-xs uppercase text-brandcolor-text-weak">
              <tr>
                <th className="px-3 py-2">Food (normalized)</th>
                <th className="px-3 py-2">Times logged</th>
                <th className="px-3 py-2">Avg bloating</th>
                <th className="px-3 py-2">Avg stomach</th>
              </tr>
            </thead>
            <tbody className="text-brandcolor-text-strong">
              {rankedFoods.map(([name, agg]) => (
                <tr
                  key={name}
                  className="border-t border-brandcolor-strokeweak bg-brandcolor-white hover:bg-brandcolor-fill"
                >
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
                <tr className="border-t border-brandcolor-strokeweak bg-brandcolor-white">
                  <td className="px-3 py-6 text-brandcolor-text-weak" colSpan={4}>
                    No meals in this range yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-xs text-brandcolor-text-weak">
        Share this view with a clinician by exporting your history (screenshot or copy).
        PDF export can be added later.
      </p>
        </div>
      </div>
    </main>
  );
}
