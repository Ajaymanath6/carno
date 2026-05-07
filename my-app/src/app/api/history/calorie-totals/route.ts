import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateAppUser } from "@/lib/user";
import {
  calorieEngineUsesReference,
  calorieEngineUsesVertex,
  resolveCalorieEngine,
  rollupReferenceCaloriesForDays,
  type CalorieDaySource,
  type DayCalorieSessionInput,
} from "@/lib/calories-reference";
import {
  aiRoutingUsesStudio,
  aiRoutingUsesVertex,
  resolveAiProvider,
  resolveVertexProjectId,
  vertexInlineCredentialJsonInvalidReason,
  vertexWorkloadCredentialEnvConfigured,
} from "@/lib/vertex-daily-summary";
import {
  calorieEstimationUnavailableReason,
  estimateDayCaloriesBatch,
} from "@/lib/vertex-day-calories";

/** History list Gemini totals can exceed default Vercel CPU limits when run inside the page RSC. */
export const maxDuration = 60;

export async function GET() {
  const user = await getOrCreateAppUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const engine = resolveCalorieEngine();
    const aiMode = resolveAiProvider();
    console.info("[api/history/calorie-totals] start", {
      calorieEngine: engine,
      aiProvider: aiMode,
      vertexDisabled: process.env.VERTEX_DISABLED === "true",
      hasGeminiApiKey: Boolean(process.env.GEMINI_API_KEY?.trim()),
      routingUsesVertex: aiRoutingUsesVertex(aiMode),
      routingUsesStudio: aiRoutingUsesStudio(aiMode),
      geminiApiKeyIgnoredForRouting:
        Boolean(process.env.GEMINI_API_KEY?.trim()) && aiMode === "auto",
      vertexProjectPresent: Boolean(resolveVertexProjectId()),
      vertexCredentialEnvPresent: vertexWorkloadCredentialEnvConfigured(),
      vertexInlineJsonParseError: vertexInlineCredentialJsonInvalidReason(),
    });

    const days = await prisma.daySession.findMany({
      where: { userId: user.id },
      orderBy: { localDate: "desc" },
      select: {
        localDate: true,
        foodEntries: {
          select: {
            id: true,
            rawText: true,
            quantity: true,
            unit: true,
            foodNameNormalized: true,
          },
        },
      },
    });

    console.info("[api/history/calorie-totals] loaded sessions", { count: days.length });

    const dayInputs: DayCalorieSessionInput[] = days.map((d) => ({
      localDate: d.localDate,
      foodEntries: d.foodEntries.map((e) => ({
        id: e.id,
        rawText: e.rawText,
        quantity: e.quantity,
        unit: e.unit,
        foodNameNormalized: e.foodNameNormalized,
      })),
    }));

    const kcalByDate = new Map<string, number>();
    const sourceByDate = new Map<string, CalorieDaySource>();

    if (calorieEngineUsesReference(engine)) {
      const rolled = rollupReferenceCaloriesForDays(dayInputs);
      for (const [d, k] of rolled.kcalByDate) {
        kcalByDate.set(d, k);
      }
      for (const [d, s] of rolled.sourceByDate) {
        sourceByDate.set(d, s);
      }
    }

    const vertexSkipReason = calorieEstimationUnavailableReason();
    const canUseVertex = vertexSkipReason == null;

    if (calorieEngineUsesVertex(engine) && canUseVertex) {
      const daysNeedingVertex =
        engine === "vertex" ?
          dayInputs.filter((d) => d.foodEntries.length > 0)
        : dayInputs.filter(
            (d) => d.foodEntries.length > 0 && !kcalByDate.has(d.localDate),
          );

      if (daysNeedingVertex.length > 0) {
        const vertexMap = await estimateDayCaloriesBatch(
          daysNeedingVertex.map((d) => ({
            localDate: d.localDate,
            meals: d.foodEntries.map((e) => ({
              rawText: e.rawText,
              quantity: e.quantity,
              unit: e.unit,
            })),
          })),
        );
        for (const [dateKey, kcal] of vertexMap) {
          kcalByDate.set(dateKey, kcal);
          sourceByDate.set(dateKey, "vertex");
        }
      }
    }

    console.info("[api/history/calorie-totals] done", {
      datesWithTotals: kcalByDate.size,
      engine,
    });

    return NextResponse.json({
      kcalByDate: Object.fromEntries(kcalByDate) as Record<string, number>,
      sourceByDate: Object.fromEntries(sourceByDate) as Record<string, CalorieDaySource>,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/history/calorie-totals]", err);
    const diagnostic =
      process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === "preview" ?
        message
      : undefined;
    return NextResponse.json(
      { error: "Failed to estimate calories", ...(diagnostic ? { diagnostic } : {}) },
      { status: 500 },
    );
  }
}
