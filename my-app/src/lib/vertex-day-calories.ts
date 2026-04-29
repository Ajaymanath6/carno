import { GoogleGenAI } from "@google/genai/node";
import { z } from "zod";
import { loadGoogleExternalAccountCredentialJson } from "@/lib/vertex-daily-summary";

const BatchSchema = z.object({
  days: z.array(
    z.object({
      localDate: z.string(),
      totalKcal: z.number(),
    }),
  ),
});

export type DayCalorieInput = {
  localDate: string;
  meals: Array<{ rawText: string; quantity: string | null; unit: string | null }>;
};

function resolveAiProvider(): "auto" | "studio" | "vertex" {
  const raw = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (raw === "studio" || raw === "vertex") {
    return raw;
  }
  return "auto";
}

function buildMealDescriptionLine(m: DayCalorieInput["meals"][0]): string {
  const q = [m.quantity?.trim(), m.unit?.trim()].filter(Boolean).join(" ");
  return q ? `${q} — ${m.rawText.trim()}` : m.rawText.trim();
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

async function generateContentText(prompt: string): Promise<string> {
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

  if (process.env.VERTEX_DISABLED === "true") {
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

  return out;
}
