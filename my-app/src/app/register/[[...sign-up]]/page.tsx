import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/**
 * Catch-all handles `/register` and nested Clerk sign-up flows when using routing="path".
 */
export default async function SignUpPage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/chat");
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto bg-brandcolor-fill px-4 py-16">
      <SignUp
        routing="path"
        path="/register"
        signInUrl="/login"
        fallbackRedirectUrl="/chat"
        signInFallbackRedirectUrl="/chat"
        appearance={{
          elements: {
            rootBox: "mx-auto",
          },
        }}
      />
    </main>
  );
}
