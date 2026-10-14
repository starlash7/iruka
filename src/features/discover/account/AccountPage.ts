export type AccountCopy = {
  account: string;
  addFunds: string;
  address: string;
  amount: string;
  back: string;
  balance: string;
  balanceError: string;
  cards: string;
  cardsCollected: string;
  chain: string;
  close: string;
  collectionSummary: string;
  comingSoon: string;
  connectExchange: string;
  connectWallet: string;
  copied: string;
  copyAddress: string;
  destination: string;
  done: string;
  enterAmount: string;
  enterRecipient: string;
  empty: string;
  ethereum: string;
  faucet: string;
  fromConnectedWallet: string;
  giwaSepolia: string;
  inventory: string;
  inventoryValue: string;
  listed: string;
  loadingBalance: string;
  network: string;
  networkFee: string;
  overview: string;
  receiveChain: string;
  receiveToken: string;
  retry: string;
  shownInWallet: string;
  shipping: string;
  signOut: string;
  testEth: string;
  token: string;
  transfer: string;
  transferComplete: string;
  transferCrypto: string;
  transferFailed: string;
  transferring: string;
  upbit: string;
  viewTransaction: string;
  wallet: string;
  walletDetails: string;
  withdraw: string;
  youWillReceive: string;
};

export type AccountBalance =
  | { status: "loading" }
  | { label: string; status: "ready" }
  | { status: "error" };

