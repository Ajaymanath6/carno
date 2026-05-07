import { GoogleGenAI } from "@google/genai/node";
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import type { DailySummaryPayload } from "@/lib/summary";
import { stripDuplicateGreetingPrefix } from "@/lib/strip-duplicate-greeting";

export type GeminiDailyArticleProvider = "mock" | "studio" | "vertex";

export type GenerateGeminiDailyArticleResult = {
  article: string;
  provider: GeminiDailyArticleProvider;
};

export type ArticleInput = {
  payload: DailySummaryPayload;
  greetingLine: string;
  timezone: string;
  displayName: string;
  dayOverallSurvey?: string | null;
  /** Mid-day snapshot; user may log more meals before end-of-day summary. */
  preview?: boolean;
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
  const previewNote = input.preview ?
    `\n\nThis is a mid-day snapshot: the user may log more meals or check-ins later today. ` +
      `Summarize only what appears in the JSON; note explicitly if the day may still be incomplete.`
  : "";
  return (
    `You are a concise gut-health diary coach. Write a short article (under 200 words) summarizing what this person ate today ` +
    `and how they reported feeling (energy, digestion, mood) based ONLY on the JSON below. ` +
    `Do not invent meals or scores. Use plain sentences; no markdown # headings. ` +
    `Timezone: ${input.timezone}. Their first name for tone: ${input.displayName}. ` +
    `Do NOT repeat or restate this salutation in your article (the app shows it separately): "${input.greetingLine}". ` +
    `Start directly with substantive sentences about their meals and symptoms.` +
    previewNote +
    surveyNote +
    `\n\nDATA JSON:\n${dataJson}`
  );
}

function mockArticle(input: { payload: DailySummaryPayload }): string {
  const nFood = input.payload.foods.length;
  const nRx = input.payload.reactions.length;
  return (
    `Here's a quick snapshot: you logged ${nFood} meal(s) and ${nRx} check-in(s) today. ` +
    `(VERTEX_DISABLED=true — unset it and configure Vertex, or use AI_PROVIDER=studio + GEMINI_API_KEY.)`
  );
}

/** Global default for daily summaries and any caller that does not override (see `AI_PROVIDER_PERIOD`). */
export function resolveAiProvider(): "auto" | "studio" | "vertex" {
  const raw = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (raw === "studio" || raw === "vertex") {
    return raw;
  }
  return "auto";
}

/** Resolved GCP project id for Vertex (either env name). */
export function resolveVertexProjectId(): string | undefined {
  const p = process.env.VERTEX_PROJECT_ID ?? process.env.GOOGLE_CLOUD_PROJECT;
  const t = p?.trim();
  return t || undefined;
}

/**
 * Google AI Studio (`GEMINI_API_KEY`) is used only when `AI_PROVIDER=studio`.
 * With `auto`, the key may remain in `.env` but is ignored for routing.
 */
export function aiRoutingUsesStudio(mode: ReturnType<typeof resolveAiProvider>): boolean {
  return mode === "studio";
}

/** Vertex when `AI_PROVIDER=vertex` or `auto` and a GCP project id is set. */
export function aiRoutingUsesVertex(mode: ReturnType<typeof resolveAiProvider>): boolean {
  const project = resolveVertexProjectId();
  if (!project) return false;
  return mode === "vertex" || mode === "auto";
}

/** Inline WIF JSON string or Secrets Manager secret id is present (paths this app supports). */
export function vertexWorkloadCredentialEnvConfigured(): boolean {
  return (
    Boolean(process.env.GOOGLE_EXTERNAL_ACCOUNT_JSON?.trim()) ||
    Boolean(process.env.VERTEX_CREDENTIAL_SECRET_ID?.trim())
  );
}

/**
 * When `GOOGLE_EXTERNAL_ACCOUNT_JSON` is non-empty but not valid JSON (common `.env` quoting mistake).
 */
export function vertexInlineCredentialJsonInvalidReason(): string | null {
  const raw = process.env.GOOGLE_EXTERNAL_ACCOUNT_JSON?.trim();
  if (!raw) return null;
  try {
    JSON.parse(raw);
    return null;
  } catch {
    return (
      "GOOGLE_EXTERNAL_ACCOUNT_JSON is set but is not valid JSON — fix escaping/quoting in .env " +
      "(use a single-line JSON string or escape inner quotes)."
    );
  }
}

/**
 * After confirming Vertex project id exists: validates credential env for auto/vertex routing.
 */
export function vertexCredentialBlockingReasonAfterProjectSet(): string | null {
  const badJson = vertexInlineCredentialJsonInvalidReason();
  if (badJson) return badJson;
  if (!vertexWorkloadCredentialEnvConfigured()) {
    return (
      "Vertex project id is set but workload credentials are missing: set GOOGLE_EXTERNAL_ACCOUNT_JSON " +
      "(WIF JSON from GCP) or VERTEX_CREDENTIAL_SECRET_ID (+ AWS credentials for Secrets Manager)."
    );
  }
  return null;
}

/**
 * Generates the daily summary article using **one** backend:
 *
 * 1. `VERTEX_DISABLED=true` → mock text (no API calls).
 * 2. `AI_PROVIDER=studio` + `GEMINI_API_KEY` → Google AI Studio (Developer API).
 * 3. `AI_PROVIDER=vertex` or `AI_PROVIDER=auto` + Vertex project + credentials → Vertex AI.
 *
 * When `AI_PROVIDER=auto`, calls go to **Vertex only**; `GEMINI_API_KEY` is not used (set `AI_PROVIDER=studio` to use it).
 */
export async function generateGeminiDailyArticle(input: ArticleInput): Promise<GenerateGeminiDailyArticleResult> {
  if (process.env.VERTEX_DISABLED === "true") {
    return {
      article: mockArticle({ payload: input.payload }),
      provider: "mock",
    };
  }

  const mode = resolveAiProvider();
  const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
  const project = resolveVertexProjectId();

  if (mode === "studio" && !geminiApiKey) {
    throw new Error("AI_PROVIDER=studio requires GEMINI_API_KEY (Google AI Studio).");
  }
  if (mode === "vertex" && !project) {
    throw new Error("AI_PROVIDER=vertex requires VERTEX_PROJECT_ID or GOOGLE_CLOUD_PROJECT.");
  }
  if (mode === "auto" && !project) {
    throw new Error(
      "AI_PROVIDER=auto uses Vertex only. Set VERTEX_PROJECT_ID or GOOGLE_CLOUD_PROJECT plus credentials (GEMINI_API_KEY is ignored unless AI_PROVIDER=studio).",
    );
  }

  if ((mode === "auto" || mode === "vertex") && project) {
    const credErr = vertexCredentialBlockingReasonAfterProjectSet();
    if (credErr) {
      throw new Error(credErr);
    }
  }

  const prompt = buildDailySummaryPrompt(input);

  const tryStudio = aiRoutingUsesStudio(mode) && Boolean(geminiApiKey);
  const tryVertex = aiRoutingUsesVertex(mode);

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
    const article = stripDuplicateGreetingPrefix(input.greetingLine, text);
    return { article, provider: "studio" };
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
    const article = stripDuplicateGreetingPrefix(input.greetingLine, text);
    return { article, provider: "vertex" };
  }

  throw new Error(
    "No AI backend configured for this AI_PROVIDER: use Vertex (project + GOOGLE_EXTERNAL_ACCOUNT_JSON or VERTEX_CREDENTIAL_SECRET_ID), or set AI_PROVIDER=studio with GEMINI_API_KEY.",
  );
}

/** @deprecated Use {@link generateGeminiDailyArticle}; kept for imports that only need the text. */
export async function generateVertexDailyArticle(input: ArticleInput): Promise<string> {
  const { article } = await generateGeminiDailyArticle(input);
  return article;
}
