import type { PrivyClientConfig } from "@privy-io/react-auth";

export const privyConfig: PrivyClientConfig = {
  loginMethods: ["google", "email"],
  appearance: {
    accentColor: "#1677FF",
    theme: "light",
    logo: "/brand/iruka-main-logo.png"
  },
  embeddedWallets: {
    ethereum: { createOnLogin: "off" },
    solana: { createOnLogin: "off" }
  }
};
