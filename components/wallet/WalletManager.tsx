"use client";

import { useState, useEffect } from "react";
import { Wallet, Plus, Upload, RefreshCw, X, CheckCircle2 } from "lucide-react";
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
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            External Wallet
          </h3>
        </div>
        {connected && publicKey ? (
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <p className="font-medium text-sm text-slate-900 dark:text-slate-50 truncate">
                    {connectedWallet?.name || "Connected Wallet"}
                  </p>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1 break-all">
                  {formatPublicKey(publicKey)}
                </p>
              </div>
              <button
                onClick={disconnect}
                className="ml-2 px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {connectedWallet && (
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  Balance
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {connectedWallet.balance !== undefined
                    ? formatLamports(connectedWallet.balance)
                    : "Loading..."}
                </span>
              </div>
            )}
            {activeWalletId !== "connected-wallet" && (
              <button
                onClick={() => setActiveWallet("connected-wallet")}
                className="mt-3 w-full px-3 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Set as Active
              </button>
            )}
            {activeWalletId === "connected-wallet" && (
              <div className="mt-3 px-3 py-1.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md text-center">
                Active Wallet
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setVisible(true)}
            className="w-full px-4 py-3 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Wallet className="w-4 h-4" />
            Connect Wallet
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Keypairs
            </h3>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={handleGenerate}
              className="px-2.5 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md transition-colors flex items-center gap-1.5"
              title="Generate new keypair"
            >
              <Plus className="w-3.5 h-3.5" />
              Generate
            </button>
            <button
              onClick={() => setShowImport(!showImport)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                showImport
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              }`}
              title="Import keypair"
            >
              <Upload className="w-3.5 h-3.5" />
              Import
            </button>
          </div>
        </div>

        {showImport && (
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Wallet Name
              </label>
              <input
                type="text"
                placeholder="My Wallet"
                value={importName}
                onChange={(e) => setImportName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Keypair
              </label>
              <textarea
                placeholder="Paste keypair (base58 or JSON array)"
                value={importValue}
                onChange={(e) => setImportValue(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
              />
            </div>
            {error && (
              <div className="px-3 py-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-md">
                <p className="text-xs text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleImport}
                className="flex-1 px-3 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors"
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
                className="px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {activeWallet && activeWalletId !== "connected-wallet" && (
        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-900 rounded-lg shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <p className="font-medium text-sm text-slate-900 dark:text-slate-50 truncate">
                  {activeWallet.name}
                </p>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-mono mt-1 break-all">
                {formatPublicKey(activeWallet.publicKey)}
              </p>
            </div>
            <button
              onClick={handleRefreshBalance}
              className="ml-2 px-2 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md transition-colors flex items-center gap-1 flex-shrink-0"
              title="Refresh balance"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-blue-200 dark:border-blue-900">
            <span className="text-xs text-slate-600 dark:text-slate-400">
              Balance
            </span>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              {activeWallet.balance !== undefined
                ? formatLamports(activeWallet.balance)
                : "Loading..."}
            </span>
          </div>
        </div>
      )}

      {allWallets.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
            All Wallets ({allWallets.length})
          </p>
          <div className="space-y-2">
            {allWallets.map((wallet) => (
              <div
                key={wallet.id}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  wallet.id === activeWalletId
                    ? "border-blue-500 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-sm"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm"
                }`}
                onClick={() => setActiveWallet(wallet.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm text-slate-900 dark:text-slate-50 truncate">
                        {wallet.name}
                      </p>
                      {wallet.type === "adapter" && (
                        <span className="text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded flex-shrink-0">
                          Connected
                        </span>
                      )}
                      {wallet.type === "keypair" && (
                        <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded flex-shrink-0">
                          Keypair
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono break-all">
                      {formatPublicKey(wallet.publicKey)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {wallet.id === activeWalletId && (
                      <span className="text-xs font-medium bg-blue-600 text-white px-2 py-1 rounded">
                        Active
                      </span>
                    )}
                    {wallet.type === "keypair" &&
                      wallet.id !== activeWalletId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImportedWallet(wallet.id);
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
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
        <div className="text-center py-8">
          <Wallet className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
            No wallets yet
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Connect a wallet or import a keypair to get started
          </p>
        </div>
      )}
    </div>
  );
}
