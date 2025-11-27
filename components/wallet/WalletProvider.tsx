"use client";

import { useMemo, useEffect } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { useNetworkStore } from "@/stores/networkStore";
import { useWalletStore } from "@/stores/walletStore";
import { useWallet } from "@solana/wallet-adapter-react";
import { NETWORK_CONFIGS } from "@/lib/solana/connection";
import "@solana/wallet-adapter-react-ui/styles.css";

function WalletSync() {
  const { connection } = useNetworkStore();
  const { setConnectedWallet } = useWalletStore();
  const wallet = useWallet();

  useEffect(() => {
    setConnectedWallet(wallet, connection);
  }, [wallet.connected, wallet.publicKey, connection, setConnectedWallet]);

  return null;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { network, customRpcUrl } = useNetworkStore();

  // Use the same endpoint as our network store
  const endpoint = useMemo(() => {
    const config = NETWORK_CONFIGS[network];
    return customRpcUrl || config.rpcUrl;
  }, [network, customRpcUrl]);

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletSync />
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
