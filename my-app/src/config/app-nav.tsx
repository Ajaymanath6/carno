import { ChartBar, ChatCircle, ClockCounterClockwise } from "@phosphor-icons/react";

export const APP_NAV_ITEMS = [
  { href: "/chat", label: "Chats", Icon: ChatCircle },
  { href: "/history", label: "History", Icon: ClockCounterClockwise },
  { href: "/reports", label: "Reports", Icon: ChartBar },
] as const;

export type AppNavIcon = (typeof APP_NAV_ITEMS)[number]["Icon"];
