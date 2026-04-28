import type { ComponentType } from "react";
import type { IconProps } from "@phosphor-icons/react";
import {
  Drop,
  Egg,
  Flask,
  Heart,
  Leaf,
  Lightning,
  Question,
  WarningCircle,
} from "@phosphor-icons/react";

export type LearningTopic = {
  id: string;
  question: string;
  Icon: ComponentType<IconProps>;
};

/** Carnivore education shortcuts; copy lives in one place for the Learnings screen. */
export const LEARNINGS_TOPICS: LearningTopic[] = [
  {
    id: "why-carnivores",
    question: "Why are we carnivores?",
    Icon: Question,
  },
  {
    id: "fat-good",
    question: "Why is fat good? How much should you have?",
    Icon: Drop,
  },
  {
    id: "plants",
    question: "Why plants aren't always your friend",
    Icon: Leaf,
  },
  {
    id: "cholesterol",
    question: "Why cholesterol isn't the villain",
    Icon: Heart,
  },
  {
    id: "protein",
    question: "How much protein do I need?",
    Icon: Egg,
  },
  {
    id: "electrolytes",
    question: "What about salt and electrolytes?",
    Icon: Lightning,
  },
];

/** Extra Learnings chip (hormones / EDCs). Kept separate so `LEARNINGS_TOPICS` stays six core ids elsewhere. */
export const LEARNINGS_HORMONES_TOPIC: LearningTopic = {
  id: "worst-hormones",
  question: "Worst thing for hormones",
  Icon: Flask,
};

export const LEARNINGS_CARNIVORE_MISTAKES_TOPIC: LearningTopic = {
  id: "carnivore-mistakes",
  question: "Carnivore mistakes",
  Icon: WarningCircle,
};

/** All chips on the Learnings hub (six core + hormones + carnivore mistakes). */
export const LEARNINGS_ALL_CHIPS: LearningTopic[] = [
  ...LEARNINGS_TOPICS,
  LEARNINGS_HORMONES_TOPIC,
  LEARNINGS_CARNIVORE_MISTAKES_TOPIC,
];
