import { ArrowRight } from "lucide-react";
import acrylicStandsImage from "./assets/home-discovery/acrylic-stands.webp";
import albumsImage from "./assets/home-discovery/albums.webp";
import apparelImage from "./assets/home-discovery/apparel.webp";
import fanKitsImage from "./assets/home-discovery/fan-kits.webp";
import keyringsImage from "./assets/home-discovery/keyrings.webp";
import lightsticksImage from "./assets/home-discovery/lightsticks.webp";
import photocardsImage from "./assets/home-discovery/photocards.webp";
import plushCharmsImage from "./assets/home-discovery/plush-charms.webp";
import { homeBrowseCategories, type MarketplaceBrowseCategory } from "./marketplaceBrowse";
import type { MarketplaceItem } from "./marketplaceData";

export type HomeDiscoveryCopy = {
  categoryLabels: Record<MarketplaceBrowseCategory, string>;
  hotPhotocards: string;
  newArrivals: string;
  trendingNow: string;
  viewAll: string;
};

type HomeDiscoveryProps = {
  copy: HomeDiscoveryCopy;
  items: MarketplaceItem[];
  onBrowseCategory: (category: MarketplaceBrowseCategory) => void;
  onOpenItem: (listingId: string) => void;
};

const categoryImages: Record<Exclude<MarketplaceBrowseCategory, "all">, string> = {
  photocards: photocardsImage,
  albums: albumsImage,
  lightsticks: lightsticksImage,
  "fan-kits": fanKitsImage,
  apparel: apparelImage,
  "acrylic-stands": acrylicStandsImage,
  keyrings: keyringsImage,
  "plush-charms": plushCharmsImage
};

function getAvailableItems(items: MarketplaceItem[]) {
  return items.filter((item) => item.listing.status === "Available");
}

function getHotItems(items: MarketplaceItem[]) {
  return getAvailableItems(items).slice(0, 6);
}

function getNewItems(items: MarketplaceItem[]) {
  return getAvailableItems(items).slice(6, 12);
}

function HomePhotocard({
  item,
  onOpen
}: {
  item: MarketplaceItem;
  onOpen: (listingId: string) => void;
}) {
  return (
    <button
      aria-label={`${item.card.group} ${item.card.title}`}
      className="home-market-card"
      onClick={() => onOpen(item.listing.id)}
      type="button"
    >
      <span className="home-market-card-image">
        <img alt="" decoding="async" loading="lazy" src={item.card.imageUrl} />
      </span>
      <span className="home-market-card-copy">
        <small className="home-market-card-group">{item.card.group}</small>
        <strong className="home-market-card-name">{item.card.member} · {item.card.release}</strong>
      </span>
    </button>
  );
}

function PhotocardSection({
  items,
  onOpenItem,
  onViewAll,
  title,
  viewAll
}: {
  items: MarketplaceItem[];
  onOpenItem: (listingId: string) => void;
  onViewAll: () => void;
  title: string;
  viewAll: string;
}) {
  return (
    <section className="home-discovery-section">
      <header className="home-discovery-heading">
        <h2>{title}</h2>
        <button onClick={onViewAll} type="button">
          {viewAll}
          <ArrowRight size={16} />
        </button>
      </header>
      <div className="home-market-grid">
        {items.map((item) => (
          <HomePhotocard item={item} key={item.listing.id} onOpen={onOpenItem} />
        ))}
      </div>
    </section>
  );
}

export function HomeDiscovery({
  copy,
  items,
  onBrowseCategory,
  onOpenItem
}: HomeDiscoveryProps) {
  const hotItems = getHotItems(items);
  const newItems = getNewItems(items);

  return (
    <div className="home-discovery">
      <section className="home-discovery-section">
        <header className="home-discovery-heading home-trending-heading"><h2>{copy.trendingNow}</h2></header>
        <div className="home-category-grid">
          {homeBrowseCategories.map((category) => (
            <button
              className="home-category-tile"
              key={category}
              onClick={() => onBrowseCategory(category)}
              type="button"
            >
              <span><img alt="" decoding="async" loading="lazy" src={categoryImages[category]} /></span>
              <strong>{copy.categoryLabels[category]}</strong>
            </button>
          ))}
        </div>
      </section>

      <PhotocardSection
        items={hotItems}
        onOpenItem={onOpenItem}
        onViewAll={() => onBrowseCategory("photocards")}
        title={copy.hotPhotocards}
        viewAll={copy.viewAll}
      />
      <PhotocardSection
        items={newItems}
        onOpenItem={onOpenItem}
        onViewAll={() => onBrowseCategory("photocards")}
        title={copy.newArrivals}
        viewAll={copy.viewAll}
      />
    </div>
  );
}
