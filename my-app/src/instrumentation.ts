/**
 * Runs once when the Node.js runtime starts (local `next start` and Vercel serverless init).
 * Logs clear hints if required env vars are missing — check Vercel → Settings → Environment Variables.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const required = ["AUTH_SECRET", "DATABASE_URL"] as const;
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      "[GutTrack] Missing environment variables:",
      missing.join(", "),
      "— Add them in Vercel (or .env locally). Production also needs NEXTAUTH_URL=https://your-domain",
    );
  }
}
