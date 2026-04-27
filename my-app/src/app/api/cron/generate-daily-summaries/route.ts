import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLocalDateKey } from "@/lib/date";
import { runAiDailySummaryForSession } from "@/lib/run-ai-daily-summary";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorize(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return false;
  }
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) {
    return true;
  }
  const url = new URL(req.url);
  return url.searchParams.get("secret") === secret;
}

/**
 * Vercel Cron: GET every 15 minutes (see `vercel.json`).
 * Generates AI daily article for today's ACTIVE sessions when schedule + idempotency match.
 */
export async function GET(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const users = await prisma.user.findMany({
    select: { id: true, timezone: true },
    take: 500,
  });

  const results: Array<{ userId: string; outcome: string }> = [];
  let anyOk = false;

  for (const u of users) {
    const todayKey = getLocalDateKey(u.timezone, now);
    const session = await prisma.daySession.findFirst({
      where: { userId: u.id, localDate: todayKey, status: "ACTIVE" },
      select: { id: true },
    });
    if (!session) {
      continue;
    }

    const out = await runAiDailySummaryForSession(prisma, session.id, now);
    if (out.status === "ok") {
      anyOk = true;
      results.push({ userId: u.id, outcome: "ok" });
    } else {
      results.push({ userId: u.id, outcome: `${out.status}:${"reason" in out ? out.reason : out.message}` });
    }
  }

  if (anyOk) {
    revalidatePath("/chat");
    revalidatePath("/history");
  }

  return NextResponse.json({
    ok: true,
    checkedUsers: users.length,
    results,
  });
}
