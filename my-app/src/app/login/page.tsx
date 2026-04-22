import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/chat");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <LoginForm />
    </main>
  );
}
