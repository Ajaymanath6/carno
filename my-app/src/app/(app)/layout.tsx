import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AccountSetupError } from "@/components/AccountSetupError";
import { AppShell } from "@/components/AppShell";
import { getOrCreateAppUser } from "@/lib/user";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  const user = await getOrCreateAppUser();
  if (!user) {
    return <AccountSetupError />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <AppShell>{children}</AppShell>
    </div>
  );
}
