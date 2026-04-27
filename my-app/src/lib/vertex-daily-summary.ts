import { GoogleGenAI } from "@google/genai/node";
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import type { DailySummaryPayload } from "@/lib/summary";

export type GeminiDailyArticleProvider = "mock" | "studio" | "vertex";

export type GenerateGeminiDailyArticleResult = {
  article: string;
  provider: GeminiDailyArticleProvider;
};

type ArticleInput = {
  payload: DailySummaryPayload;
  greetingLine: string;
  timezone: string;
  displayName: string;
  dayOverallSurvey?: string | null;
};

/**
 * Loads external-account / WIF JSON for Vertex (same shape as Python `Credentials.from_info`).
 * Priority:
 * 1. `GOOGLE_EXTERNAL_ACCOUNT_JSON` — full JSON string (Vercel-friendly).
 * 2. AWS Secrets Manager: `VERTEX_CREDENTIAL_SECRET_ID` + default AWS credential chain (env or profile).
 */
export async function loadGoogleExternalAccountCredentialJson(): Promise<Record<string, unknown>> {
  const rawEnv = process.env.GOOGLE_EXTERNAL_ACCOUNT_JSON?.trim();
  if (rawEnv) {
    return JSON.parse(rawEnv) as Record<string, unknown>;
  }

  const secretId = process.env.VERTEX_CREDENTIAL_SECRET_ID?.trim();
  if (!secretId) {
    throw new Error(
      "Set GOOGLE_EXTERNAL_ACCOUNT_JSON or VERTEX_CREDENTIAL_SECRET_ID (plus AWS credentials for Secrets Manager).",
    );
  }

  const region = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? "us-east-1";
  const client = new SecretsManagerClient({ region });
  const out = await client.send(new GetSecretValueCommand({ SecretId: secretId }));
  const top = JSON.parse(out.SecretString ?? "{}") as Record<string, unknown>;
  const embedded = top.credential_json;
  if (typeof embedded === "string") {
    return JSON.parse(embedded) as Record<string, unknown>;
  }
  if (embedded && typeof embedded === "object" && !Array.isArray(embedded)) {
    return embedded as Record<string, unknown>;
  }
  throw new Error(
    "Secrets Manager value must include credential_json (string or object), matching the Python helper shape.",
  );
}

function buildDailySummaryPrompt(input: ArticleInput): string {
  const dataJson = JSON.stringify(input.payload);
  const surveyNote =
    input.dayOverallSurvey?.trim() ?
      `\n\nUser's own closing reflection (honor if consistent with data):\n"${input.dayOverallSurvey.trim()}"`
    : "";
  return (
    `You are a concise gut-health diary coach. Write a short article (under 200 words) summarizing what this person ate today ` +
    `and how they reported feeling (energy, digestion, mood) based ONLY on the JSON below. ` +
    `Do not invent meals or scores. Use plain sentences; no markdown # headings. ` +
    `Timezone: ${input.timezone}. Their first name for tone: ${input.displayName}. ` +
    `Optional opening: you may start with a phrase in the spirit of: "${input.greetingLine}" then continue with the summary.` +
    surveyNote +
    `\n\nDATA JSON:\n${dataJson}`
  );
}

function mockArticle(input: { payload: DailySummaryPayload; greetingLine: string }): string {
  const nFood = input.payload.foods.length;
  const nRx = input.payload.reactions.length;
  return (
    `${input.greetingLine} — here's a quick snapshot: you logged ${nFood} meal(s) and ${nRx} check-in(s) today. ` +
    `(VERTEX_DISABLED=true — enable Gemini API key or Vertex for live output.)`
  );
}

function resolveAiProvider(): "auto" | "studio" | "vertex" {
  const raw = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (raw === "studio" || raw === "vertex") {
    return raw;
  }
  return "auto";
}

/**
 * Generates the daily summary article using **one** backend:
 *
 * 1. `VERTEX_DISABLED=true` → mock text (no API calls).
 * 2. `AI_PROVIDER=studio` or (`auto` + `GEMINI_API_KEY`) → Google AI Studio (Gemini Developer API).
 * 3. `AI_PROVIDER=vertex` or (`auto` + Vertex env + credentials) → Vertex AI.
 *
 * Precedence when `AI_PROVIDER=auto`: Studio API key wins over Vertex if both are configured.
 */
export async function generateGeminiDailyArticle(input: ArticleInput): Promise<GenerateGeminiDailyArticleResult> {
  if (process.env.VERTEX_DISABLED === "true") {
    return {
      article: mockArticle(input),
      provider: "mock",
    };
  }

  const mode = resolveAiProvider();
  const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
  const project = process.env.VERTEX_PROJECT_ID ?? process.env.GOOGLE_CLOUD_PROJECT?.trim();

  if (mode === "studio" && !geminiApiKey) {
    throw new Error("AI_PROVIDER=studio requires GEMINI_API_KEY (Google AI Studio).");
  }
  if (mode === "vertex" && !project) {
    throw new Error("AI_PROVIDER=vertex requires VERTEX_PROJECT_ID or GOOGLE_CLOUD_PROJECT.");
  }

  const prompt = buildDailySummaryPrompt(input);

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

/** @deprecated Use {@link generateGeminiDailyArticle}; kept for imports that only need the text. */
export async function generateVertexDailyArticle(input: ArticleInput): Promise<string> {
  const { article } = await generateGeminiDailyArticle(input);
  return article;
}
