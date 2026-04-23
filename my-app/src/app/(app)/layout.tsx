import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AccountSetupError } from "@/components/AccountSetupError";
import { AppNav } from "@/components/AppNav";
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
    <>
      <AppNav />
      <div className="flex flex-1 flex-col">{children}</div>
    </>
  );
}
