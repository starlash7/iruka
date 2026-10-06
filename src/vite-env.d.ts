/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_IRUKA_DEPLOYMENT?: string;
  readonly VITE_GIWA_RPC_URL?: string;
  readonly VITE_GIWA_PACK_BATCH_ADDRESS?: string;
  readonly VITE_MONAD_RPC_URL?: string;
  readonly VITE_MONAD_PACK_BATCH_ADDRESS?: string;
}
