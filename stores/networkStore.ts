import { create } from "zustand";
import { SolanaNetwork, ConnectionState } from "@/types/solana";
import { createConnection, checkConnection } from "@/lib/solana/connection";

interface NetworkStore extends ConnectionState {
  setNetwork: (network: SolanaNetwork) => void;
  setCustomRpcUrl: (url: string | null) => void;
  connect: () => Promise<void>;
  disconnect: () => void;
  checkConnectionStatus: () => Promise<void>;
}

export const useNetworkStore = create<NetworkStore>((set, get) => ({
  connection: null,
  network: "devnet",
  customRpcUrl: null,
  isConnected: false,
  isLoading: false,

  setNetwork: (network: SolanaNetwork) => {
    set({ network, isConnected: false });
    get().connect();
  },

  setCustomRpcUrl: (customRpcUrl: string | null) => {
    set({ customRpcUrl, isConnected: false });
    get().connect();
  },

  connect: async () => {
    const { network, customRpcUrl } = get();
    set({ isLoading: true, isConnected: false });

    try {
      const connection = createConnection(network, customRpcUrl);
      const isConnected = await checkConnection(connection);

      set({
        connection: isConnected ? connection : null,
        isConnected,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to connect:", error);
      set({
        connection: null,
        isConnected: false,
        isLoading: false,
      });
    }
  },

  disconnect: () => {
    set({
      connection: null,
      isConnected: false,
    });
  },

  checkConnectionStatus: async () => {
    const { connection } = get();
    if (!connection) return;

    const isConnected = await checkConnection(connection);
    set({ isConnected });
  },
}));
