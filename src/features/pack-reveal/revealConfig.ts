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
  valueLabel?: string;
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
    accent: "#12B76A",
    bloom: false,
    duration: 3,
    foil: "#A6F4C5",
    name: "Rare",
    phaseEvents: [
      { at: 0, phase: "blackout" },
      { at: 0.38, phase: "shake" },
      { at: 0.95, phase: "tear" },
      { at: 1.35, phase: "teaser" },
      { at: 1.9, phase: "lift" },
      { at: 2.55, phase: "stamp" }
    ],
    spotlight: "#32D583"
  },
  epic: {
    accent: "#F04438",
    bloom: false,
    duration: 3,
    foil: "#FDA29B",
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
    accent: "#F5C842",
    bloom: true,
    duration: 4.5,
    foil: "#FFE99A",
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
    spotlight: "#FFD84D"
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
