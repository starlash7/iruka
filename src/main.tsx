import { PrivyProvider, type PrivyClientConfig } from "@privy-io/react-auth";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { giwaSepolia } from "./giwaChain.ts";
import "./account.css";
import "./account-profile.css";
import "./account-balance.css";
import "./account-inventory.css";
import "./account-funds.css";
import "./account-assets.css";
import "./account-deposit.css";
import "./account-transfer.css";
import "./account-stats.css";
import "./styles.css";
import "./pack-reveal.css";
import "./pack-reveal-effects.css";
import "./pack-reveal-tear.css";
import "./pack-reveal-card.css";
import "./pack-reveal-summary.css";
import "./pack-reveal-motion.css";
import "./pack-reveal-responsive.css";
import "./profile-menu.css";
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
    walletList: ["metamask", "phantom", "okx_wallet"]
  },
  embeddedWallets: {
    ethereum: {
      createOnLogin: "all-users"
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
