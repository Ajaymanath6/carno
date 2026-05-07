import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateAppUser } from "@/lib/user";
import { estimateDayCaloriesBatch } from "@/lib/vertex-day-calories";

/** History list Gemini totals can exceed default Vercel CPU limits when run inside the page RSC. */
export const maxDuration = 60;

export async function GET() {
  const user = await getOrCreateAppUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const days = await prisma.daySession.findMany({
      where: { userId: user.id },
      orderBy: { localDate: "desc" },
      select: {
        localDate: true,
        foodEntries: {
          select: { rawText: true, quantity: true, unit: true },
        },
      },
    });

    const kcalByDate = await estimateDayCaloriesBatch(
      days.map((d) => ({
        localDate: d.localDate,
        meals: d.foodEntries.map((e) => ({
          rawText: e.rawText,
          quantity: e.quantity,
          unit: e.unit,
        })),
      })),
    );

    return NextResponse.json({
      kcalByDate: Object.fromEntries(kcalByDate) as Record<string, number>,
    });
  } catch (err) {
    console.error("[api/history/calorie-totals]", err);
    return NextResponse.json(
      { error: "Failed to estimate calories" },
      { status: 500 },
    );
  }
}
