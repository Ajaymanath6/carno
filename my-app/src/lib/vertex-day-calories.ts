import { GoogleGenAI } from "@google/genai/node";
import { z } from "zod";
import {
  loadGoogleExternalAccountCredentialJson,
  resolveAiProvider,
} from "@/lib/vertex-daily-summary";

const BatchSchema = z.object({
  days: z.array(
    z.object({
      localDate: z.string(),
      totalKcal: z.number(),
    }),
  ),
});

const MealBatchSchema = z.object({
  meals: z.array(
    z.object({
      id: z.string(),
      kcal: z.number(),
    }),
  ),
});

export type DayCalorieInput = {
  localDate: string;
  meals: Array<{ rawText: string; quantity: string | null; unit: string | null }>;
};

/** Per food-entry row for meal-level kcal (IDs match Prisma `FoodEntry.id`). */
export type MealCalorieEntryInput = {
  id: string;
  rawText: string;
  quantity: string | null;
  unit: string | null;
};

function buildMealDescriptionLine(
  m: DayCalorieInput["meals"][0] | Pick<MealCalorieEntryInput, "rawText" | "quantity" | "unit">,
): string {
  const q = [m.quantity?.trim(), m.unit?.trim()].filter(Boolean).join(" ");
  return q ? `${q} — ${m.rawText.trim()}` : m.rawText.trim();
}

/**
 * When non-null, calorie AI will not run; log this on the server to explain `— kcal` in production.
 * Mirrors routing in {@link generateContentText}.
 */
export function calorieEstimationUnavailableReason(): string | null {
  const vertexDisabled = process.env.VERTEX_DISABLED === "true";
  const mode = resolveAiProvider();
  const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
  const project = process.env.VERTEX_PROJECT_ID ?? process.env.GOOGLE_CLOUD_PROJECT?.trim();

  const tryStudio = mode === "studio" || (mode === "auto" && Boolean(geminiApiKey));
  const tryVertex =
    mode === "vertex" || (mode === "auto" && Boolean(project) && !geminiApiKey);

  /** Daily summaries respect VERTEX_DISABLED mock mode; calories can still use Studio (API key), not Vertex. */
  if (vertexDisabled) {
    if (tryStudio && geminiApiKey) return null;
    if (mode === "studio") {
      return "VERTEX_DISABLED=true: add GEMINI_API_KEY (Google AI Studio) so calorie estimates can run.";
    }
    return "VERTEX_DISABLED=true blocks Vertex for calories. Add GEMINI_API_KEY for Studio estimates, or unset VERTEX_DISABLED and configure Vertex.";
  }

  if (tryStudio && geminiApiKey) return null;
  if (tryVertex && project) return null;

  if (mode === "studio") {
    return "AI_PROVIDER=studio requires GEMINI_API_KEY.";
  }
  if (mode === "vertex") {
    return "AI_PROVIDER=vertex requires VERTEX_PROJECT_ID or GOOGLE_CLOUD_PROJECT.";
  }
  return "No AI backend for calories: set GEMINI_API_KEY (Google AI Studio), or Vertex project + credentials.";
}

function buildBatchPrompt(chunk: DayCalorieInput[]): string {
  const payload = chunk.map((d) => ({
    localDate: d.localDate,
    meals: d.meals.map(buildMealDescriptionLine),
  }));
  return (
    `You estimate total dietary calories per calendar day from informal meal logs (e.g. "7 eggs" → multiply typical kcal per egg). ` +
    `Use reasonable USDA-style averages; explain nothing. ` +
    `If quantity is ambiguous, assume typical single servings unless the text specifies a count (e.g. 7 eggs = 7 × ~72–78 kcal each). ` +
    `Return ONLY valid JSON with this exact shape (no markdown fences):\n` +
    `{"days":[{"localDate":"YYYY-MM-DD","totalKcal":1234}]}\n` +
    `Include every localDate below exactly once. Integer totalKcal rounded. Days with empty meals array must have totalKcal 0.\n\n` +
    `DATA:\n${JSON.stringify(payload)}`
  );
}

function parseBatchJson(text: string): z.infer<typeof BatchSchema> {
  const trimmed = text.trim();
  try {
    const direct = JSON.parse(trimmed) as unknown;
    return BatchSchema.parse(direct);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) {
      return BatchSchema.parse(JSON.parse(match[0]) as unknown);
    }
    throw new Error("Could not parse calorie JSON from model.");
  }
}

function parseMealBatchJson(text: string): z.infer<typeof MealBatchSchema> {
  const trimmed = text.trim();
  try {
    const direct = JSON.parse(trimmed) as unknown;
    return MealBatchSchema.parse(direct);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) {
      return MealBatchSchema.parse(JSON.parse(match[0]) as unknown);
    }
    throw new Error("Could not parse meal calorie JSON from model.");
  }
}

function buildMealLevelBatchPrompt(chunk: MealCalorieEntryInput[]): string {
  const payload = chunk.map((e) => ({
    id: e.id,
    line: buildMealDescriptionLine(e),
  }));
  return (
    `You estimate calories for each meal log line independently using typical USDA-style averages ` +
    `(e.g. "7 eggs" → 7 × typical kcal per egg). Use reasonable integers; explain nothing. ` +
    `Return ONLY valid JSON (no markdown fences):\n` +
    `{"meals":[{"id":"<same id as input>","kcal":504}]}\n` +
    `Include every id below exactly once. Integer kcal rounded, minimum 0.\n\n` +
    `DATA:\n${JSON.stringify(payload)}`
  );
}

async function generateContentText(prompt: string): Promise<string> {
  const vertexDisabled = process.env.VERTEX_DISABLED === "true";
  const mode = resolveAiProvider();
  const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
  const project = process.env.VERTEX_PROJECT_ID ?? process.env.GOOGLE_CLOUD_PROJECT?.trim();

  const tryStudio = mode === "studio" || (mode === "auto" && Boolean(geminiApiKey));
  const tryVertex =
    mode === "vertex" || (mode === "auto" && Boolean(project) && !geminiApiKey);

  if (tryStudio && geminiApiKey) {
    const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const out = response.text?.trim();
    if (!out) {
      throw new Error("Gemini (Studio) returned empty text for calorie batch.");
    }
    return out;
  }

  if (vertexDisabled && tryVertex && project) {
    throw new Error(
      "VERTEX_DISABLED=true: calorie batch cannot use Vertex. Set GEMINI_API_KEY for Google AI Studio, or unset VERTEX_DISABLED.",
    );
  }

  if (tryVertex && project) {
    const location = process.env.VERTEX_LOCATION ?? "us-central1";
    const model = process.env.VERTEX_GEMINI_MODEL ?? "gemini-2.0-flash-001";
    const credentials = await loadGoogleExternalAccountCredentialJson();
    const ai = new GoogleGenAI({
      vertexai: true,
      project,
      location,
      googleAuthOptions: {
        credentials,
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
      },
      httpOptions: {
        apiVersion: process.env.VERTEX_API_VERSION ?? "v1",
      },
    });
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const out = response.text?.trim();
    if (!out) {
      throw new Error("Vertex returned empty text for calorie batch.");
    }
    return out;
  }

  throw new Error(
    "No AI backend configured for calorie estimates (GEMINI_API_KEY or Vertex).",
  );
}

const CHUNK_SIZE = 14;
const MEAL_CHUNK_SIZE = 24;

/**
 * Per-day total kcal from AI using typical nutrition averages (not lab-accurate).
 * Days with no meals return 0 without calling the model.
 */
export async function estimateDayCaloriesBatch(
  days: DayCalorieInput[],
): Promise<Map<string, number>> {
  const out = new Map<string, number>();

  for (const d of days) {
    if (d.meals.length === 0) {
      out.set(d.localDate, 0);
    }
  }

  const needsModel = days.filter((d) => d.meals.length > 0);
  if (needsModel.length === 0) {
    return out;
  }

  const skip = calorieEstimationUnavailableReason();
  if (skip) {
    console.warn("[calorie-kcal]", skip);
    return out;
  }

  for (let i = 0; i < needsModel.length; i += CHUNK_SIZE) {
    const chunk = needsModel.slice(i, i + CHUNK_SIZE);
    const prompt = buildBatchPrompt(chunk);
    const text = await generateContentText(prompt);
    const parsed = parseBatchJson(text);
    for (const row of parsed.days) {
      out.set(row.localDate, Math.max(0, Math.round(row.totalKcal)));
    }
  }

  const stillMissing = needsModel.filter((d) => !out.has(d.localDate));
  for (const d of stillMissing) {
    try {
      const prompt = buildBatchPrompt([d]);
      const text = await generateContentText(prompt);
      const parsed = parseBatchJson(text);
      for (const row of parsed.days) {
        out.set(row.localDate, Math.max(0, Math.round(row.totalKcal)));
      }
    } catch (e) {
      console.error("[calorie-kcal] single-day retry failed:", d.localDate, e);
    }
  }

  return out;
}

/**
 * Per-meal (food entry) kcal from the same Gemini backends as day totals.
 */
export async function estimateMealCaloriesBatch(
  entries: MealCalorieEntryInput[],
): Promise<Map<string, number>> {
  const out = new Map<string, number>();

  const nonEmpty = entries.filter((e) => buildMealDescriptionLine(e).length > 0);
  if (nonEmpty.length === 0) {
    return out;
  }

  const skip = calorieEstimationUnavailableReason();
  if (skip) {
    console.warn("[calorie-kcal]", skip);
    return out;
  }

  for (let i = 0; i < nonEmpty.length; i += MEAL_CHUNK_SIZE) {
    const chunk = nonEmpty.slice(i, i + MEAL_CHUNK_SIZE);
    const prompt = buildMealLevelBatchPrompt(chunk);
    const text = await generateContentText(prompt);
    const parsed = parseMealBatchJson(text);
    for (const row of parsed.meals) {
      out.set(row.id, Math.max(0, Math.round(row.kcal)));
    }
  }

  const mealsStillMissing = nonEmpty.filter((e) => !out.has(e.id));
  for (const e of mealsStillMissing) {
    try {
      const prompt = buildMealLevelBatchPrompt([e]);
      const text = await generateContentText(prompt);
      const parsed = parseMealBatchJson(text);
      for (const row of parsed.meals) {
        out.set(row.id, Math.max(0, Math.round(row.kcal)));
      }
    } catch (err) {
      console.error("[calorie-kcal] single-meal retry failed:", e.id, err);
    }
  }

  return out;
}
