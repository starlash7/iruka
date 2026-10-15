/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PRIVY_APP_ID?: string;
  readonly VITE_PRIVY_CLIENT_ID?: string;
  readonly VITE_GIWA_RPC_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
