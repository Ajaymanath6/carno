import { ChartBar, ChatCircle, Sun } from "@phosphor-icons/react";

export const APP_NAV_ITEMS = [
  { href: "/chat", label: "Today", Icon: Sun },
  { href: "/history", label: "Chats", Icon: ChatCircle },
  { href: "/reports", label: "Reports", Icon: ChartBar },
] as const;

export type AppNavIcon = (typeof APP_NAV_ITEMS)[number]["Icon"];
