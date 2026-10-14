import type { PrivyClientConfig } from "@privy-io/react-auth";

export const privyConfig: PrivyClientConfig = {
  loginMethods: ["wallet", "google", "email"],
  appearance: {
    accentColor: "#F8C9DA",
    theme: "light",
    logo: "/brand/iruka-main-logo.png"
  },
  embeddedWallets: {
    ethereum: { createOnLogin: "off" },
    solana: { createOnLogin: "off" }
  }
};
