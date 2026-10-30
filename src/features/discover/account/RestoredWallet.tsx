import {flushSync} from 'react-dom';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {usePrivy,useWallets,useCreateWallet,useConnectWallet} from '@privy-io/react-auth';
import {AccountWalletPanel} from './AccountWalletPanel';
import {AccountAddFundsDialog} from './AccountAddFundsDialog';
import {AccountWithdrawDialog} from './AccountWithdrawDialog';
import {accountCopy as copy} from './accountCopy';
import type {AccountBalance} from './AccountPage';
import type {GiwaWallet} from './walletTypes';
import {formatGiwaNativeBalance,getGiwaNativeBalance} from './giwaBalance';
import {clearPendingGiwaTransfer,createPendingGiwaTransfer,getPendingGiwaTransfer,savePendingGiwaTransfer,type PendingGiwaTransfer} from './giwaPendingTransfer';
import {GiwaTransferRevertedError,sendGiwaNativeTransfer,waitForGiwaNativeTransfer} from './giwaTransfer';
import {setTransferBusy} from './transferActivity';
import {AccountLibrary} from './AccountLibrary';
import './restored-account.css';

function WalletLoading(){
 const [delayed,setDelayed]=useState(false);
 useEffect(()=>{const timer=window.setTimeout(()=>setDelayed(true),15000);return()=>window.clearTimeout(timer);},[]);
 return delayed?<div role="alert"><p>지갑 연결 확인이 지연되고 있어요.</p><button className="iruka-secondary-button" onClick={()=>window.location.reload()}>다시 연결 확인</button></div>:<p role="status">지갑 확인 중…</p>;
}

export function RestoredWallet(){
 const {authenticated,linkWallet}=usePrivy();const {wallets,ready}=useWallets();const {createWallet}=useCreateWallet();
 const [error,setError]=useState('');const [creating,setCreating]=useState(false);
 const {connectWallet}=useConnectWallet({onSuccess:()=>setError(''),onError:()=>setError('지갑 연결을 완료하지 못했어요.')});
 const owned=wallets.filter(w=>w.type==='ethereum'&&w.linked);
 const wallet=owned.find(w=>w.walletClientType.startsWith('privy'))??owned[0];
 const external=wallets.find(w=>w.type==='ethereum'&&!w.walletClientType.startsWith('privy')&&w.address.toLowerCase()!==wallet?.address.toLowerCase());
 if(!authenticated)return null;

 return <div className="restored-account" id="account-overview">{!ready?<WalletLoading/>:wallet?<WalletPanel key={wallet.address} wallet={wallet} externalWallet={external} onConnectExternalWallet={()=>connectWallet()}/>:<section className="account-wallet-panel"><h2>Iruka Wallet</h2><button className="iruka-action-button" disabled={creating} onClick={async()=>{setCreating(true);setError('');try{await createWallet();}catch{setError('지갑을 만들지 못했어요. 다시 시도해 주세요.');}finally{setCreating(false);}}}>{creating?'지갑 만드는 중…':'Iruka 지갑 만들기'}</button><button className="iruka-secondary-button" onClick={()=>linkWallet()}>기존 지갑 연결</button></section>}{error&&<p role="alert">{error}</p>}<AccountLibrary/></div>;
}
export function createAccountBalanceLoader(
  readBalance: (address: string) => Promise<bigint> = getGiwaNativeBalance
) {
  let requestGeneration = 0;

  return async function loadAccountBalance(
    address: string,
    setBalance: (balance: AccountBalance) => void
  ) {
    const requestId = ++requestGeneration;
    setBalance({ status: "loading" });

    try {
      const nextBalance = await readBalance(address);
      if (requestId !== requestGeneration) return;
      setBalance({ label: formatGiwaNativeBalance(nextBalance), status: "ready" });
    } catch {
      if (requestId !== requestGeneration) return;
      setBalance({ status: "error" });
    }
  };
}

function WalletPanel({wallet,externalWallet,onConnectExternalWallet}:{wallet:GiwaWallet;externalWallet?:GiwaWallet;onConnectExternalWallet:()=>void}){
  const walletAddress = wallet.address;
  const [balance, setBalance] = useState<AccountBalance>({ status: "loading" });
  const [copied, setCopied] = useState(false);
  const [fundsDialog, setFundsDialog] = useState<"add" | "withdraw">();
  const [pendingTransfer, setPendingTransfer] = useState<PendingGiwaTransfer>();
  const [isTransferBusy, setIsTransferBusy] = useState(false);
  const localTransferLock = useRef(false);
  const transferBusyRef = localTransferLock;
  const pendingTransferRef = useRef<PendingGiwaTransfer>();
  const walletAddressRef = useRef(walletAddress);
  walletAddressRef.current = walletAddress;
  const loadLatestBalance = useMemo(() => createAccountBalanceLoader(), []);

  const loadBalance = useCallback(
    () => loadLatestBalance(walletAddress, (nextBalance) => {
      if (walletAddressRef.current === walletAddress) setBalance(nextBalance);
    }),
    [loadLatestBalance, walletAddress]
  );

  useEffect(() => {
    void loadBalance();
  }, [loadBalance]);

  useEffect(() => {
    const storedTransfer = pendingTransfer?.walletAddress.toLowerCase() === walletAddress.toLowerCase()
      ? pendingTransfer
      : getPendingGiwaTransfer(undefined, walletAddress);
    pendingTransferRef.current = storedTransfer;
    setPendingTransfer(storedTransfer);
    if (!storedTransfer) return;

    const transactionHash = storedTransfer.transactionHash;
    let active = true;
    let retryTimer: number | undefined;
    async function confirmTransfer() {
      try {
        await waitForGiwaNativeTransfer(transactionHash);
        if (!active) return;
        clearPendingGiwaTransfer(undefined, walletAddress, transactionHash);
        pendingTransferRef.current = undefined;
        setPendingTransfer(undefined);
        void loadBalance();
      } catch (error) {
        if (!active) return;
        if (error instanceof GiwaTransferRevertedError) {
          clearPendingGiwaTransfer(undefined, walletAddress, transactionHash);
          pendingTransferRef.current = undefined;
          setPendingTransfer(undefined);
        } else {
          retryTimer = window.setTimeout(() => void confirmTransfer(), 5000);
        }
      }
    }
    void confirmTransfer();

    return () => {
      active = false;
      window.clearTimeout(retryTimer);
    };
  }, [loadBalance, walletAddress, pendingTransfer?.transactionHash]);

  useEffect(() => {
    function refreshBalance() {
      void loadBalance();
      const storedTransfer = getPendingGiwaTransfer(undefined, walletAddress);
      if (storedTransfer && storedTransfer.transactionHash !== pendingTransferRef.current?.transactionHash) {
        pendingTransferRef.current = storedTransfer;
        setPendingTransfer(storedTransfer);
      }
    }

    window.addEventListener("focus", refreshBalance);
    return () => window.removeEventListener("focus", refreshBalance);
  }, [loadBalance]);

  async function copyAddress() {
    try {
      await window.navigator.clipboard.writeText(walletAddress);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  async function transferGiwaFunds(
    direction: PendingGiwaTransfer["direction"],
    sender: GiwaWallet,
    destination: string,
    amount: string
  ) {
    const storedTransfer = getPendingGiwaTransfer(undefined, walletAddress);
    if (storedTransfer) {
      pendingTransferRef.current = storedTransfer;
      setPendingTransfer(storedTransfer);
    }
    if (transferBusyRef.current || pendingTransferRef.current) {
      throw new Error("A GIWA transfer is already confirming");
    }

    transferBusyRef.current = true;
    setIsTransferBusy(true);
    setTransferBusy(true);

    try {
      const receipt = await sendGiwaNativeTransfer(
        sender,
        destination,
        amount,
        {
          onSubmitted: (transactionHash) => {
            const transfer = createPendingGiwaTransfer({
              direction,
              transactionHash,
              walletAddress
            });
            pendingTransferRef.current = transfer;
            savePendingGiwaTransfer(undefined, transfer);
            setPendingTransfer(transfer);
          }
        }
      );
      clearPendingGiwaTransfer(
        undefined,
        walletAddress,
        receipt.transactionHash
      );
      pendingTransferRef.current = undefined;
      setPendingTransfer(undefined);
      return receipt;
    } catch (error) {
      if (error instanceof GiwaTransferRevertedError) {
        const transfer = getPendingGiwaTransfer(
          undefined,
          walletAddress
        );
        if (transfer) {
          clearPendingGiwaTransfer(
            undefined,
            transfer.walletAddress,
            transfer.transactionHash
          );
          pendingTransferRef.current = undefined;
          setPendingTransfer(undefined);
        }
      }
      throw error;
    } finally {
      transferBusyRef.current = false;
      setIsTransferBusy(false);
      setTransferBusy(false);

    }
  }

 const locked=isTransferBusy||Boolean(pendingTransfer);
 return <>
  <AccountWalletPanel address={walletAddress} balance={balance} copied={copied} copy={copy} onCopyAddress={()=>void copyAddress()} onAddFunds={()=>setFundsDialog('add')} onRetryBalance={()=>void loadBalance()} onWithdraw={()=>setFundsDialog('withdraw')} transferPending={locked}/>
  <AccountAddFundsDialog address={walletAddress} balance={balance} copied={copied} copy={copy} externalWalletAddress={externalWallet?.address} onClose={()=>setFundsDialog(undefined)} onConnectWallet={()=>{flushSync(()=>setFundsDialog(undefined));onConnectExternalWallet();}} onCopyAddress={()=>void copyAddress()} onTransfer={amount=>externalWallet?transferGiwaFunds('deposit',externalWallet,walletAddress,amount):Promise.reject(new Error('No connected wallet'))} onTransferComplete={()=>void loadBalance()} open={fundsDialog==='add'}/>
  
  <AccountWithdrawDialog balance={balance} copy={copy} onClose={()=>setFundsDialog(undefined)} onTransfer={(destination,amount)=>transferGiwaFunds('withdraw',wallet,destination,amount)} onTransferComplete={()=>void loadBalance()} open={fundsDialog==='withdraw'}/>
 </>;
}
