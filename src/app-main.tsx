import { PrivyProvider } from "@privy-io/react-auth";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { privyConfig } from "./privyConfig";
import "./styles.css";

export function renderApplication(root: HTMLElement) {
  const privyAppId = import.meta.env.VITE_PRIVY_APP_ID?.trim();
  const privyClientId = import.meta.env.VITE_PRIVY_CLIENT_ID?.trim();
  const app = privyAppId ? (
    <PrivyProvider appId={privyAppId} clientId={privyClientId || undefined} config={privyConfig}>
      <App authEnabled />
    </PrivyProvider>
  ) : <App />;

  ReactDOM.createRoot(root).render(<React.StrictMode>{app}</React.StrictMode>);
}
