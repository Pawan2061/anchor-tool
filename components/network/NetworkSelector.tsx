"use client";

import { useNetworkStore } from "@/stores/networkStore";
import { NETWORK_CONFIGS } from "@/lib/solana/connection";
import { SolanaNetwork } from "@/types/solana";
import { useEffect } from "react";

export function NetworkSelector() {
  const { network, setNetwork, connect, isConnected, isLoading } =
    useNetworkStore();

  useEffect(() => {
    connect();
  }, []);

  const networks: SolanaNetwork[] = [
    "mainnet",
    "devnet",
    "testnet",
    "localnet",
  ];

  return (
    <div className="flex items-center gap-2">
      <select
        value={network}
        onChange={(e) => setNetwork(e.target.value as SolanaNetwork)}
        disabled={isLoading}
        className="px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {networks.map((net) => (
          <option key={net} value={net}>
            {NETWORK_CONFIGS[net].label}
          </option>
        ))}
      </select>
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            isConnected ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {isLoading
            ? "Connecting..."
            : isConnected
            ? "Connected"
            : "Disconnected"}
        </span>
      </div>
    </div>
  );
}
