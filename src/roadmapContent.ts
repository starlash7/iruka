export type RoadmapContent = {
  heading: string;
  phases: string[];
  supporting: [string, string];
};

export const roadmapContent: Record<"en" | "ko", RoadmapContent> = {
  en: {
    heading: "FANS MEET CREATORS",
    phases: [
      "IRUKA VENDING",
      "LICENSED IP DROPS",
      "CREATOR PLAYGROUND",
      "THE IRUKA UNIVERSE"
    ],
    supporting: [
      "Bold ideas grow when creators meet the fans who believe in them.",
      "We're building a shared world where creators launch what's next and fans discover, collect, and help it grow."
    ]
  },
  ko: {
    heading: "팬과 크리에이터의 만남",
    phases: [
      "이루카 벤딩",
      "라이선스 IP 드롭",
      "크리에이터 플레이그라운드",
      "이루카 유니버스"
    ],
    supporting: [
      "큰 아이디어는 믿어 주는 팬을 만날 때 자라납니다.",
      "크리에이터가 다음을 만들고 팬이 발견하고 모으며 함께 키우는 세계를 만들고 있어요."
    ]
  }
};
