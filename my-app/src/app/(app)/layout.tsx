import { AppNav } from "@/components/AppNav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppNav />
      <div className="flex flex-1 flex-col">{children}</div>
    </>
  );
}
