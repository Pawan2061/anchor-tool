"use client";

import { Wifi, WifiOff } from "lucide-react";
import { useNetworkStore } from "@/stores/networkStore";
import { NETWORK_CONFIGS } from "@/lib/solana/connection";
import { SolanaNetwork } from "@/types/solana";
import { useEffect } from "react";

export function NetworkSelector() {
  const { network, setNetwork, connect, isConnected, isLoading } =
    useNetworkStore();

  useEffect(() => {
    connect();
  }, [connect]);

  const networks: SolanaNetwork[] = [
    "mainnet",
    "devnet",
    "testnet",
    "localnet",
  ];

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
        Network
      </label>
      <select
        value={network}
        onChange={(e) => setNetwork(e.target.value as SolanaNetwork)}
        disabled={isLoading}
        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {networks.map((net) => (
          <option key={net} value={net}>
            {NETWORK_CONFIGS[net].label}
          </option>
        ))}
      </select>
      <div className="flex items-center gap-2 px-1">
        {isLoading ? (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Connecting...
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            {isConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  Connected
                </span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-red-500" />
                <span className="text-xs font-medium text-red-600 dark:text-red-400">
                  Disconnected
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
