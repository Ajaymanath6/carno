import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processDueFollowUpsForSession } from "@/lib/followups";

/**
 * Scheduled job (e.g. Vercel Cron). If CRON_SECRET is set, require:
 * Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    const token = auth?.replace(/^Bearer\s+/i, "");
    if (token !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Set CRON_SECRET for production cron access" },
      { status: 503 },
    );
  }

  const sessions = await prisma.daySession.findMany({
    where: { status: "ACTIVE" },
    select: { id: true },
  });

  for (const s of sessions) {
    await processDueFollowUpsForSession(s.id);
  }

  return NextResponse.json({ processed: sessions.length });
}
