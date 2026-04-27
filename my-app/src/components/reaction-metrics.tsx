"use client";

import { BatteryFull, Brain, Drop, Heartbeat, Wind } from "@phosphor-icons/react";
import type { ReactionSnapshot } from "@/lib/reaction-summary";

export const REACTION_SLIDER_FIELDS = [
  { name: "energyLevel", label: "Energy", Icon: BatteryFull },
  { name: "bloating", label: "Bloating", Icon: Drop },
  { name: "gas", label: "Gas", Icon: Wind },
  { name: "stomachDiscomfort", label: "Stomach discomfort", Icon: Heartbeat },
  { name: "mood", label: "Mood", Icon: Brain },
] as const;

type MetricFieldName = (typeof REACTION_SLIDER_FIELDS)[number]["name"];

export function metricValue(snapshot: ReactionSnapshot, key: MetricFieldName): number | null {
  switch (key) {
    case "energyLevel":
      return snapshot.energyLevel;
    case "bloating":
      return snapshot.bloating;
    case "gas":
      return snapshot.gas;
    case "stomachDiscomfort":
      return snapshot.stomachDiscomfort;
    case "mood":
      return snapshot.mood;
    default:
      return null;
  }
}

export function scoreOrDash(n: number | null): string {
  return n != null ? `${n}/5` : "—";
}

export function ReactionMetricsTableRows({ reaction }: { reaction: ReactionSnapshot }) {
  return (
    <>
      {REACTION_SLIDER_FIELDS.map(({ name, label, Icon }) => (
        <tr key={name}>
          <th className="px-3 py-2 font-normal text-brandcolor-text-weak">
            <span className="inline-flex items-center gap-1.5">
              <Icon
                className="shrink-0 text-brandcolor-stroke-strong"
                size={16}
                weight="regular"
                aria-hidden
              />
              {label}
            </span>
          </th>
          <td className="px-3 py-2 font-medium">{scoreOrDash(metricValue(reaction, name))}</td>
        </tr>
      ))}
    </>
  );
}

export function ReactionMetricsGrid({ reaction }: { reaction: ReactionSnapshot }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {REACTION_SLIDER_FIELDS.map(({ name, label, Icon }) => (
        <span
          key={name}
          className="inline-flex flex-wrap items-center gap-1.5 text-brandcolor-text-strong"
        >
          <Icon
            className="shrink-0 text-brandcolor-stroke-strong"
            size={14}
            weight="regular"
            aria-hidden
          />
          <span className="text-brandcolor-text-weak">{label}</span>{" "}
          <span className="font-medium">{scoreOrDash(metricValue(reaction, name))}</span>
        </span>
      ))}
    </div>
  );
}
