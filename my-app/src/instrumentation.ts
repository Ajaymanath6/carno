/**
 * Runs once when the Node.js runtime starts (local `next start` and Vercel serverless init).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const required = [
    "DATABASE_URL",
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "CLERK_SECRET_KEY",
  ] as const;
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      "[GutTrack] Missing environment variables:",
      missing.join(", "),
      "— Add Clerk keys + DATABASE_URL in Vercel (see .env.example).",
    );
  }
}
