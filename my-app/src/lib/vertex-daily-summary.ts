import { GoogleGenAI } from "@google/genai/node";
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import type { DailySummaryPayload } from "@/lib/summary";

/**
 * Loads external-account / WIF JSON for Vertex (same shape as Python `Credentials.from_info`).
 * Priority:
 * 1. `GOOGLE_EXTERNAL_ACCOUNT_JSON` — full JSON string (Vercel-friendly).
 * 2. AWS Secrets Manager: `VERTEX_CREDENTIAL_SECRET_ID` + default AWS credential chain (env or profile).
 *    Expects `SecretString` either as `{ "credential_json": "<stringified inner json>" }` or inner fields.
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

function mockArticle(input: { payload: DailySummaryPayload; greetingLine: string }): string {
  const nFood = input.payload.foods.length;
  const nRx = input.payload.reactions.length;
  return (
    `${input.greetingLine} — here's a quick snapshot: you logged ${nFood} meal(s) and ${nRx} check-in(s) today. ` +
    `(VERTEX_DISABLED=true — replace with real Vertex output in production.)`
  );
}

export async function generateVertexDailyArticle(input: {
  payload: DailySummaryPayload;
  greetingLine: string;
  timezone: string;
  displayName: string;
  /** Optional end-of-day reflection from the user (manual close). */
  dayOverallSurvey?: string | null;
}): Promise<string> {
  if (process.env.VERTEX_DISABLED === "true") {
    return mockArticle(input);
  }

  const project = process.env.VERTEX_PROJECT_ID ?? process.env.GOOGLE_CLOUD_PROJECT;
  const location = process.env.VERTEX_LOCATION ?? "us-central1";
  const model = process.env.VERTEX_GEMINI_MODEL ?? "gemini-2.0-flash-001";

  if (!project) {
    throw new Error("VERTEX_PROJECT_ID or GOOGLE_CLOUD_PROJECT is required for Vertex.");
  }

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

  const dataJson = JSON.stringify(input.payload);
  const surveyNote =
    input.dayOverallSurvey?.trim() ?
      `\n\nUser's own closing reflection (honor if consistent with data):\n"${input.dayOverallSurvey.trim()}"`
    : "";
  const prompt =
    `You are a concise gut-health diary coach. Write a short article (under 200 words) summarizing what this person ate today ` +
    `and how they reported feeling (energy, digestion, mood) based ONLY on the JSON below. ` +
    `Do not invent meals or scores. Use plain sentences; no markdown # headings. ` +
    `Timezone: ${input.timezone}. Their first name for tone: ${input.displayName}. ` +
    `Optional opening: you may start with a phrase in the spirit of: "${input.greetingLine}" then continue with the summary.` +
    surveyNote +
    `\n\nDATA JSON:\n${dataJson}`;

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const text = response.text?.trim();
  if (!text) {
    throw new Error("Vertex generateContent returned empty text.");
  }
  return text;
}
