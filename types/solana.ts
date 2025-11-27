import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";

export type SolanaNetwork = "mainnet" | "devnet" | "testnet" | "localnet";

export interface NetworkConfig {
  name: SolanaNetwork;
  rpcUrl: string;
  label: string;
}

export type WalletType = "adapter" | "keypair";

export interface Wallet {
  id: string;
  name: string;
  publicKey: PublicKey;
  type: WalletType;
  keypair?: Keypair;
  adapter?: WalletContextState;
  balance?: number;
}

export interface ConnectionState {
  connection: Connection | null;
  network: SolanaNetwork;
  customRpcUrl: string | null;
  isConnected: boolean;
  isLoading: boolean;
}
