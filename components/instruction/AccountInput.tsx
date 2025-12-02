"use client";

import { useState } from "react";
import { Copy, Check, Wallet } from "lucide-react";
import { Idl } from "@coral-xyz/anchor";
import { isValidPublicKey, formatPublicKey } from "@/lib/utils/validation";
import { useWalletStore } from "@/stores/walletStore";

type IdlAccountItem = Idl["instructions"][number]["accounts"][number];

function isIdlAccount(
  account: IdlAccountItem
): account is Extract<IdlAccountItem, { isMut?: boolean }> {
  return "isMut" in account;
}

interface AccountInputProps {
  account: IdlAccountItem;
  index: number;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function AccountInput({
  account,
  index,
  value,
  onChange,
  error,
}: AccountInputProps) {
  const [copied, setCopied] = useState(false);
  const { getActiveWallet } = useWalletStore();
  const activeWallet = getActiveWallet();

  const accountName = account.name || `Account ${index + 1}`;
  const isSigner = isIdlAccount(account) && account.isSigner;
  const isOptional = isIdlAccount(account) && account.isOptional;
  const isMutable = isIdlAccount(account) && account.isMut;

  const handleUseActiveWallet = () => {
    if (activeWallet) {
      onChange(activeWallet.publicKey.toString());
    }
  };

  const handleCopy = () => {
    if (value && isValidPublicKey(value)) {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          <span className="flex items-center gap-2">
            {accountName}
            {isSigner && (
              <span className="text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                Signer
              </span>
            )}
            {isOptional && (
              <span className="text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded">
                Optional
              </span>
            )}
            {isMutable && (
              <span className="text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                Mutable
              </span>
            )}
          </span>
        </label>
        {isSigner && activeWallet && (
          <button
            type="button"
            onClick={handleUseActiveWallet}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
          >
            <Wallet className="w-3 h-3" />
            Use Active
          </button>
        )}
      </div>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter public key..."
          className={`w-full px-3 py-2 pr-20 border rounded-md bg-white dark:bg-slate-950 font-mono text-sm text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            error
              ? "border-red-300 dark:border-red-700"
              : "border-slate-300 dark:border-slate-700"
          }`}
        />
        {value && isValidPublicKey(value) && (
          <button
            type="button"
            onClick={handleCopy}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            title="Copy address"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
      {value && isValidPublicKey(value) && (
        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
          {formatPublicKey(value, 8)}
        </p>
      )}
    </div>
  );
}
