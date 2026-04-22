import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/chat");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <RegisterForm />
    </main>
  );
}
