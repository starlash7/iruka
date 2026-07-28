export type PullCardAsset = {
  imageUrl: string;
  title: string;
};

export const pullCardAssets = [
  { imageUrl: "/assets/pull-cards/card-01.jpg", title: "fromis_9 · Hayoung" },
  { imageUrl: "/assets/pull-cards/card-02.jpg", title: "fromis_9 · Jiwon" },
  { imageUrl: "/assets/pull-cards/card-03.jpg", title: "fromis_9 · Chaeyoung" },
  { imageUrl: "/assets/pull-cards/card-04.jpg", title: "fromis_9 · Nagyung" },
  { imageUrl: "/assets/pull-cards/card-05.jpg", title: "fromis_9 · Jiheon" },
  { imageUrl: "/assets/pull-cards/card-06.jpg", title: "KiiiKiii · Jiyu" },
  { imageUrl: "/assets/pull-cards/card-07.jpg", title: "KiiiKiii · Jiyu" },
  { imageUrl: "/assets/pull-cards/card-08.jpg", title: "KiiiKiii · Leesol" },
  { imageUrl: "/assets/pull-cards/card-09.jpg", title: "KiiiKiii · Leesol" },
  { imageUrl: "/assets/pull-cards/card-10.jpg", title: "KiiiKiii · Sui" },
  { imageUrl: "/assets/pull-cards/card-11.jpg", title: "KiiiKiii · Sui" },
  { imageUrl: "/assets/pull-cards/card-12.jpg", title: "KiiiKiii · Haum" },
  { imageUrl: "/assets/pull-cards/card-13.jpg", title: "KiiiKiii · Haum" },
  { imageUrl: "/assets/pull-cards/card-14.jpg", title: "KiiiKiii · Kya" },
  { imageUrl: "/assets/pull-cards/card-15.jpg", title: "KiiiKiii · Kya" },
  { imageUrl: "/assets/pull-cards/card-16.jpg", title: "BLACKPINK · Jisoo" },
  { imageUrl: "/assets/pull-cards/card-17.jpg", title: "BLACKPINK · Jisoo" },
  { imageUrl: "/assets/pull-cards/card-18.jpg", title: "BLACKPINK · Rose" },
  { imageUrl: "/assets/pull-cards/card-19.jpg", title: "BLACKPINK · Rose" },
  { imageUrl: "/assets/pull-cards/card-20.jpg", title: "BLACKPINK · Jennie" }
] as const satisfies readonly PullCardAsset[];

export function getPullCardAsset(index: number): PullCardAsset {
  if (!Number.isInteger(index) || index < 0) {
    throw new RangeError("Pull card asset index must be a non-negative integer");
  }

  return pullCardAssets[index % pullCardAssets.length];
}
