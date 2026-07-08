import { PrivyProvider, type PrivyClientConfig } from "@privy-io/react-auth";
import React from "react";
import ReactDOM from "react-dom/client";
import { defineChain } from "viem";
import App from "./App";
import "./styles.css";

export const giwaSepolia = defineChain({
  id: 91342,
  name: "GIWA Sepolia",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH"
  },
  rpcUrls: {
    default: {
      http: ["https://sepolia-rpc.giwa.io"]
    }
  },
  blockExplorers: {
    default: {
      name: "GIWA Sepolia Explorer",
      url: "https://sepolia-explorer.giwa.io"
    }
  },
  testnet: true
});

const privyConfig: PrivyClientConfig = {
  loginMethods: ["wallet", "email", "google"],
  appearance: {
    accentColor: "#1677FF",
    showWalletLoginFirst: true,
    theme: "light",
    walletChainType: "ethereum-only",
    walletList: ["metamask", "phantom", "okx_wallet"]
  },
  embeddedWallets: {
    ethereum: {
      createOnLogin: "users-without-wallets"
    }
  },
  supportedChains: [giwaSepolia]
};

const privyAppId = import.meta.env.VITE_PRIVY_APP_ID;
const privyClientId = import.meta.env.VITE_PRIVY_CLIENT_ID;

const app = privyAppId ? (
  <PrivyProvider
    appId={privyAppId}
    clientId={privyClientId || undefined}
    config={privyConfig}
  >
    <App walletAuth="privy" />
  </PrivyProvider>
) : (
  <App walletAuth="disabled" />
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {app}
  </React.StrictMode>
);
