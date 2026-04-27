import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-dm-serif-display",
  subsets: ["latin"],
  weight: "400",
  fallback: ["Georgia", "ui-serif", "serif"],
});

export const metadata: Metadata = {
  title: "Carno — track what fuels you",
  description:
    "A gut health diary for carnivore-style eating: log meals, timed check-ins, and how you feel — direct, no fluff.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${dmSerifDisplay.variable} h-full antialiased`}
    >
      <body className="flex h-screen flex-col overflow-hidden bg-brandcolor-fill text-brandcolor-text-strong">
        <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/login">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
        </ClerkProvider>
      </body>
    </html>
  );
}
