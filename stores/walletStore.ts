import { create } from "zustand";
import { Keypair, Connection, PublicKey } from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { Wallet } from "@/types/solana";

interface WalletStore {
  connectedWallet: Wallet | null; // Wallet from adapter
  importedWallets: Wallet[]; // Imported keypairs
  activeWalletId: string | null;
  setConnectedWallet: (
    adapter: WalletContextState | null,
    connection: Connection | null
  ) => Promise<void>;
  addImportedWallet: (
    name: string,
    keypair: Keypair,
    connection?: Connection | null
  ) => Promise<void>;
  removeImportedWallet: (id: string) => void;
  setActiveWallet: (id: string | null) => void;
  updateWalletBalance: (
    publicKey: PublicKey,
    connection: Connection | null
  ) => Promise<number | null>;
  getActiveWallet: () => Wallet | null;
  getActiveKeypair: () => Keypair | null;
  getActiveSigner: () => {
    publicKey: PublicKey;
    signTransaction?: (tx: any) => Promise<any>;
    signAllTransactions?: (txs: any[]) => Promise<any[]>;
  } | null;
}

export const useWalletStore = create<WalletStore>((set, get) => ({
  connectedWallet: null,
  importedWallets: [],
  activeWalletId: null,

  setConnectedWallet: async (
    adapter: WalletContextState | null,
    connection: Connection | null
  ) => {
    if (!adapter || !adapter.publicKey) {
      set({ connectedWallet: null });
      return;
    }

    const wallet: Wallet = {
      id: "connected-wallet",
      name: adapter.wallet?.adapter?.name || "Connected Wallet",
      publicKey: adapter.publicKey,
      type: "adapter",
      adapter,
      balance: 0,
    };

    set({ connectedWallet: wallet });

    if (connection) {
      const balance = await get().updateWalletBalance(
        adapter.publicKey,
        connection
      );
      if (balance !== null) {
        set((state) => ({
          connectedWallet: state.connectedWallet
            ? { ...state.connectedWallet, balance }
            : null,
        }));
      }
    }
  },

  addImportedWallet: async (
    name: string,
    keypair: Keypair,
    connection?: Connection | null
  ) => {
    const id = `wallet-${Date.now()}`;
    const publicKey = keypair.publicKey;

    const wallet: Wallet = {
      id,
      name,
      publicKey,
      type: "keypair",
      keypair,
      balance: 0,
    };

    set((state) => ({
      importedWallets: [...state.importedWallets, wallet],
      activeWalletId: state.activeWalletId || id,
    }));

    if (connection) {
      const balance = await get().updateWalletBalance(publicKey, connection);
      if (balance !== null) {
        set((state) => ({
          importedWallets: state.importedWallets.map((w) =>
            w.id === id ? { ...w, balance } : w
          ),
        }));
      }
    }
  },

  removeImportedWallet: (id: string) => {
    set((state) => {
      const newWallets = state.importedWallets.filter((w) => w.id !== id);
      const newActiveId =
        state.activeWalletId === id
          ? newWallets.length > 0
            ? newWallets[0].id
            : state.connectedWallet
            ? "connected-wallet"
            : null
          : state.activeWalletId;

      return {
        importedWallets: newWallets,
        activeWalletId: newActiveId,
      };
    });
  },

  setActiveWallet: (id: string | null) => {
    set({ activeWalletId: id });
  },

  updateWalletBalance: async (
    publicKey: PublicKey,
    connection: Connection | null
  ): Promise<number | null> => {
    if (!connection) return null;

    try {
      const balance = await connection.getBalance(publicKey);
      return balance;
    } catch (error) {
      console.error("Failed to update wallet balance:", error);
      return null;
    }
  },

  getActiveWallet: () => {
    const { connectedWallet, importedWallets, activeWalletId } = get();

    if (activeWalletId === "connected-wallet") {
      return connectedWallet;
    }

    if (activeWalletId) {
      return importedWallets.find((w) => w.id === activeWalletId) || null;
    }

    return connectedWallet || importedWallets[0] || null;
  },

  getActiveKeypair: () => {
    const wallet = get().getActiveWallet();
    return wallet?.type === "keypair" ? wallet.keypair || null : null;
  },

  getActiveSigner: () => {
    const wallet = get().getActiveWallet();
    if (!wallet) return null;

    if (wallet.type === "adapter" && wallet.adapter) {
      return {
        publicKey: wallet.publicKey,
        signTransaction: wallet.adapter.signTransaction?.bind(wallet.adapter),
        signAllTransactions: wallet.adapter.signAllTransactions?.bind(
          wallet.adapter
        ),
      };
    }

    if (wallet.type === "keypair" && wallet.keypair) {
      return {
        publicKey: wallet.publicKey,
      };
    }

    return null;
  },
}));
