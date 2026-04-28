/** Deep-dive copy for the “Why are we carnivores?” topic — Carno voice, no timestamps or lecturer attribution. */

export type WhyCarnivoresSection = {
  id: string;
  label: string;
  bullets: string[];
};

export const WHY_CARNIVORES_SECTIONS: WhyCarnivoresSection[] = [
  {
    id: "biologically",
    label: "Biologically",
    bullets: [
      "Human stomach acid is very strong (around pH 1.4–1.5), in line with scavengers and carnivores — useful when food carries a heavier microbial load.",
      "Fat digestion pulls together the stomach, liver, gallbladder, pancreas, and small intestine so fat can be broken down and absorbed efficiently — fat is treated as a central fuel, not an afterthought.",
      "We don’t host the fermentation hardware herbivores use on fiber; extracting calories from tough plant bulk isn’t something human physiology prioritizes.",
    ],
  },
  {
    id: "anatomically",
    label: "Anatomically",
    bullets: [
      "Teeth are relatively small and lack the broad, flat grinding surfaces seen in animals built to pulverize fibrous plants all day.",
      "Jaw and dental design line up with shearing and tearing dense, soft animal foods more than with high-fiber roughage.",
      "The shoulder girdle allows a strong, rotating throw — a pattern often linked to hunting and tool use at a distance.",
      "The same low stomach acidity and multi-organ fat pathway show up as structural “bets” on animal-sourced meals with high energy and high bacteria risk.",
    ],
  },
  {
    id: "evolutionarily",
    label: "Evolutionarily",
    bullets: [
      "Hominin lines that leaned on meat and fat faced selection for larger brains, planning, and tool use to outcompete faster, stronger prey.",
      "Colder, drier periods reduced reliable plant calories; groups that thrived on animal-sourced food had a survival edge when plants thinned out.",
      "Stable isotope work on early humans and Neanderthals often places them at a very high trophic level — heavy animal-sourcing for long stretches of prehistory.",
      "Plants deploy chemical defenses (e.g. protease inhibitors, cyanogenic compounds, nightshades). Humans lack the long co-evolution with many of these that dedicated herbivores have.",
    ],
  },
  {
    id: "anthropologically",
    label: "Anthropologically",
    bullets: [
      "Plains hunting cultures organized bison and other game for reliable meat and fat, supporting large, mobile groups.",
      "Steppe empires could run on animal foods, dairy, and blood for long campaigns with little crop agriculture.",
      "Arctic and subarctic peoples have lived for generations with little to no plant food, drawing almost everything from land and sea animals.",
      "Ancient writers sometimes contrasted grain-eating “civilized” diets with meat-forward populations — a window into how different groups saw food and vitality.",
    ],
  },
  {
    id: "metabolically",
    label: "Metabolically",
    bullets: [
      "The fasted or low-glycemic state is a normal part of how humans mobilize fat; constant carb snacking is a modern pattern, not a requirement of the machinery.",
      "Insulin rises with carbohydrates; high insulin signaling can favor storage and downshift fat release and protein turnover relative to a lower-insulin, fat-forward pattern.",
      "Protein and fat can support stable energy and glucose needs through gluconeogenesis and ketone production without the same insulin swings as high, frequent carbohydrate loads.",
    ],
  },
];
