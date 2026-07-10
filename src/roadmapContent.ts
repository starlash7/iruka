export type RoadmapContent = {
  heading: [string, string];
  phases: string[];
};

export const roadmapContent: Record<"en" | "ko", RoadmapContent> = {
  en: {
    heading: ["EVERY DROP", "BUILDS THE IRUKA UNIVERSE"],
    phases: [
      "IRUKA VENDING",
      "LICENSED IP DROPS",
      "CREATOR PLAYGROUND",
      "THE IRUKA UNIVERSE"
    ]
  },
  ko: {
    heading: ["모든 드롭이", "이루카 유니버스를 만들어요"],
    phases: [
      "이루카 벤딩",
      "라이선스 IP 드롭",
      "크리에이터 플레이그라운드",
      "이루카 유니버스"
    ]
  }
};
