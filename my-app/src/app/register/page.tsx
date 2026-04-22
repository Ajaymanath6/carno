import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function RegisterPage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/chat");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <SignUp
        routing="path"
        path="/register"
        signInUrl="/login"
        appearance={{
          elements: {
            rootBox: "mx-auto",
          },
        }}
      />
    </main>
  );
}
