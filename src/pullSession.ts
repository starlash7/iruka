// A return to the same wallet is a new session after logout or a wallet switch.
export function createPullSession() {
  let walletAddress: string | undefined;
  let version = 0;
  return {
    updateWallet(address: string | undefined) {
      const nextAddress = address?.toLowerCase();
      if (nextAddress !== walletAddress) {
        walletAddress = nextAddress;
        version += 1;
      }
      return version;
    },
    isCurrent(sessionVersion: number) {
      return sessionVersion === version;
    }
  };
}
