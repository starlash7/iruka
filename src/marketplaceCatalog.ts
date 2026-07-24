import type { MarketplaceCardType, MarketplaceCondition } from "./marketplaceData";
import type { Rarity } from "./vendingTypes";

export type MarketplaceCardSeed = {
  cardType: MarketplaceCardType;
  condition: MarketplaceCondition;
  group: string;
  id: string;
  imageFile: string;
  member: string;
  price: number;
  rarity: Rarity;
  release: string;
};

export const marketplaceCardSeeds: MarketplaceCardSeed[] = [
  { id: "le-sserafim-kazuha-vita500-zero", imageFile: "le-sserafim-kazuha-vita500-zero.jpg", group: "LE SSERAFIM", member: "Kazuha", release: "Vita500 Zero", cardType: "Event", rarity: "Common", condition: "Ungraded", price: 18 },
  { id: "ive-rei-accendio", imageFile: "ive-rei-accendio.jpg", group: "IVE", member: "Rei", release: "Accendio", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 22 },
  { id: "ive-wonyoung-puma", imageFile: "ive-wonyoung-puma.jpg", group: "IVE", member: "Wonyoung", release: "PUMA", cardType: "Event", rarity: "Common", condition: "Ungraded", price: 29 },
  { id: "ive-wonyoung-amuse", imageFile: "ive-wonyoung-amuse.jpg", group: "IVE", member: "Wonyoung", release: "Amuse", cardType: "Event", rarity: "Common", condition: "Ungraded", price: 32 },
  { id: "rescene-woni-pretty-girl", imageFile: "rescene-woni-pretty-girl.jpg", group: "RESCENE", member: "Woni", release: "Pretty Girl", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 15 },
  { id: "rescene-woni-pluschat", imageFile: "rescene-woni-pluschat.jpg", group: "RESCENE", member: "Woni", release: "Pluschat", cardType: "Event", rarity: "Common", condition: "Ungraded", price: 17 },
  { id: "rescene-woni-makestar-pob", imageFile: "rescene-woni-makestar-pob.jpg", group: "RESCENE", member: "Woni", release: "MAKESTAR POB", cardType: "POB", rarity: "Common", condition: "Ungraded", price: 20 },
  { id: "rescene-minami-pretty-girl", imageFile: "rescene-minami-pretty-girl.jpg", group: "RESCENE", member: "Minami", release: "Pretty Girl", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 15 },
  { id: "rescene-zena-pretty-girl", imageFile: "rescene-zena-pretty-girl.jpg", group: "RESCENE", member: "Zena", release: "Pretty Girl", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 15 },
  { id: "rescene-may-pretty-girl", imageFile: "rescene-may-pretty-girl.jpg", group: "RESCENE", member: "May", release: "Pretty Girl", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 15 },
  { id: "rescene-liv-pretty-girl", imageFile: "rescene-liv-pretty-girl.jpg", group: "RESCENE", member: "Liv", release: "Pretty Girl", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 15 },
  { id: "cortis-martin-debut", imageFile: "cortis-martin-debut.jpg", group: "CORTIS", member: "Martin", release: "Debut", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 18 },
  { id: "cortis-james-debut", imageFile: "cortis-james-debut.jpg", group: "CORTIS", member: "James", release: "Debut", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 18 },
  { id: "cortis-juhoon-debut", imageFile: "cortis-juhoon-debut.jpg", group: "CORTIS", member: "Juhoon", release: "Debut", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 18 },
  { id: "cortis-seonghyeon-debut", imageFile: "cortis-seonghyeon-debut.jpg", group: "CORTIS", member: "Seonghyeon", release: "Debut", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 18 },
  { id: "cortis-keonho-debut", imageFile: "cortis-keonho-debut.jpg", group: "CORTIS", member: "Keonho", release: "Debut", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 18 },
  { id: "nct-127-johnny-ay-yo", imageFile: "nct-127-johnny-ay-yo.jpg", group: "NCT 127", member: "Johnny", release: "Ay-Yo", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 22 },
  { id: "nct-127-taeyong-ay-yo", imageFile: "nct-127-taeyong-ay-yo.jpg", group: "NCT 127", member: "Taeyong", release: "Ay-Yo", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 22 },
  { id: "nct-127-yuta-ay-yo", imageFile: "nct-127-yuta-ay-yo.jpg", group: "NCT 127", member: "Yuta", release: "Ay-Yo", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 22 },
  { id: "nct-127-doyoung-ay-yo", imageFile: "nct-127-doyoung-ay-yo.jpg", group: "NCT 127", member: "Doyoung", release: "Ay-Yo", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 22 },
  { id: "nct-127-jaehyun-ay-yo", imageFile: "nct-127-jaehyun-ay-yo.jpg", group: "NCT 127", member: "Jaehyun", release: "Ay-Yo", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 22 },
  { id: "nct-127-jungwoo-ay-yo", imageFile: "nct-127-jungwoo-ay-yo.jpg", group: "NCT 127", member: "Jungwoo", release: "Ay-Yo", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 22 },
  { id: "nct-127-haechan-ay-yo", imageFile: "nct-127-haechan-ay-yo.jpg", group: "NCT 127", member: "Haechan", release: "Ay-Yo", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 22 },
  { id: "aespa-karina-lemonade", imageFile: "aespa-karina-lemonade.jpg", group: "aespa", member: "Karina", release: "Lemonade", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 24 },
  { id: "aespa-giselle-lemonade", imageFile: "aespa-giselle-lemonade.jpg", group: "aespa", member: "Giselle", release: "Lemonade", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 24 },
  { id: "aespa-winter-lemonade", imageFile: "aespa-winter-lemonade.jpg", group: "aespa", member: "Winter", release: "Lemonade", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 24 },
  { id: "aespa-karina-savage", imageFile: "aespa-karina-savage.jpg", group: "aespa", member: "Karina", release: "Savage", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 28 },
  { id: "aespa-karina-sprite", imageFile: "aespa-karina-sprite.jpg", group: "aespa", member: "Karina", release: "Sprite", cardType: "Event", rarity: "Common", condition: "Ungraded", price: 26 },
  { id: "hearts2hearts-jiwoo-dazed-korea", imageFile: "hearts2hearts-jiwoo-dazed-korea.jpg", group: "Hearts2Hearts", member: "Jiwoo", release: "DAZED KOREA", cardType: "Event", rarity: "Common", condition: "Ungraded", price: 18 },
  { id: "hearts2hearts-carmen-dazed-korea", imageFile: "hearts2hearts-carmen-dazed-korea.jpg", group: "Hearts2Hearts", member: "Carmen", release: "DAZED KOREA", cardType: "Event", rarity: "Common", condition: "Ungraded", price: 18 },
  { id: "hearts2hearts-yuha-dazed-korea", imageFile: "hearts2hearts-yuha-dazed-korea.jpg", group: "Hearts2Hearts", member: "Yuha", release: "DAZED KOREA", cardType: "Event", rarity: "Common", condition: "Ungraded", price: 18 },
  { id: "hearts2hearts-dahyeon-dazed-korea", imageFile: "hearts2hearts-dahyeon-dazed-korea.jpg", group: "Hearts2Hearts", member: "Dahyeon", release: "DAZED KOREA", cardType: "Event", rarity: "Common", condition: "Ungraded", price: 18 },
  { id: "hearts2hearts-juun-dazed-korea", imageFile: "hearts2hearts-juun-dazed-korea.jpg", group: "Hearts2Hearts", member: "Juun", release: "DAZED KOREA", cardType: "Event", rarity: "Common", condition: "Ungraded", price: 18 },
  { id: "hearts2hearts-a-na-dazed-korea", imageFile: "hearts2hearts-a-na-dazed-korea.jpg", group: "Hearts2Hearts", member: "A-na", release: "DAZED KOREA", cardType: "Event", rarity: "Common", condition: "Ungraded", price: 18 },
  { id: "hearts2hearts-ian-dazed-korea", imageFile: "hearts2hearts-ian-dazed-korea.jpg", group: "Hearts2Hearts", member: "Ian", release: "DAZED KOREA", cardType: "Event", rarity: "Common", condition: "Ungraded", price: 18 },
  { id: "hearts2hearts-ye-on-dazed-korea", imageFile: "hearts2hearts-ye-on-dazed-korea.jpg", group: "Hearts2Hearts", member: "Ye-on", release: "DAZED KOREA", cardType: "Event", rarity: "Common", condition: "Ungraded", price: 18 },
  { id: "illit-yunah-elle", imageFile: "illit-yunah-elle.jpg", group: "ILLIT", member: "Yunah", release: "ELLE", cardType: "Event", rarity: "Common", condition: "Ungraded", price: 18 },
  { id: "illit-minju-elle", imageFile: "illit-minju-elle.jpg", group: "ILLIT", member: "Minju", release: "ELLE", cardType: "Event", rarity: "Common", condition: "Ungraded", price: 18 },
  { id: "illit-moka-elle", imageFile: "illit-moka-elle.jpg", group: "ILLIT", member: "Moka", release: "ELLE", cardType: "Event", rarity: "Common", condition: "Ungraded", price: 18 },
  { id: "illit-wonhee-elle", imageFile: "illit-wonhee-elle.jpg", group: "ILLIT", member: "Wonhee", release: "ELLE", cardType: "Event", rarity: "Common", condition: "Ungraded", price: 18 },
  { id: "illit-iroha-elle", imageFile: "illit-iroha-elle.jpg", group: "ILLIT", member: "Iroha", release: "ELLE", cardType: "Event", rarity: "Common", condition: "Ungraded", price: 18 },
  { id: "i-dle-miyeon-i-feel-1", imageFile: "i-dle-miyeon-i-feel-1.jpg", group: "I-dle", member: "Miyeon", release: "I feel", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 20 },
  { id: "i-dle-miyeon-i-feel-2", imageFile: "i-dle-miyeon-i-feel-2.jpg", group: "I-dle", member: "Miyeon", release: "I feel", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 20 },
  { id: "i-dle-minnie-2", imageFile: "i-dle-minnie-2.jpg", group: "I-dle", member: "Minnie", release: "2", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 22 },
  { id: "i-dle-soyeon-2", imageFile: "i-dle-soyeon-2.jpg", group: "I-dle", member: "Soyeon", release: "2", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 22 },
  { id: "i-dle-yuqi-crow", imageFile: "i-dle-yuqi-crow.jpg", group: "I-dle", member: "Yuqi", release: "Crow", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 24 },
  { id: "i-dle-yuqi-i-sway", imageFile: "i-dle-yuqi-i-sway.jpg", group: "I-dle", member: "Yuqi", release: "I SWAY", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 24 },
  { id: "i-dle-shuhua-we-are", imageFile: "i-dle-shuhua-we-are.jpg", group: "I-dle", member: "Shuhua", release: "We are", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 20 },
  { id: "i-dle-shuhua-i-never-die", imageFile: "i-dle-shuhua-i-never-die.jpg", group: "I-dle", member: "Shuhua", release: "I never die", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 22 },
  { id: "i-dle-shuhua-i-made", imageFile: "i-dle-shuhua-i-made.jpg", group: "I-dle", member: "Shuhua", release: "I made", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 20 },
  { id: "i-dle-shuhua-take-away", imageFile: "i-dle-shuhua-take-away.jpg", group: "I-dle", member: "Shuhua", release: "Take away", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 24 },
  { id: "le-sserafim-chaewon-spaghetti", imageFile: "le-sserafim-chaewon-spaghetti.jpg", group: "LE SSERAFIM", member: "Chaewon", release: "SPAGHETTI", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 26 },
  { id: "le-sserafim-chaewon-pureflow-pt-1-1", imageFile: "le-sserafim-chaewon-pureflow-pt-1-1.jpg", group: "LE SSERAFIM", member: "Chaewon", release: "PUREFLOW pt.1", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 24 },
  { id: "le-sserafim-chaewon-pureflow-pt-1-2", imageFile: "le-sserafim-chaewon-pureflow-pt-1-2.jpg", group: "LE SSERAFIM", member: "Chaewon", release: "PUREFLOW pt.1", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 24 },
  { id: "le-sserafim-sakura-hot", imageFile: "le-sserafim-sakura-hot.jpg", group: "LE SSERAFIM", member: "Sakura", release: "HOT", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 24 },
  { id: "le-sserafim-sakura-different", imageFile: "le-sserafim-sakura-different.jpg", group: "LE SSERAFIM", member: "Sakura", release: "Different", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 24 },
  { id: "le-sserafim-sakura-pureflow-pt-1", imageFile: "le-sserafim-sakura-pureflow-pt-1.jpg", group: "LE SSERAFIM", member: "Sakura", release: "PUREFLOW pt.1", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 24 },
  { id: "le-sserafim-yunjin-pureflow-pt-1", imageFile: "le-sserafim-yunjin-pureflow-pt-1.jpg", group: "LE SSERAFIM", member: "Yunjin", release: "PUREFLOW pt.1", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 24 },
  { id: "le-sserafim-yunjin-spaghetti-pt-1", imageFile: "le-sserafim-yunjin-spaghetti-pt-1.jpg", group: "LE SSERAFIM", member: "Yunjin", release: "SPAGHETTI pt.1", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 26 },
  { id: "le-sserafim-yunjin-crazy", imageFile: "le-sserafim-yunjin-crazy.jpg", group: "LE SSERAFIM", member: "Yunjin", release: "CRAZY", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 24 },
  { id: "le-sserafim-kazuha-crazy", imageFile: "le-sserafim-kazuha-crazy.jpg", group: "LE SSERAFIM", member: "Kazuha", release: "CRAZY", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 24 },
  { id: "le-sserafim-kazuha-pureflow-pt-1", imageFile: "le-sserafim-kazuha-pureflow-pt-1.jpg", group: "LE SSERAFIM", member: "Kazuha", release: "PUREFLOW pt.1", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 24 },
  { id: "le-sserafim-kazuha-celebration", imageFile: "le-sserafim-kazuha-celebration.jpg", group: "LE SSERAFIM", member: "Kazuha", release: "CELEBRATION", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 26 },
  { id: "le-sserafim-eunchae-celebration", imageFile: "le-sserafim-eunchae-celebration.jpg", group: "LE SSERAFIM", member: "Eunchae", release: "CELEBRATION", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 24 },
  { id: "le-sserafim-eunchae-spaghetti", imageFile: "le-sserafim-eunchae-spaghetti.jpg", group: "LE SSERAFIM", member: "Eunchae", release: "SPAGHETTI", cardType: "Album", rarity: "Common", condition: "Ungraded", price: 24 }
];
