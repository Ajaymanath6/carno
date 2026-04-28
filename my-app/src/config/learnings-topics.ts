import type { ComponentType } from "react";
import type { IconProps } from "@phosphor-icons/react";
import { Drop, Egg, Heart, Leaf, Lightning, Question } from "@phosphor-icons/react";

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
