import { Send, ShieldCheck, Store } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { AppFooter, AppHeader, MINTLIFY_DOCS_URL } from "./AppChrome";
import { copy } from "./appCopy";
import type { AppView, Locale, WalletAuthMode } from "./appTypes";
import {
  createMarketplacePurchase,
  createRevealCard,
  createRevealImageUrl,
  createVendingCardPull,
  formatCardPullValue,
  RevealedCard
} from "./cardFlow";
import { EventsView } from "./EventsView";
import { HomeView } from "./HomeView";
import { MarketplaceSellDialog } from "./MarketplaceSellDialog";
import { MarketplaceView } from "./MarketplaceView";
import type { MarketplaceBrowseCategory } from "./marketplaceBrowse";
import {
  getMarketplaceItems,
  initialMarketplaceListings,
  type MarketplaceItem,
  type MarketplaceListing
} from "./marketplaceData";
import { rarityClassNames } from "./packData";
import { RoadmapView } from "./RoadmapView";
import { VaultView } from "./VaultView";
import { VendingView } from "./VendingView";
import {
  getGiwaPackBatchAddress,
  requestGiwaPull,
  type GiwaPullReceipt,
  type GiwaWallet
} from "./giwaPull.ts";
import { packDetails, pullPack } from "./vendingData";
import type { CardPull, VaultStatus } from "./vendingTypes";

type OnchainPull = GiwaPullReceipt & { packId: string };

const PackRevealOverlay = lazy(() =>
  import("./features/pack-reveal/PackRevealOverlay").then((module) => ({
    default: module.PackRevealOverlay
  }))
);

function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "en";
  return window.localStorage.getItem("iruka-locale") === "ko" ? "ko" : "en";
}

function getInitialView(): AppView {
  if (typeof window === "undefined") return "home";
  const hash = window.location.hash.replace("#", "");

  if (hash === "docs") {
    window.location.replace(MINTLIFY_DOCS_URL);
    return "home";
  }

  return ["pull", "marketplace", "events", "roadmap"].includes(hash)
    ? (hash as AppView)
    : "home";
}

function App({ walletAuth = "disabled" }: { walletAuth?: WalletAuthMode }) {
  const [locale, setLocale] = useState<Locale>(getStoredLocale);
  const [selectedPackId, setSelectedPackId] = useState(packDetails[0].id);
  const [collection, setCollection] = useState<CardPull[]>([]);
  const [sessionPulls, setSessionPulls] = useState<CardPull[]>([]);
  const [activePull, setActivePull] = useState<CardPull | undefined>();
  const [pendingReveal, setPendingReveal] = useState<CardPull | undefined>();
  const [marketplaceListings, setMarketplaceListings] = useState<MarketplaceListing[]>(
    initialMarketplaceListings
  );
  const [marketplaceBrowseCategory, setMarketplaceBrowseCategory] =
    useState<MarketplaceBrowseCategory>("all");
  const [marketplaceTargetListingId, setMarketplaceTargetListingId] = useState<string>();
  const [sellCardId, setSellCardId] = useState<string>();
  const [isOpening, setIsOpening] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(walletAuth === "disabled");
  const [giwaWallet, setGiwaWallet] = useState<GiwaWallet>();
  const [onchainPull, setOnchainPull] = useState<OnchainPull>();
  const [walletPromptSignal, setWalletPromptSignal] = useState(0);
  const [notice, setNotice] = useState<string | undefined>();
  const [activeView, setActiveView] = useState<AppView>(getInitialView);
  const noticeTimerRef = useRef<number | undefined>(undefined);
  const revealCompleteRef = useRef(false);
  const revealSectionRef = useRef<HTMLElement | null>(null);
  const wasWalletConnectedRef = useRef(isWalletConnected);
  const t = copy[locale];

  const vendingPacks = packDetails;
  const selectedPackDetail = useMemo(
    () => vendingPacks.find((pack) => pack.id === selectedPackId) ?? vendingPacks[0],
    [selectedPackId, vendingPacks]
  );
  const pendingRevealCard = useMemo(
    () =>
      pendingReveal
        ? createRevealCard(
            pendingReveal,
            t.rarities[pendingReveal.rarity],
            formatCardPullValue(pendingReveal)
          )
        : undefined,
    [pendingReveal, t.rarities]
  );
  const marketplaceItems = useMemo(
    () => getMarketplaceItems(marketplaceListings),
    [marketplaceListings]
  );
  const sellCard = collection.find((card) => card.id === sellCardId)
    ?? (activePull?.id === sellCardId ? activePull : undefined);
  const sellListing = sellCard
    ? marketplaceListings.find(
        (listing) =>
          listing.inventoryId === (sellCard.marketplaceInventoryId ?? sellCard.id)
      )
    : undefined;

  const walletRequired = walletAuth === "privy" && !isWalletConnected;
  const hasGiwaPullContract = Boolean(getGiwaPackBatchAddress());
  const isPrimaryView = activeView === "pull";

  useEffect(() => {
    document.documentElement.lang = locale;
    window.localStorage.setItem("iruka-locale", locale);
  }, [locale]);

  useEffect(() => {
    return () => window.clearTimeout(noticeTimerRef.current);
  }, []);

  useEffect(() => {
    const wasConnected = wasWalletConnectedRef.current;
    wasWalletConnectedRef.current = isWalletConnected;

    if (walletAuth !== "privy" || !wasConnected || isWalletConnected) return;

    setCollection([]);
    setSessionPulls([]);
    setActivePull(undefined);
    setPendingReveal(undefined);
    setGiwaWallet(undefined);
    setOnchainPull(undefined);
    setIsOpening(false);
    setMarketplaceListings(initialMarketplaceListings);
    setMarketplaceBrowseCategory("all");
    setMarketplaceTargetListingId(undefined);
    setSellCardId(undefined);
    setActiveView("home");
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [isWalletConnected, walletAuth]);

  function showNotice(message: string) {
    window.clearTimeout(noticeTimerRef.current);
    setNotice(message);
    noticeTimerRef.current = window.setTimeout(() => setNotice(undefined), 2600);
  }

  function scrollToReveal() {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    revealSectionRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start"
    });
  }

  function choosePack(packId: string) {
    if (isOpening) return;

    setActivePull(undefined);
    setOnchainPull(undefined);
    setSelectedPackId(packId);
  }

  function showView(view: AppView, targetId?: string) {
    if (view === "vault" && walletRequired) {
      setWalletPromptSignal((value) => value + 1);
      showNotice(t.feedback.connectWallet);
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setActiveView(view);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (!targetId) {
          window.scrollTo({
            top: 0,
            behavior: prefersReducedMotion ? "auto" : "smooth"
          });
          return;
        }

        document.getElementById(targetId)?.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "start"
        });
      });
    });
  }

  function browseMarketplace(
    category: MarketplaceBrowseCategory,
    listingId?: string
  ) {
    setMarketplaceBrowseCategory(category);
    setMarketplaceTargetListingId(listingId);
    showView("marketplace");
  }

  function showNavigationView(view: AppView, targetId?: string) {
    if (view === "marketplace") {
      browseMarketplace("all");
      return;
    }
    showView(view, targetId);
  }

  async function openPack() {
    if (isOpening) return;

    if (walletRequired) {
      setWalletPromptSignal((value) => value + 1);
      showNotice(t.feedback.connectWallet);
      return;
    }

    if (hasGiwaPullContract) {
      if (!giwaWallet) {
        setWalletPromptSignal((value) => value + 1);
        showNotice(t.feedback.connectWallet);
        return;
      }

      setIsOpening(true);
      try {
        const receipt = await requestGiwaPull(giwaWallet, selectedPackDetail);

        setOnchainPull({ ...receipt, packId: selectedPackDetail.id });
        showNotice(t.feedback.giwaPullConfirmed);
      } catch {
        showNotice(t.feedback.giwaPullFailed);
      } finally {
        setIsOpening(false);
      }
      return;
    }

    revealCompleteRef.current = false;
    setIsOpening(true);
    try {
      const excludedCardIds = sessionPulls
        .filter((card) => card.packId === selectedPackDetail.id)
        .map((card) => card.inventoryCardId)
        .filter((cardId): cardId is string => Boolean(cardId));
      const pull = await pullPack(selectedPackDetail.id, { excludedCardIds });
      setPendingReveal(createVendingCardPull(
        pull,
        selectedPackDetail.name,
        t.vending.packLabel
      ));
    } catch {
      setIsOpening(false);
      showNotice(t.vending.loadError);
    }
  }

  function completePendingReveal() {
    if (!pendingReveal || revealCompleteRef.current) return;

    revealCompleteRef.current = true;
    setActivePull(pendingReveal);
    setSessionPulls((items) => [pendingReveal, ...items]);
    setPendingReveal(undefined);
    setIsOpening(false);
    window.setTimeout(scrollToReveal, 40);
  }

  function updateCardStatus(id: string, vaultStatus: VaultStatus) {
    const card = collection.find((item) => item.id === id)
      ?? (activePull?.id === id ? activePull : undefined);
    if (vaultStatus === "Redeem queued" && card?.vaultStatus === "Listed") {
      showNotice(t.feedback.cancelListingBeforeShipping);
      return;
    }

    setCollection((items) => {
      if (!card) return items;
      return items.some((item) => item.id === id)
        ? items.map((item) => (item.id === id ? { ...item, vaultStatus } : item))
        : [{ ...card, vaultStatus }, ...items];
    });
    setActivePull((card) => (card?.id === id ? { ...card, vaultStatus } : card));
    showNotice(
      {
        Vaulted: t.feedback.vaulted,
        Listed: t.feedback.listed,
        Sold: t.feedback.sold,
        "Redeem queued": t.feedback.shipQueued
      }[vaultStatus]
    );
  }

  function renderActivePullActions() {
    if (!activePull) return null;

    return (
      <div className="asset-actions">
        <button onClick={() => updateCardStatus(activePull.id, "Vaulted")} type="button">
          <ShieldCheck size={16} />
          {t.actions.vault}
        </button>
        <button onClick={() => openSellDialog(activePull)} type="button">
          <Store size={16} />
          {t.actions.sellNow}
        </button>
        <button
          disabled={activePull.redemption?.shipmentAvailable === false}
          onClick={() => updateCardStatus(activePull.id, "Redeem queued")}
          title={activePull.redemption?.shipmentAvailable === false
            ? t.vending.redemptionUnavailable
            : undefined}
          type="button"
        >
          <Send size={16} />
          {t.actions.ship}
        </button>
      </div>
    );
  }

  function buyMarketplaceCard(item: MarketplaceItem) {
    if (walletRequired) {
      setWalletPromptSignal((value) => value + 1);
      showNotice(t.feedback.connectWallet);
      return;
    }

    if (item.listing.status !== "Available") return;
    if (
      collection.some(
        (card) => card.marketplaceInventoryId === item.inventory.id
      )
    ) {
      showNotice(t.feedback.purchaseAlreadyOwned);
      return;
    }

    const purchase = createMarketplacePurchase(item);
    setMarketplaceListings((listings) =>
      listings.map((listing) =>
        listing.id === item.listing.id ? { ...listing, status: "Sold" } : listing
      )
    );
    setCollection((items) => [purchase, ...items]);
    setActivePull(purchase);
    showNotice(t.feedback.purchaseQueued);
  }

  function openSellDialog(card: CardPull) {
    if (walletRequired) {
      setWalletPromptSignal((value) => value + 1);
      showNotice(t.feedback.connectWallet);
      return;
    }
    setSellCardId(card.id);
  }

  function saveMarketplaceListing(card: CardPull, fixedPrice: number) {
    const inventoryId = card.marketplaceInventoryId ?? card.id;
    const existing = marketplaceListings.find(
      (listing) => listing.inventoryId === inventoryId
    );

    setMarketplaceListings((listings) =>
      existing
        ? listings.map((listing) =>
            listing.id === existing.id
              ? {
                  ...listing,
                  fixedPrice,
                  listedAt: new Date().toISOString(),
                  status: "Available"
                }
              : listing
          )
        : [
            {
              id: `owned-listing-${card.id}`,
              inventoryId,
              fixedPrice,
              listedAt: new Date().toISOString(),
              status: "Available"
            },
            ...listings
          ]
    );
    updateCardStatus(card.id, "Listed");
    if (existing?.status === "Available") showNotice(t.feedback.listingUpdated);
    setSellCardId(undefined);
  }

  function cancelMarketplaceListing(card: CardPull) {
    const inventoryId = card.marketplaceInventoryId ?? card.id;
    setMarketplaceListings((listings) =>
      listings.map((listing) =>
        listing.inventoryId === inventoryId
          ? { ...listing, status: "Cancelled" }
          : listing
      )
    );
    setCollection((items) =>
      items.map((item) =>
        item.id === card.id ? { ...item, vaultStatus: "Vaulted" } : item
      )
    );
    setActivePull((item) =>
      item?.id === card.id ? { ...item, vaultStatus: "Vaulted" } : item
    );
    setSellCardId(undefined);
    showNotice(t.feedback.listingCancelled);
  }

  return (
    <main className="product-shell">
      <AppHeader
        activeView={activeView}
        connectSignal={walletPromptSignal}
        copy={t.nav}
        locale={locale}
        onConnectedChange={setIsWalletConnected}
        onLocaleChange={setLocale}
        onShowView={showNavigationView}
        onWalletChange={setGiwaWallet}
        walletAuth={walletAuth}
      />

      {activeView === "home" ? (
        <HomeView
          copy={t.home}
          items={marketplaceItems}
          locale={locale}
          onBrowseCategory={browseMarketplace}
          onEnterVending={() => showView("pull", "drops")}
          onOpenItem={(listingId) => browseMarketplace("photocards", listingId)}
        />
      ) : null}

      {isPrimaryView ? (
        <VendingView
          activePull={activePull}
          copy={{
            category: t.vending.category,
            hero: {
              openPack: t.vending.openPack,
              opening: t.hero.opening,
              packLabel: t.vending.packLabel,
              testPull: t.vending.testPull
            },
            inventory: {
              allRarities: t.vending.allRarities,
              estimatedValue: t.vending.estimatedValue,
              individualOdds: t.vending.individualOdds,
              insidePack: t.vending.insidePack,
              loadError: t.vending.loadError,
              loadMore: t.vending.loadMore,
              redeemable: t.vending.redeemable,
              showFeatured: t.vending.showFeatured,
              viewAllCards: t.vending.viewAllCards,
              viewBack: t.vending.viewBack,
              viewFront: t.vending.viewFront
            },
            labels: {
              batch: t.vending.batch,
              cards: t.sections.cards,
              packOdds: t.vending.packOdds,
              physicalRedemption: t.vending.physicalRedemption,
              redemptionUnavailable: t.vending.redemptionUnavailable,
              recentPulls: t.vending.recentPulls,
              giwaReceipt: t.vending.giwaReceipt,
              giwaTestnet: t.vending.giwaTestnet,
              viewTransaction: t.vending.viewTransaction,
              viewOdds: t.vending.viewOdds,
              yourPull: t.vending.yourPull
            },
            rarities: t.rarities
          }}
          getCardImageUrl={(card) =>
            createRevealImageUrl(
              card,
              t.rarities[card.rarity],
              formatCardPullValue(card)
            )
          }
          isOpening={isOpening}
          onchainReceipt={onchainPull?.packId === selectedPackDetail.id ? onchainPull : undefined}
          onOpenPack={openPack}
          onSelectPack={choosePack}
          packs={vendingPacks}
          pullActions={renderActivePullActions()}
          pullCard={
            activePull ? (
              <RevealedCard
                card={activePull}
                categoryLabel={t.categories[activePull.category]}
                rarityClassName={rarityClassNames[activePull.rarity]}
                rarityLabel={t.rarities[activePull.rarity]}
                valueLabel={formatCardPullValue(activePull)}
              />
            ) : null
          }
          recentPulls={sessionPulls}
          resultRef={revealSectionRef}
          selectedPack={selectedPackDetail}
          testnetEnabled={hasGiwaPullContract}
          walletRequired={walletRequired}
        />
      ) : null}

      {activeView === "marketplace" ? (
        <MarketplaceView
          browseCategory={marketplaceBrowseCategory}
          copy={t.marketplacePage}
          items={marketplaceItems}
          listings={marketplaceListings}
          locale={locale}
          onBrowseCategoryChange={setMarketplaceBrowseCategory}
          onBuy={buyMarketplaceCard}
          onOpenSell={openSellDialog}
          onTargetListingHandled={() => setMarketplaceTargetListingId(undefined)}
          ownedCards={collection.filter((card) => card.vaultStatus !== "Sold")}
          targetListingId={marketplaceTargetListingId}
        />
      ) : null}

      {activeView === "events" ? <EventsView copy={t.eventsPage} /> : null}

      {activeView === "vault" && isWalletConnected ? (
        <VaultView
          cards={collection}
          copy={{
            cards: t.sections.cards,
            empty: t.sections.empty,
            redeem: t.sections.redeem,
            sold: t.sections.sold,
            title: t.sections.vault,
            vaultEmpty: t.sections.vaultEmpty
          }}
          formatValue={formatCardPullValue}
          getCardImageUrl={(card) =>
            card.imageUrl ?? createRevealImageUrl(
              card,
              t.rarities[card.rarity],
              formatCardPullValue(card)
            )
          }
          locale={locale}
          onSelectCard={setActivePull}
          pullActions={activePull && collection.some((card) => card.id === activePull.id)
            ? renderActivePullActions()
            : null}
          rarityClassNames={rarityClassNames}
          statusLabels={t.statuses}
        />
      ) : null}

      {activeView === "roadmap" ? <RoadmapView locale={locale} /> : null}

      <AppFooter copy={t.footer} onShowView={showNavigationView} pullLabel={t.nav.pull} />

      {pendingRevealCard ? (
        <Suspense
          fallback={<div className="pack-reveal-overlay pack-reveal-loading" aria-hidden="true" />}
        >
          <PackRevealOverlay
            cards={[pendingRevealCard]}
            labels={t.revealOverlay}
            onComplete={completePendingReveal}
          />
        </Suspense>
      ) : null}

      <MarketplaceSellDialog
        card={sellCard}
        copy={t.marketplacePage}
        listing={sellListing}
        onCancelListing={cancelMarketplaceListing}
        onClose={() => setSellCardId(undefined)}
        onSave={saveMarketplaceListing}
      />

      {notice ? (
        <div className="status-toast" role="status" aria-live="polite">
          {notice}
        </div>
      ) : null}
    </main>
  );
}

export default App;
