"use client";

import { Wifi, WifiOff, ChevronDown } from "lucide-react";
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
    <div className="space-y-3">
      <label className="block text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">
        Network
      </label>
      <div className="relative">
        <select
          value={network}
          onChange={(e) => setNetwork(e.target.value as SolanaNetwork)}
          disabled={isLoading}
          className="w-full px-4 py-2.5 pr-10 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] text-sm font-medium text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer transition-all hover:border-[var(--foreground-muted)]"
        >
          {networks.map((net) => (
            <option key={net} value={net}>
              {NETWORK_CONFIGS[net].label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)] pointer-events-none" />
      </div>

      {/* Status Indicator */}
      <div className="flex items-center gap-2 px-1">
        {isLoading ? (
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--warning)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--warning)]"></span>
            </span>
            <span className="text-xs font-medium text-[var(--foreground-muted)]">
              Connecting...
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--success)]"></span>
                </span>
                <Wifi className="w-3.5 h-3.5 text-[var(--success)]" />
                <span className="text-xs font-medium text-[var(--success)]">
                  Connected
                </span>
              </>
            ) : (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--error)]"></span>
                </span>
                <WifiOff className="w-3.5 h-3.5 text-[var(--error)]" />
                <span className="text-xs font-medium text-[var(--error)]">
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
