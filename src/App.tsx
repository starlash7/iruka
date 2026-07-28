import { Send, ShieldCheck, Store } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { AccountView } from "./AccountView";
import { AppFooter, AppHeader, MINTLIFY_DOCS_URL } from "./AppChrome";
import { copy } from "./appCopy";
import type { AppView, Locale, WalletAuthMode } from "./appTypes";
import {
  createRevealCard,
  createRevealImageUrl,
  createVendingCardPull,
  formatCardPullValue,
  isCardCustodyVerified,
  RevealedCard
} from "./cardFlow";
import {
  getWalletCardCollection,
  saveWalletCardCollection
} from "./cardCollectionStorage.ts";
import { EventsView } from "./EventsView";
import { HomeEntry } from "./HomeEntry";
import { HomeView } from "./HomeView";
import { getStoredLocale, saveStoredLocale } from "./localeStorage.ts";
import { MarketplaceSellDialog } from "./MarketplaceSellDialog";
import { MarketplaceView } from "./MarketplaceView";
import type { MarketplaceBrowseCategory } from "./marketplaceBrowse";
import {
  getMarketplaceItems,
  initialMarketplaceListings,
  type MarketplaceListing
} from "./marketplaceData";
import { rarityClassNames } from "./packData";
import { RoadmapView } from "./RoadmapView";
import { VaultCardList } from "./VaultCardList";
import { VaultView } from "./VaultView";
import { VendingView } from "./VendingView";
import {
  confirmGiwaPullRequest,
  getGiwaPackBatchState,
  getGiwaPackBatchAddress,
  GiwaPullRequestRevertedError,
  requestGiwaPull,
  type GiwaPullReceipt,
  type GiwaPackBatchState,
  type GiwaWallet
} from "./giwaPull.ts";
import {
  clearPendingGiwaPull,
  confirmPendingGiwaPull,
  createPendingGiwaPull,
  getPendingGiwaPull,
  getPendingGiwaPullReceipt,
  savePendingGiwaPull,
  type PendingGiwaPull
} from "./giwaPendingPull.ts";
import {
  waitForGiwaPullFulfillment,
  type GiwaPullFulfillment
} from "./giwaFulfillment.ts";
import { createGiwaVendingPull } from "./giwaInventory.ts";
import {
  PackRevealBoundary,
  PackRevealLoading
} from "./features/pack-reveal/PackRevealBoundary.tsx";
import { packDetails, pullPack } from "./vendingData";
import type { CardPull, VaultStatus } from "./vendingTypes";

type OnchainPull = GiwaPullReceipt & {
  fulfillment?: GiwaPullFulfillment;
  packId: string;
};

const PackRevealOverlay = lazy(() =>
  import("./features/pack-reveal/PackRevealOverlay").then((module) => ({
    default: module.PackRevealOverlay
  }))
);

function getInitialView(): AppView {
  if (typeof window === "undefined") return "home";
  const hash = window.location.hash.replace("#", "");

  if (hash === "docs") {
    window.location.replace(MINTLIFY_DOCS_URL);
    return "home";
  }

  const view = hash === "account-inventory" ? "account" : hash;
  return [
    "home",
    "pull",
    "marketplace",
    "events",
    "roadmap",
    "account",
    "vault"
  ].includes(view)
    ? (view as AppView)
    : "home";
}

function shouldShowHomeEntry() {
  if (typeof window === "undefined") return false;
  return window.location.hash.length === 0;
}

function App({ walletAuth = "disabled" }: { walletAuth?: WalletAuthMode }) {
  const [locale, setLocale] = useState<Locale>(getStoredLocale);
  const [selectedPackId, setSelectedPackId] = useState(packDetails[0].id);
  const [collection, setCollection] = useState<CardPull[]>([]);
  const [collectionOwnerAddress, setCollectionOwnerAddress] = useState<string>();
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
  const [isSignedIn, setIsSignedIn] = useState(walletAuth === "disabled");
  const [giwaWallet, setGiwaWallet] = useState<GiwaWallet>();
  const [externalWallet, setExternalWallet] = useState<GiwaWallet>();
  const [onchainPull, setOnchainPull] = useState<OnchainPull>();
  const [pendingGiwaPull, setPendingGiwaPull] = useState<PendingGiwaPull>();
  const [selectedGiwaBatchState, setSelectedGiwaBatchState] =
    useState<GiwaPackBatchState>("checking");
  const [walletPromptSignal, setWalletPromptSignal] = useState(0);
  const [externalWalletPromptSignal, setExternalWalletPromptSignal] = useState(0);
  const [notice, setNotice] = useState<string | undefined>();
  const [activeView, setActiveView] = useState<AppView>(getInitialView);
  const [showHomeEntry, setShowHomeEntry] = useState(shouldShowHomeEntry);
  const noticeTimerRef = useRef<number | undefined>(undefined);
  const revealCompleteRef = useRef(false);
  const revealSectionRef = useRef<HTMLElement | null>(null);
  const wasSignedInRef = useRef(isSignedIn);
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
  const accountCards = collection.filter((card) => card.vaultStatus !== "Sold");
  const sellCard = collection.find((card) => card.id === sellCardId)
    ?? (activePull?.id === sellCardId ? activePull : undefined);
  const sellListing = sellCard
    ? marketplaceListings.find(
        (listing) =>
          listing.inventoryId === (sellCard.marketplaceInventoryId ?? sellCard.id)
      )
    : undefined;

  const walletRequired = walletAuth === "privy" && !isSignedIn;
  const hasGiwaPullContract = Boolean(getGiwaPackBatchAddress());
  const isAwaitingOnchainFulfillment = Boolean(
    (
      onchainPull?.packId === selectedPackDetail.id
      && !onchainPull.fulfillment
    )
    || pendingGiwaPull?.packId === selectedPackDetail.id
  );
  const isPrimaryView = activeView === "pull";

  useEffect(() => {
    document.documentElement.lang = locale;
    saveStoredLocale(undefined, locale);
  }, [locale]);

  useEffect(() => {
    return () => window.clearTimeout(noticeTimerRef.current);
  }, []);

  useEffect(() => {
    if (!giwaWallet) {
      setPendingGiwaPull(undefined);
      setCollectionOwnerAddress(undefined);
      return;
    }

    setCollection(
      getWalletCardCollection(window.localStorage, giwaWallet.address)
    );
    setCollectionOwnerAddress(giwaWallet.address);
    const pendingPull = getPendingGiwaPull(
      window.localStorage,
      giwaWallet.address
    );
    setPendingGiwaPull(pendingPull);
    if (!pendingPull) return;

    setSelectedPackId(pendingPull.packId);
    const receipt = getPendingGiwaPullReceipt(pendingPull);
    if (receipt) {
      setOnchainPull({ ...receipt, packId: pendingPull.packId });
    }
  }, [giwaWallet?.address]);

  useEffect(() => {
    if (!hasGiwaPullContract) {
      setSelectedGiwaBatchState("unavailable");
      return;
    }

    let active = true;
    setSelectedGiwaBatchState("checking");
    void getGiwaPackBatchState(selectedPackDetail).then((state) => {
      if (active) setSelectedGiwaBatchState(state);
    });

    return () => {
      active = false;
    };
  }, [hasGiwaPullContract, selectedPackDetail]);

  useEffect(() => {
    if (!collectionOwnerAddress) return;
    saveWalletCardCollection(
      window.localStorage,
      collectionOwnerAddress,
      collection
    );
  }, [collection, collectionOwnerAddress]);

  useEffect(() => {
    function restoreView() {
      setShowHomeEntry(false);
      setActiveView(getInitialView());
      window.scrollTo({ top: 0, behavior: "auto" });
    }

    window.addEventListener("popstate", restoreView);
    return () => window.removeEventListener("popstate", restoreView);
  }, []);

  useEffect(() => {
    const wasSignedIn = wasSignedInRef.current;
    wasSignedInRef.current = isSignedIn;

    if (walletAuth !== "privy" || !wasSignedIn || isSignedIn) return;

    setCollection([]);
    setCollectionOwnerAddress(undefined);
    setSessionPulls([]);
    setActivePull(undefined);
    setPendingReveal(undefined);
    setGiwaWallet(undefined);
    setExternalWallet(undefined);
    setOnchainPull(undefined);
    setPendingGiwaPull(undefined);
    setIsOpening(false);
    setMarketplaceListings(initialMarketplaceListings);
    setMarketplaceBrowseCategory("all");
    setMarketplaceTargetListingId(undefined);
    setSellCardId(undefined);
    setActiveView("home");
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [isSignedIn, walletAuth]);

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
    if (isOpening || isAwaitingOnchainFulfillment) return;

    setActivePull(undefined);
    setOnchainPull(undefined);
    setSelectedPackId(packId);
  }

  function showView(view: AppView, targetId?: string) {
    if ((view === "vault" || view === "account") && walletRequired) {
      setWalletPromptSignal((value) => value + 1);
      showNotice(t.feedback.connectWallet);
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nextHash = `#${targetId ?? view}`;
    if (window.location.hash !== nextHash) {
      window.history.pushState(null, "", nextHash);
    }

    setActiveView(view);
    setShowHomeEntry(false);
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
      const existingPendingPull = pendingGiwaPull?.packId === selectedPackDetail.id
        ? pendingGiwaPull
        : undefined;
      const storedReceipt = existingPendingPull
        ? getPendingGiwaPullReceipt(existingPendingPull)
        : undefined;
      const existingOnchainPull = onchainPull?.packId === selectedPackDetail.id
        && !onchainPull.fulfillment
        ? onchainPull
        : storedReceipt
          ? { ...storedReceipt, packId: selectedPackDetail.id }
          : undefined;

      if (
        selectedGiwaBatchState !== "live"
        && !existingOnchainPull
        && !existingPendingPull
      ) {
        showNotice(t.vending.loadError);
        return;
      }

      if (!existingOnchainPull && !existingPendingPull && !giwaWallet) {
        setWalletPromptSignal((value) => value + 1);
        showNotice(t.feedback.connectWallet);
        return;
      }

      setIsOpening(true);
      let currentPull = existingOnchainPull;
      let currentPendingPull = existingPendingPull;
      let revealStarted = false;

      try {
        const pullReceipt = existingOnchainPull
          ?? (
            existingPendingPull
              ? await confirmGiwaPullRequest(existingPendingPull)
              : await requestGiwaPull(giwaWallet!, selectedPackDetail, {
                  onSubmitted: (submission) => {
                    const pendingPull = createPendingGiwaPull({
                      ...submission,
                      packId: selectedPackDetail.id,
                      walletAddress: giwaWallet!.address
                    });
                    currentPendingPull = pendingPull;
                    savePendingGiwaPull(window.localStorage, pendingPull);
                    setPendingGiwaPull(pendingPull);
                  }
                })
          );
        currentPull = { ...pullReceipt, packId: selectedPackDetail.id };
        setOnchainPull(currentPull);

        if (currentPendingPull) {
          currentPendingPull = confirmPendingGiwaPull(
            currentPendingPull,
            pullReceipt
          );
          savePendingGiwaPull(window.localStorage, currentPendingPull);
          setPendingGiwaPull(currentPendingPull);
        }

        const fulfillment = await waitForGiwaPullFulfillment(currentPull);
        if (!fulfillment) {
          showNotice(t.feedback.giwaPullPending);
          return;
        }

        const pull = await createGiwaVendingPull(
          selectedPackDetail.id,
          fulfillment
        );
        const cardPull = createVendingCardPull(
          pull,
          selectedPackDetail.name,
          t.vending.packLabel
        );

        revealCompleteRef.current = false;
        revealStarted = true;
        setOnchainPull({ ...currentPull, fulfillment });
        setPendingReveal(cardPull);
      } catch (error) {
        if (
          error instanceof GiwaPullRequestRevertedError
          && currentPendingPull
        ) {
          clearPendingGiwaPull(
            window.localStorage,
            currentPendingPull.walletAddress,
            currentPendingPull.requestTransactionHash
          );
          setPendingGiwaPull(undefined);
        }
        showNotice(
          currentPull || currentPendingPull
            ? t.feedback.giwaResultFailed
            : t.feedback.giwaPullFailed
        );
      } finally {
        if (!revealStarted) setIsOpening(false);
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
    setCollection((items) =>
      items.some((card) => card.id === pendingReveal.id)
        ? items
        : [pendingReveal, ...items]
    );
    setSessionPulls((items) => [pendingReveal, ...items]);
    setPendingReveal(undefined);
    setIsOpening(false);
    if (pendingGiwaPull) {
      clearPendingGiwaPull(
        window.localStorage,
        pendingGiwaPull.walletAddress,
        pendingGiwaPull.requestTransactionHash
      );
      setPendingGiwaPull(undefined);
    }
    window.setTimeout(scrollToReveal, 40);
  }

  function updateCardStatus(id: string, vaultStatus: VaultStatus) {
    const card = collection.find((item) => item.id === id)
      ?? (activePull?.id === id ? activePull : undefined);
    if (
      vaultStatus !== "Pulled"
      && card
      && !isCardCustodyVerified(card)
    ) {
      showNotice(t.vending.redemptionUnavailable);
      return;
    }
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
    const statusNotice = {
      Vaulted: t.feedback.vaulted,
      Listed: t.feedback.listed,
      Sold: t.feedback.sold,
      "Redeem queued": t.feedback.shipQueued
    }[vaultStatus as Exclude<VaultStatus, "Pulled">];
    if (statusNotice) showNotice(statusNotice);
  }

  function renderActivePullActions() {
    if (!activePull) return null;
    const custodyVerified = isCardCustodyVerified(activePull);

    return (
      <div className="asset-actions">
        <button
          className="iruka-action-button asset-action-primary"
          disabled={!custodyVerified}
          onClick={() => updateCardStatus(activePull.id, "Vaulted")}
          type="button"
        >
          <ShieldCheck size={16} />
          {t.actions.vault}
        </button>
        <button
          className="asset-action-secondary iruka-secondary-button"
          disabled={!custodyVerified}
          onClick={() => openSellDialog(activePull)}
          type="button"
        >
          <Store size={16} />
          {t.actions.sellNow}
        </button>
        <button
          className="asset-action-secondary iruka-secondary-button"
          disabled={
            !custodyVerified
            || activePull.redemption?.shipmentAvailable === false
          }
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

  function getVaultCardImageUrl(card: CardPull) {
    return card.imageUrl ?? createRevealImageUrl(
      card,
      t.rarities[card.rarity],
      formatCardPullValue(card)
    );
  }

  function openSellDialog(card: CardPull) {
    if (walletRequired) {
      setWalletPromptSignal((value) => value + 1);
      showNotice(t.feedback.connectWallet);
      return;
    }
    if (!isCardCustodyVerified(card)) {
      showNotice(t.vending.redemptionUnavailable);
      return;
    }
    setSellCardId(card.id);
  }

  function saveMarketplaceListing(card: CardPull, fixedPrice: number) {
    if (!isCardCustodyVerified(card)) {
      showNotice(t.vending.redemptionUnavailable);
      setSellCardId(undefined);
      return;
    }
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

  function enterHome() {
    setShowHomeEntry(false);
    setActiveView("home");
    window.history.replaceState(null, "", "#home");
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
  }

  if (showHomeEntry) {
    return <HomeEntry onEnter={enterHome} />;
  }

  return (
    <main className="product-shell">
      <AppHeader
        activeView={activeView}
        authenticated={isSignedIn}
        connectSignal={walletPromptSignal}
        copy={t.nav}
        externalConnectSignal={externalWalletPromptSignal}
        locale={locale}
        onAuthenticatedChange={setIsSignedIn}
        onExternalWalletChange={setExternalWallet}
        onLocaleChange={setLocale}
        onShowView={showNavigationView}
        onWalletChange={setGiwaWallet}
        walletAuth={walletAuth}
      />

      {activeView === "home" ? (
        <HomeView
          copy={t.home}
          items={marketplaceItems}
          onBrowseCategory={browseMarketplace}
          onEnterVending={() => showView("pull")}
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
              resumeOpening: t.vending.resumeOpening
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
          isAwaitingFulfillment={isAwaitingOnchainFulfillment}
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
          pullDisabled={
            hasGiwaPullContract
            && selectedGiwaBatchState !== "live"
            && !isAwaitingOnchainFulfillment
          }
          recentPulls={sessionPulls}
          resultRef={revealSectionRef}
          selectedPack={selectedPackDetail}
          testnetEnabled={
            hasGiwaPullContract
            && (
              selectedGiwaBatchState === "live"
              || isAwaitingOnchainFulfillment
            )
          }
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
          onOpenSell={openSellDialog}
          onTargetListingHandled={() => setMarketplaceTargetListingId(undefined)}
          ownedCards={collection.filter((card) => card.vaultStatus !== "Sold")}
          targetListingId={marketplaceTargetListingId}
        />
      ) : null}

      {activeView === "events" ? <EventsView copy={t.eventsPage} /> : null}

      {activeView === "account" && walletAuth === "privy" && isSignedIn && giwaWallet ? (
        <AccountView
          cards={collection}
          copy={t.account}
          externalWallet={externalWallet}
          inventoryContent={(
            <>
              <VaultCardList
                cards={accountCards}
                emptyLabel={t.sections.vaultEmpty}
                formatValue={formatCardPullValue}
                getCardImageUrl={getVaultCardImageUrl}
                onSelectCard={setActivePull}
                rarityClassNames={rarityClassNames}
                statusLabels={t.statuses}
              />
              {activePull && accountCards.some((card) => card.id === activePull.id)
                ? renderActivePullActions()
                : null}
            </>
          )}
          onConnectExternalWallet={() =>
            setExternalWalletPromptSignal((value) => value + 1)}
          wallet={giwaWallet}
        />
      ) : null}

      {activeView === "vault" && isSignedIn ? (
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
          getCardImageUrl={getVaultCardImageUrl}
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
        <PackRevealBoundary
          continueLabel={t.revealOverlay.continue}
          key={pendingReveal?.id ?? pendingRevealCard.serial}
          onComplete={completePendingReveal}
        >
          <Suspense fallback={<PackRevealLoading label={t.hero.opening} />}>
            <PackRevealOverlay
              cards={[pendingRevealCard]}
              labels={t.revealOverlay}
              media={{ posterUrl: selectedPackDetail.media.packFrontUrl }}
              onComplete={completePendingReveal}
              receipt={
                onchainPull?.packId === selectedPackDetail.id
                && onchainPull.fulfillment
                  ? {
                      explorerUrl: onchainPull.fulfillment.explorerUrl,
                      requestId: onchainPull.requestId
                    }
                  : undefined
              }
            />
          </Suspense>
        </PackRevealBoundary>
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
