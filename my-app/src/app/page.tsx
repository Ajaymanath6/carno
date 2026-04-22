import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  try {
    const { userId } = await auth();
    if (userId) {
      redirect("/chat");
    }
  } catch {
    // Clerk/session not ready or misconfigured — still send user to sign-in
  }
  redirect("/login");
}
