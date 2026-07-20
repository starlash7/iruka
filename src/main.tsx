import { PrivyProvider, type PrivyClientConfig } from "@privy-io/react-auth";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { giwaSepolia } from "./giwaChain.ts";
import "./styles.css";
import "./vending-layout.css";
import "./vending-purchase.css";
import "./vending-odds.css";
import "./vending-sections.css";
import "./vending-inventory.css";
import "./vending-responsive.css";

const privyConfig: PrivyClientConfig = {
  loginMethods: ["wallet", "email", "google"],
  appearance: {
    accentColor: "#1677FF",
    showWalletLoginFirst: true,
    theme: "light",
    walletChainType: "ethereum-only",
    walletList: ["phantom", "okx_wallet", "metamask"]
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
