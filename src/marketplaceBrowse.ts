export const marketplaceBrowseCategories = [
  "all",
  "photocards",
  "albums",
  "lightsticks",
  "fan-kits",
  "apparel",
  "acrylic-stands",
  "keyrings",
  "plush-charms"
] as const;

export type MarketplaceBrowseCategory = (typeof marketplaceBrowseCategories)[number];

export const homeBrowseCategories = [
  "photocards",
  "albums",
  "lightsticks",
  "fan-kits",
  "apparel",
  "acrylic-stands",
  "keyrings",
  "plush-charms"
] as const satisfies readonly MarketplaceBrowseCategory[];
