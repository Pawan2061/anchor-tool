"use client";

import { useState, useEffect } from "react";
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
  }, [connection, activeWallet?.publicKey]);

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
    } catch (err: any) {
      setError(err.message || "Invalid keypair format");
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Wallets</h3>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Connect Wallet
        </p>
        {connected && publicKey ? (
          <div className="p-4 border border-green-300 dark:border-green-700 rounded-md bg-green-50 dark:bg-green-900/20">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-medium text-sm text-green-800 dark:text-green-200">
                  {connectedWallet?.name || "Connected Wallet"}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 font-mono mt-1">
                  {formatPublicKey(publicKey)}
                </p>
              </div>
              <button
                onClick={disconnect}
                className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
              >
                Disconnect
              </button>
            </div>
            {connectedWallet && (
              <div className="text-sm text-green-700 dark:text-green-300">
                <span>Balance: </span>
                <span className="font-medium">
                  {connectedWallet.balance !== undefined
                    ? formatLamports(connectedWallet.balance)
                    : "Loading..."}
                </span>
              </div>
            )}
            {activeWalletId !== "connected-wallet" && (
              <button
                onClick={() => setActiveWallet("connected-wallet")}
                className="mt-2 px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
              >
                Use This Wallet
              </button>
            )}
            {activeWalletId === "connected-wallet" && (
              <span className="mt-2 inline-block px-2 py-1 text-xs bg-blue-500 text-white rounded">
                Active
              </span>
            )}
          </div>
        ) : (
          <button
            onClick={() => setVisible(true)}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Connect Wallet
          </button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Imported Keypairs
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleGenerate}
              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Generate
            </button>
            <button
              onClick={() => setShowImport(!showImport)}
              className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Import
            </button>
          </div>
        </div>

        {showImport && (
          <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-md space-y-2">
            <input
              type="text"
              placeholder="Wallet name"
              value={importName}
              onChange={(e) => setImportName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
            />
            <textarea
              placeholder="Paste keypair (base58 or JSON array)"
              value={importValue}
              onChange={(e) => setImportValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 font-mono text-sm"
              rows={3}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleImport}
                className="px-3 py-1.5 text-sm bg-green-500 text-white rounded hover:bg-green-600"
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
                className="px-3 py-1.5 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {activeWallet && (
        <div className="p-4 border border-blue-300 dark:border-blue-700 rounded-md bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-medium text-sm text-blue-800 dark:text-blue-200">
                Active: {activeWallet.name}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-mono mt-1">
                {formatPublicKey(activeWallet.publicKey)}
              </p>
            </div>
            <button
              onClick={handleRefreshBalance}
              className="px-2 py-1 text-xs bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded hover:bg-blue-300 dark:hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <span>Balance: </span>
            <span className="font-medium">
              {activeWallet.balance !== undefined
                ? formatLamports(activeWallet.balance)
                : "Loading..."}
            </span>
          </div>
        </div>
      )}

      {allWallets.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">All Wallets:</p>
          {allWallets.map((wallet) => (
            <div
              key={wallet.id}
              className={`p-3 border rounded-md cursor-pointer transition-colors ${
                wallet.id === activeWalletId
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
              onClick={() => setActiveWallet(wallet.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{wallet.name}</p>
                    {wallet.type === "adapter" && (
                      <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded">
                        Connected
                      </span>
                    )}
                    {wallet.type === "keypair" && (
                      <span className="text-xs bg-gray-500 text-white px-1.5 py-0.5 rounded">
                        Imported
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-mono mt-1">
                    {formatPublicKey(wallet.publicKey)}
                  </p>
                </div>
                {wallet.id === activeWalletId && (
                  <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                    Active
                  </span>
                )}
                {wallet.type === "keypair" && wallet.id !== activeWalletId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImportedWallet(wallet.id);
                    }}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {allWallets.length === 0 && !connected && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          Connect a wallet or import a keypair to get started.
        </p>
      )}
    </div>
  );
}
