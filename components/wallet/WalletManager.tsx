"use client";

import { useState, useEffect } from "react";
import {
  Wallet,
  Plus,
  Upload,
  RefreshCw,
  X,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useWalletStore } from "@/stores/walletStore";
import { useNetworkStore } from "@/stores/networkStore";
import { generateKeypair, parseKeypairFromString } from "@/lib/utils/keypair";
import { formatPublicKey, formatLamports } from "@/lib/utils/validation";

export function WalletManager() {
  const {
    connectedWallet,
    importedWallets,
    activeWalletId,
    addImportedWallet,
    removeImportedWallet,
    setActiveWallet,
    updateWalletBalance,
    getActiveWallet,
  } = useWalletStore();
  const { connection } = useNetworkStore();
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  const [showImport, setShowImport] = useState(false);
  const [importValue, setImportValue] = useState("");
  const [importName, setImportName] = useState("");
  const [error, setError] = useState("");

  const activeWallet = getActiveWallet();

  useEffect(() => {
    if (connection && activeWallet) {
      updateWalletBalance(activeWallet.publicKey, connection).then(
        (balance) => {
          if (balance !== null && activeWallet) {
          }
        }
      );
    }
  }, [connection, activeWallet, updateWalletBalance]);

  const handleGenerate = async () => {
    const keypair = generateKeypair();
    const name = `Wallet ${importedWallets.length + 1}`;
    await addImportedWallet(name, keypair, connection);
  };

  const handleImport = async () => {
    setError("");
    if (!importName.trim()) {
      setError("Please enter a wallet name");
      return;
    }

    try {
      const keypair = parseKeypairFromString(importValue);
      await addImportedWallet(importName, keypair, connection);
      setImportValue("");
      setImportName("");
      setShowImport(false);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Invalid keypair format";
      setError(errorMessage);
    }
  };

  const handleRefreshBalance = async () => {
    if (activeWallet && connection) {
      await updateWalletBalance(activeWallet.publicKey, connection);
    }
  };

  const allWallets = [
    ...(connectedWallet ? [connectedWallet] : []),
    ...importedWallets,
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-[var(--foreground-muted)]" />
          <h3 className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">
            External Wallet
          </h3>
        </div>

        {connected && publicKey ? (
          <div className="p-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-[var(--success)] flex-shrink-0" />
                  <p className="font-semibold text-sm text-[var(--foreground)] truncate">
                    {connectedWallet?.name || "Connected Wallet"}
                  </p>
                </div>
                <p className="text-xs text-[var(--foreground-muted)] font-mono mt-1">
                  {formatPublicKey(publicKey)}
                </p>
              </div>
              <button
                onClick={disconnect}
                className="ml-2 p-2 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--error)] hover:bg-[var(--error-subtle)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {connectedWallet && (
              <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                <span className="text-xs text-[var(--foreground-muted)]">
                  Balance
                </span>
                <span className="text-sm font-bold text-[var(--foreground)]">
                  {connectedWallet.balance !== undefined
                    ? formatLamports(connectedWallet.balance)
                    : "Loading..."}
                </span>
              </div>
            )}
            {activeWalletId !== "connected-wallet" && (
              <button
                onClick={() => setActiveWallet("connected-wallet")}
                className="mt-3 w-full px-3 py-2.5 text-xs font-semibold rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition-colors"
              >
                Set as Active
              </button>
            )}
            {activeWalletId === "connected-wallet" && (
              <div className="mt-3 px-3 py-2 text-xs font-semibold rounded-lg bg-[var(--accent-subtle)] text-[var(--accent)] text-center">
                ✓ Active Wallet
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setVisible(true)}
            className="w-full px-4 py-3.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            <Wallet className="w-4 h-4" />
            Connect Wallet
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[var(--foreground-muted)]" />
            <h3 className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">
              Keypairs
            </h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleGenerate}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--background-secondary)] text-[var(--foreground)] hover:bg-[var(--surface-hover)] border border-[var(--border)] transition-all flex items-center gap-1.5"
              title="Generate new keypair"
            >
              <Plus className="w-3.5 h-3.5" />
              Generate
            </button>
            <button
              onClick={() => setShowImport(!showImport)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                showImport
                  ? "bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent)]"
                  : "bg-[var(--background-secondary)] text-[var(--foreground)] hover:bg-[var(--surface-hover)] border border-[var(--border)]"
              }`}
              title="Import keypair"
            >
              <Upload className="w-3.5 h-3.5" />
              Import
            </button>
          </div>
        </div>

        {showImport && (
          <div className="p-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] space-y-4 animate-slide-up">
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-2">
                Wallet Name
              </label>
              <input
                type="text"
                placeholder="My Wallet"
                value={importName}
                onChange={(e) => setImportName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-2">
                Keypair (Base58 or JSON)
              </label>
              <textarea
                placeholder="Paste keypair..."
                value={importValue}
                onChange={(e) => setImportValue(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] font-mono text-xs text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all resize-none"
                rows={4}
              />
            </div>
            {error && (
              <div className="px-3 py-2.5 rounded-lg bg-[var(--error-subtle)] border border-[var(--error)]/20">
                <p className="text-xs text-[var(--error)]">{error}</p>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleImport}
                className="flex-1 px-3 py-2.5 text-xs font-semibold rounded-lg bg-[var(--success)] hover:bg-emerald-600 text-white transition-colors"
              >
                Import
              </button>
              <button
                onClick={() => {
                  setShowImport(false);
                  setError("");
                  setImportValue("");
                  setImportName("");
                }}
                className="px-4 py-2.5 text-xs font-semibold rounded-lg bg-[var(--background-secondary)] text-[var(--foreground)] hover:bg-[var(--surface-hover)] border border-[var(--border)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {activeWallet && activeWalletId !== "connected-wallet" && (
        <div className="p-4 rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent)]/20">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-[var(--accent)] flex-shrink-0" />
                <p className="font-semibold text-sm text-[var(--foreground)] truncate">
                  {activeWallet.name}
                </p>
              </div>
              <p className="text-xs text-[var(--foreground-muted)] font-mono mt-1">
                {formatPublicKey(activeWallet.publicKey)}
              </p>
            </div>
            <button
              onClick={handleRefreshBalance}
              className="ml-2 p-2 rounded-lg text-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-colors"
              title="Refresh balance"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-[var(--accent)]/20">
            <span className="text-xs text-[var(--foreground-muted)]">
              Balance
            </span>
            <span className="text-sm font-bold text-[var(--foreground)]">
              {activeWallet.balance !== undefined
                ? formatLamports(activeWallet.balance)
                : "Loading..."}
            </span>
          </div>
        </div>
      )}

      {allWallets.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">
            All Wallets ({allWallets.length})
          </p>
          <div className="space-y-2">
            {allWallets.map((wallet) => (
              <div
                key={wallet.id}
                className={`p-3 rounded-xl cursor-pointer transition-all ${
                  wallet.id === activeWalletId
                    ? "bg-[var(--accent-subtle)] border-2 border-[var(--accent)]"
                    : "bg-[var(--surface-elevated)] border border-[var(--border)] hover:border-[var(--foreground-muted)]"
                }`}
                onClick={() => setActiveWallet(wallet.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm text-[var(--foreground)] truncate">
                        {wallet.name}
                      </p>
                      {wallet.type === "adapter" && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--success-subtle)] text-[var(--success)]">
                          EXTERNAL
                        </span>
                      )}
                      {wallet.type === "keypair" && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--background-secondary)] text-[var(--foreground-muted)]">
                          KEYPAIR
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--foreground-muted)] font-mono">
                      {formatPublicKey(wallet.publicKey)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {wallet.id === activeWalletId && (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-[var(--accent)] text-white">
                        ACTIVE
                      </span>
                    )}
                    {wallet.type === "keypair" &&
                      wallet.id !== activeWalletId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImportedWallet(wallet.id);
                          }}
                          className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--error)] hover:bg-[var(--error-subtle)] transition-colors"
                          title="Remove wallet"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {allWallets.length === 0 && !connected && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-[var(--background-secondary)] flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-[var(--foreground-muted)]" />
          </div>
          <p className="text-sm font-semibold text-[var(--foreground)] mb-1">
            No wallets yet
          </p>
          <p className="text-xs text-[var(--foreground-muted)]">
            Connect a wallet or generate a keypair
          </p>
        </div>
      )}
    </div>
  );
}
