import { GoogleGenAI } from "@google/genai/node";
import type { PeriodSummaryPayload } from "@/lib/period-summary";
import {
  loadGoogleExternalAccountCredentialJson,
  resolveAiProvider,
} from "@/lib/vertex-daily-summary";

export type GeminiPeriodArticleProvider = "mock" | "studio" | "vertex";

export type GenerateGeminiPeriodArticleResult = {
  article: string;
  provider: GeminiPeriodArticleProvider;
};

export type PeriodArticleInput = {
  payload: PeriodSummaryPayload;
  timezone: string;
  displayName: string;
  /** First and last local date keys (YYYY-MM-DD) included in the payload. */
  dateRangeLabel: string;
  dayCount: number;
};

function mockPeriodArticle(input: PeriodArticleInput): string {
  const n = input.payload.days.length;
  const meals = input.payload.days.reduce((a, d) => a + d.summary.foods.length, 0);
  return (
    `Clinical-style period snapshot (${n} day(s), ${meals} meal log(s), ${input.dateRangeLabel}). ` +
    `(VERTEX_DISABLED=true — enable GEMINI_API_KEY or Vertex for a full narrative.)`
  );
}

/**
 * Period clinical summary backend: optional `AI_PROVIDER_PERIOD` overrides `AI_PROVIDER`
 * so multi-day digests can target Vertex while daily summaries stay on Studio (or vice versa).
 */
function resolvePeriodAiProvider(): "auto" | "studio" | "vertex" {
  const raw = process.env.AI_PROVIDER_PERIOD?.trim().toLowerCase();
  if (raw === "studio" || raw === "vertex" || raw === "auto") {
    return raw;
  }
  return resolveAiProvider();
}

function buildPeriodSummaryPrompt(input: PeriodArticleInput): string {
  const dataJson = JSON.stringify(input.payload);
  return (
    `You are assisting a registered dietitian or physician who is reviewing a patient's self-reported food and symptom diary. ` +
    `Write a concise clinical-style digest (under 450 words) covering the FULL period in the JSON only. ` +
    `This is NOT a diagnosis or medical advice; base everything strictly on the logged data. ` +
    `If data are sparse or reactions are missing, say so under "Information gaps". ` +
    `Do not invent meals, scores, or symptoms. Use plain language; avoid markdown # headings; use short section titles in bold lines if helpful.\n\n` +
    `Structure your response with these sections (use these headings exactly):\n` +
    `Date range · N days\n` +
    `(State: ${input.dateRangeLabel}, N=${input.dayCount}.)\n\n` +
    `Eating pattern\n` +
    `GI and symptom trends\n` +
    `Energy and mood\n` +
    `Day-to-day changes\n` +
    `Information gaps\n\n` +
    `Patient first name for tone only: ${input.displayName}. Timezone for context: ${input.timezone}. ` +
    `Do not include a salutation or greeting line; start with the first section heading.\n\n` +
    `DATA JSON:\n${dataJson}`
  );
}

/**
 * Multi-day clinical digest via the same backends as {@link generateGeminiDailyArticle}.
 * Provider selection uses {@link resolvePeriodAiProvider} (`AI_PROVIDER_PERIOD` falls back to `AI_PROVIDER`).
 */
export async function generateGeminiPeriodArticle(
  input: PeriodArticleInput,
): Promise<GenerateGeminiPeriodArticleResult> {
  if (process.env.VERTEX_DISABLED === "true") {
    return {
      article: mockPeriodArticle(input),
      provider: "mock",
    };
  }

  const mode = resolvePeriodAiProvider();
  const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
  const project = process.env.VERTEX_PROJECT_ID ?? process.env.GOOGLE_CLOUD_PROJECT?.trim();

  if (mode === "studio" && !geminiApiKey) {
    throw new Error("AI_PROVIDER=studio requires GEMINI_API_KEY (Google AI Studio).");
  }
  if (mode === "vertex" && !project) {
    throw new Error("AI_PROVIDER=vertex requires VERTEX_PROJECT_ID or GOOGLE_CLOUD_PROJECT.");
  }

  const prompt = buildPeriodSummaryPrompt(input);

  const tryStudio = mode === "studio" || (mode === "auto" && Boolean(geminiApiKey));
  const tryVertex =
    mode === "vertex" || (mode === "auto" && Boolean(project) && !geminiApiKey);

  if (tryStudio && geminiApiKey) {
    const model =
      process.env.GEMINI_PERIOD_MODEL?.trim() ||
      process.env.GEMINI_MODEL?.trim() ||
      "gemini-2.5-flash";
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const text = response.text?.trim();
    if (!text) {
      throw new Error("Gemini API (Studio) returned empty text.");
    }
    return { article: text, provider: "studio" };
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

    const text = response.text?.trim();
    if (!text) {
      throw new Error("Vertex generateContent returned empty text.");
    }
    return { article: text, provider: "vertex" };
  }

  throw new Error(
    "No AI backend configured: set GEMINI_API_KEY (Google AI Studio), or Vertex project + GOOGLE_EXTERNAL_ACCOUNT_JSON / AWS Secrets Manager credential_json.",
  );
}
