import type {EIP1193Provider} from "@privy-io/react-auth";
export type GiwaWallet={address:string;getEthereumProvider:()=>Promise<EIP1193Provider>;switchChain:(chainId:number)=>Promise<void>};
