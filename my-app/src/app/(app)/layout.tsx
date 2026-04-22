import { redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { getOrCreateAppUser } from "@/lib/user";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getOrCreateAppUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <AppNav />
      <div className="flex flex-1 flex-col">{children}</div>
    </>
  );
}
