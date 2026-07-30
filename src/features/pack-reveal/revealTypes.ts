export type PackRevealLabels = {
  continue: string;
  edition: string;
  rarity: string;
  serial: string;
  skip: string;
  slideToOpen: string;
  soundOff: string;
  soundOn: string;
  viewReceipt: string;
};

export type RevealMedia = {
  posterUrl?: string;
};

export type RevealReceipt = {
  explorerUrl: string;
  requestId: bigint;
};
