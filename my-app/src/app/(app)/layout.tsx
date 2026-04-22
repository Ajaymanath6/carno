import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <>
      <AppNav />
      <div className="flex flex-1 flex-col">{children}</div>
    </>
  );
}
