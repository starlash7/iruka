import type { DocsPage } from "./docsContent";

export const docsPagesEn: DocsPage[] = [
  {
    category: "Start Here",
    slug: "welcome",
    summary: "What Iruka is, what users can do, and what is intentionally out of scope.",
    title: "Welcome to Iruka",
    sections: [
      { title: "What is Iruka?", body: "Iruka is a collectible pack, vault, and marketplace product for physical items that can be revealed digitally, held in custody, resold, or shipped." },
      { title: "Core flow", bullets: ["Choose a vending machine pack.", "Pull and reveal a collectible.", "Keep it vaulted, list it, or request delivery."] },
      { title: "Brand position", body: "Iruka is not an official artist, agency, label, card manufacturer, or grading company unless a partnership is explicitly announced." }
    ]
  },
  {
    category: "Product",
    slug: "vending-machine",
    summary: "How packs, pulls, reveal moments, and rarity outcomes work.",
    title: "Vending Machine",
    sections: [
      { title: "Pack selection", body: "Each pack shows price, remaining supply, rarity tiers, odds, and estimated value ranges before the user pulls." },
      { title: "Reveal result", bullets: ["Rarity", "Serial or item ID", "Estimated value", "Vault status", "Available actions"] },
      { title: "Outcome handling", body: "After reveal, the item can stay in the vault, move to marketplace listing, or enter a shipping request flow when eligible." }
    ]
  },
  {
    category: "Product",
    slug: "marketplace",
    summary: "How users buy, sell, and discover verified collectible listings.",
    title: "Marketplace",
    sections: [
      { title: "Listings", body: "Marketplace listings should show item photos, title, category, rarity or grade, condition, custody status, price, and shipping eligibility." },
      { title: "Seller actions", bullets: ["List vaulted items.", "Adjust or cancel listings.", "Sell through supported marketplace flows."] },
      { title: "Identification", body: "Third-party names should be used only when needed to identify genuine physical items, not as Iruka-owned pack branding." }
    ]
  },
  {
    category: "Custody",
    slug: "vault",
    summary: "The custody layer for verified items and marketplace-ready inventory.",
    title: "Vault",
    sections: [
      { title: "What the vault stores", body: "The vault represents verified physical inventory that can be held, listed, sold, or queued for shipping." },
      { title: "Required record", bullets: ["Item ID", "Pack source", "Custody status", "Owner record", "Photos or scan", "Redemption eligibility"] },
      { title: "Custody principle", body: "Iruka should only show an item as vaulted when internal records prove custody, verification, and redemption eligibility." }
    ]
  },
  {
    category: "Custody",
    slug: "redemption",
    summary: "How vaulted physical items move from storage to the user.",
    title: "Redemption and Shipping",
    sections: [
      { title: "Request flow", bullets: ["Select a vaulted item.", "Confirm shipping details and fees.", "Move the item to Redeem queued.", "Attach fulfillment and tracking status."] },
      { title: "Shipping data", body: "Production records should include recipient details, carrier, tracking number, fees, fulfillment status, and support notes." }
    ]
  },
  {
    category: "Packs",
    slug: "rarities",
    summary: "The pack tier model and what should be disclosed before purchase.",
    title: "Rarities and Odds",
    sections: [
      { title: "Rarity tiers", bullets: ["Common", "Rare", "Epic", "Legendary", "Iruka"] },
      { title: "Disclosure standard", body: "Every pack should disclose supply, price, odds, rarity tiers, estimated value ranges, redemption policy, and cancellation rules." }
    ]
  },
  {
    category: "Policy",
    slug: "ip-listing",
    summary: "How Iruka handles public pack branding and item identification.",
    title: "IP and Listing Policy",
    sections: [
      { title: "Neutral pack branding", body: "Public pack names should stay neutral unless Iruka has rights, licenses, or partnership approval." },
      { title: "Marketplace identification", body: "Actual listings may use artist, member, set, album, card number, condition, or grading details when needed to identify a genuine physical item." },
      { title: "Asset rule", body: "Use original Iruka art, neutral product images, or actual inventory photos. Do not create commercial cards from third-party faces, logos, or artwork without rights." }
    ]
  },
  {
    category: "Roadmap",
    slug: "roadmap",
    summary: "The current MVP, next production work, and later community plans.",
    title: "Roadmap",
    sections: [
      { title: "MVP", bullets: ["Landing page", "Vending pack flow", "Marketplace preview", "Vault actions", "Privy login with external EVM wallets"] },
      { title: "Next", bullets: ["Production inventory records", "Vault operations", "Marketplace settlement", "Shipping operations", "Public GitBook docs"] },
      { title: "Later", body: "Iruka plans to add community boards so idol fans and collectors can discuss drops, share pulls, and follow collections together." }
    ]
  }
];
