/** “Reverse …” badges plus stub article copy for non-featured conditions (editable). */

export type HealingConditionId =
  | "pcos"
  | "diabetes"
  | "fibromyalgia"
  | "migraines"
  | "hypertension"
  | "autoimmune"
  | "arthritis";

export type HealingConditionBadge = {
  id: HealingConditionId;
  label: string;
};

export const HEALING_CONDITION_BADGES: HealingConditionBadge[] = [
  { id: "pcos", label: "Reverse PCOS" },
  { id: "diabetes", label: "Reverse type 2 diabetes" },
  { id: "fibromyalgia", label: "Reverse fibromyalgia" },
  { id: "migraines", label: "Reverse migraines" },
  { id: "hypertension", label: "Reverse hypertension" },
  { id: "autoimmune", label: "Reverse autoimmune inflammation" },
  { id: "arthritis", label: "Reverse arthritis" },
];

export type HealingStubArticle = {
  userBubble: string;
  pageTitle: string;
  leadBubble: string;
  sections: { title: string; bullets: string[] }[];
};

export const HEALING_CONDITION_STUBS: Record<
  Exclude<HealingConditionId, "pcos">,
  HealingStubArticle
> = {
  diabetes: {
    userBubble: "How carnivore can improve type 2 diabetes markers",
    pageTitle: "Type 2 diabetes and lower insulin load",
    leadBubble:
      "Type 2 diabetes is fundamentally a story about insulin resistance and chronic glucose load. Animal-forward eating removes the biggest glucose spikes by default.",
    sections: [
      {
        title: "Mechanism",
        bullets: [
          "Less dietary carbohydrate means less insulin demand meal to meal.",
          "Stable protein and fat intake supports steady energy without the post-meal crashes that drive grazing.",
        ],
      },
      {
        title: "What people often notice",
        bullets: [
          "Fasting glucose and HbA1c trending down over months when other habits stay consistent.",
          "Medication needs may change—work with your clinician before adjusting prescriptions.",
        ],
      },
      {
        title: "Next step",
        bullets: [
          "Use chat to log how you feel week to week; pair numbers from labs with lived experience.",
        ],
      },
    ],
  },
  fibromyalgia: {
    userBubble: "How carnivore may calm fibromyalgia symptoms",
    pageTitle: "Fibromyalgia, pain signaling, and simpler food",
    leadBubble:
      "Widespread pain without a tidy lab label frustrates everyone. Reducing dietary noise—especially plants that do not sit well—helps some people quiet centralized sensitization.",
    sections: [
      {
        title: "Inflammation load",
        bullets: [
          "Seed oils, refined starch, and reactive plant compounds can keep immune chatter elevated.",
          "A minimalist carnivore plate removes entire categories of triggers in one step.",
        ],
      },
      {
        title: "Energy for repair",
        bullets: [
          "Adequate protein and fat supports sleep and tissue recovery better than chronic under-eating while carb cycling.",
        ],
      },
      {
        title: "Next step",
        bullets: [
          "Track pain scores alongside meals in chat so patterns surface faster.",
        ],
      },
    ],
  },
  migraines: {
    userBubble: "How carnivore may reduce migraines",
    pageTitle: "Migraines, hydration, and trigger removal",
    leadBubble:
      "Migraines are multifactorial. For some people, stabilizing blood sugar, electrolytes, and trigger foods matters more than any single supplement.",
    sections: [
      {
        title: "Common levers",
        bullets: [
          "Fewer glucose swings can mean fewer vascular swings for susceptible brains.",
          "Salt and electrolytes on carnivore need attention—especially early on.",
        ],
      },
      {
        title: "Trigger experiments",
        bullets: [
          "Tyramine-rich aged foods affect some migraineurs; a carnivore baseline simplifies reintroduction tests later.",
        ],
      },
      {
        title: "Next step",
        bullets: [
          "Note headache frequency in chat across your first month on-pattern.",
        ],
      },
    ],
  },
  hypertension: {
    userBubble: "How carnivore may support healthier blood pressure",
    pageTitle: "Blood pressure, insulin, and sodium clarity",
    leadBubble:
      "Blood pressure tracks with weight, sleep, stress, and insulin dynamics. A low-insulin pattern often pulls several levers at once.",
    sections: [
      {
        title: "Physiology",
        bullets: [
          "Lower insulin can improve vascular tone for people whose hypertension tracked with metabolic syndrome.",
          "Weight loss from appetite normalization reduces cardiac workload.",
        ],
      },
      {
        title: "Salt",
        bullets: [
          "Carnivore is not automatically low salt; many people need deliberate sodium and potassium.",
        ],
      },
      {
        title: "Next step",
        bullets: [
          "Share home BP readings alongside meals if you want tighter feedback loops with your care team.",
        ],
      },
    ],
  },
  autoimmune: {
    userBubble: "How carnivore may calm autoimmune symptoms",
    pageTitle: "Autoimmunity and a quieter immune baseline",
    leadBubble:
      "Autoimmune flares involve genetics, environment, and gut permeability stories we still map imperfectly. Removing hyper-processed and highly immunogenic plant proteins helps some people stabilize.",
    sections: [
      {
        title: "Why removal helps",
        bullets: [
          "Fewer novel proteins and lectins means fewer opportunities for confused immune signaling.",
          "Animal proteins are familiar to human digestion in ways many plant mixes are not.",
        ],
      },
      {
        title: "Expectations",
        bullets: [
          "Remission language belongs to you and your rheumatologist; nutrition is one layer of care.",
        ],
      },
      {
        title: "Next step",
        bullets: [
          "Document flare frequency and joint pain in chat while you hold the protocol steady for several weeks.",
        ],
      },
    ],
  },
  arthritis: {
    userBubble: "How carnivore may ease arthritis symptoms",
    pageTitle: "Joints, inflammation, and a simpler plate",
    leadBubble:
      "Osteoarthritis and inflammatory arthropathies both worsen when chronic inflammation and extra weight stack up. A meat-forward, plant-light pattern removes common dietary triggers and often improves sleep and pain scores before imaging budges.",
    sections: [
      {
        title: "Mechanism",
        bullets: [
          "Seed oils and refined starch promote oxidative stress and insulin swings that sensitize pain pathways.",
          "Lectins and nightshades bother some people consistently; an elimination phase clarifies your personal map.",
        ],
      },
      {
        title: "What shifts first",
        bullets: [
          "Morning stiffness and puffiness often soften within weeks when inflammatory noise drops.",
          "Weight trends down without hunger games because protein and fat satiate.",
        ],
      },
      {
        title: "Next step",
        bullets: [
          "Track grip strength, stairs, and flare days in chat alongside meals so you see trends, not single moments.",
        ],
      },
    ],
  },
};
