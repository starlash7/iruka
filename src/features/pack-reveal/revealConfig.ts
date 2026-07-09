export type IrukaRarity = "common" | "rare" | "epic" | "legendary" | "iruka";

export type RevealPhase =
  | "blackout"
  | "shake"
  | "tear"
  | "teaser"
  | "crowd"
  | "lift"
  | "orbit"
  | "stamp";

export type RevealCard = {
  estimatedValue: number;
  imageUrl: string;
  name: string;
  rarity: IrukaRarity;
  serial?: string;
};

type PhaseEvent = {
  at: number;
  phase: RevealPhase;
};

export type RevealConfig = {
  accent: string;
  bloom: boolean;
  duration: number;
  foil: string;
  name: string;
  phaseEvents: PhaseEvent[];
  spotlight: string;
};

export const revealConfigs: Record<IrukaRarity, RevealConfig> = {
  common: {
    accent: "#98A2B3",
    bloom: false,
    duration: 1.5,
    foil: "#E6EEF8",
    name: "Common",
    phaseEvents: [
      { at: 0, phase: "blackout" },
      { at: 0.35, phase: "teaser" },
      { at: 0.75, phase: "lift" },
      { at: 1.12, phase: "stamp" }
    ],
    spotlight: "#F8FBFF"
  },
  rare: {
    accent: "#4F9DFF",
    bloom: false,
    duration: 3,
    foil: "#B8D9FF",
    name: "Rare",
    phaseEvents: [
      { at: 0, phase: "blackout" },
      { at: 0.38, phase: "shake" },
      { at: 0.95, phase: "tear" },
      { at: 1.35, phase: "teaser" },
      { at: 1.9, phase: "lift" },
      { at: 2.55, phase: "stamp" }
    ],
    spotlight: "#8B5CF6"
  },
  epic: {
    accent: "#8B5CF6",
    bloom: false,
    duration: 3,
    foil: "#FFC0DF",
    name: "Epic",
    phaseEvents: [
      { at: 0, phase: "blackout" },
      { at: 0.36, phase: "shake" },
      { at: 0.9, phase: "tear" },
      { at: 1.25, phase: "teaser" },
      { at: 1.82, phase: "lift" },
      { at: 2.48, phase: "stamp" }
    ],
    spotlight: "#F04438"
  },
  legendary: {
    accent: "#FF73B7",
    bloom: true,
    duration: 4.5,
    foil: "#F79009",
    name: "Legendary",
    phaseEvents: [
      { at: 0, phase: "blackout" },
      { at: 0.5, phase: "shake" },
      { at: 1.2, phase: "tear" },
      { at: 1.8, phase: "teaser" },
      { at: 2.6, phase: "crowd" },
      { at: 3, phase: "lift" },
      { at: 4, phase: "orbit" },
      { at: 4.35, phase: "stamp" }
    ],
    spotlight: "#F79009"
  },
  iruka: {
    accent: "#6F8DFF",
    bloom: true,
    duration: 4.5,
    foil: "#20C7DF",
    name: "Iruka",
    phaseEvents: [
      { at: 0, phase: "blackout" },
      { at: 0.5, phase: "shake" },
      { at: 1.2, phase: "tear" },
      { at: 1.8, phase: "teaser" },
      { at: 2.6, phase: "crowd" },
      { at: 3, phase: "lift" },
      { at: 4, phase: "orbit" },
      { at: 4.35, phase: "stamp" }
    ],
    spotlight: "#20C7DF"
  }
};

export function getRevealConfig(rarity: IrukaRarity) {
  return revealConfigs[rarity];
}
