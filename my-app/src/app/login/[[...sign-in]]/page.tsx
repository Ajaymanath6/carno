import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/**
 * Catch-all handles `/login`, `/login/sso-callback`, OAuth steps, etc. when using routing="path".
 */
export default async function SignInPage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/chat");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <SignIn
        routing="path"
        path="/login"
        signUpUrl="/register"
        appearance={{
          elements: {
            rootBox: "mx-auto",
          },
        }}
      />
    </main>
  );
}
