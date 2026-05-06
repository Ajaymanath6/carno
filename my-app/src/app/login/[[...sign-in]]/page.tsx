import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { LoginLandingShell } from "@/components/login/LoginLandingShell";

/**
 * Catch-all handles `/login`, `/login/sso-callback`, OAuth steps, etc. when using routing="path".
 */
export default async function SignInPage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/chat");
  }

  const faqs = [
    {
      q: "How do I get access to Carno?",
      a: "Tap Get access to sign in. New here? Use Create account.",
    },
    {
      q: "Do I have to log every detail?",
      a: "No. Short meal lines are enough; add reaction check-ins when you want.",
    },
    {
      q: "What’s included in the summaries?",
      a: "Daily: meals and reactions for one day. Period summary: multiple days in one clinician-friendly digest.",
    },
    {
      q: "Is this medical advice?",
      a: "No—personal tracking to support talks with your clinician or dietitian.",
    },
    {
      q: "Who can see my logs?",
      a: "You. Share summaries only when you choose.",
    },
  ] as const;

  return <LoginLandingShell faqs={[...faqs]} />;
}
