"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Wallet, Sparkles, Info } from "lucide-react";
import { Idl } from "@coral-xyz/anchor";
import { isValidPublicKey, formatPublicKey } from "@/lib/utils/validation";
import { useWalletStore } from "@/stores/walletStore";
import { useNetworkStore } from "@/stores/networkStore";
import {
  getSuggestedAddress,
  getAccountDescription,
} from "@/lib/utils/commonAddresses";

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
  const { network } = useNetworkStore();
  const activeWallet = getActiveWallet();

  const accountName = account.name || `Account ${index + 1}`;
  const isSigner = isIdlAccount(account) && account.isSigner;
  const isOptional = isIdlAccount(account) && account.isOptional;
  const isMutable = isIdlAccount(account) && account.isMut;

  const suggestedAddress = accountName
    ? getSuggestedAddress(accountName, network)
    : null;
  const description = accountName ? getAccountDescription(accountName) : null;

  useEffect(() => {
    if (!value && suggestedAddress && accountName) {
      const lowerName = accountName.toLowerCase();
      if (
        lowerName === "system_program" ||
        lowerName === "systemprogram" ||
        (lowerName.includes("token_program") && !lowerName.includes("mint")) ||
        lowerName.includes("associated_token")
      ) {
        onChange(suggestedAddress);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUseActiveWallet = () => {
    if (activeWallet) {
      onChange(activeWallet.publicKey.toString());
    }
  };

  const handleUseSuggested = () => {
    if (suggestedAddress) {
      onChange(suggestedAddress);
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {accountName}
            </span>
            {isSigner && (
              <span className="inline-flex items-center text-xs font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                Signer
              </span>
            )}
            {isOptional && (
              <span className="inline-flex items-center text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                Optional
              </span>
            )}
            {isMutable && (
              <span className="inline-flex items-center text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                Mutable
              </span>
            )}
          </div>
        </label>
        <div className="flex items-center gap-2">
          {suggestedAddress && !value && (
            <button
              type="button"
              onClick={handleUseSuggested}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-md transition-colors"
              title={`Use ${accountName} address`}
            >
              <Sparkles className="w-3 h-3" />
              Auto-fill
            </button>
          )}
          {isSigner && activeWallet && (
            <button
              type="button"
              onClick={handleUseActiveWallet}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md transition-colors"
            >
              <Wallet className="w-3 h-3" />
              Use Active
            </button>
          )}
        </div>
      </div>
      {description && (
        <div className="flex items-start gap-2.5 p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/30 rounded-lg">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
            {description}
          </p>
        </div>
      )}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            suggestedAddress
              ? `Enter public key or use auto-fill...`
              : "Enter public key..."
          }
          className={`w-full px-4 py-2.5 pr-12 border rounded-lg bg-white dark:bg-slate-950 font-mono text-sm text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all ${
            error
              ? "border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-950/20"
              : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600"
          }`}
        />
        {value && isValidPublicKey(value) && (
          <button
            type="button"
            onClick={handleCopy}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
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
        <p className="text-xs text-red-600 dark:text-red-400 font-medium">
          {error}
        </p>
      )}
      {value && isValidPublicKey(value) && !error && (
        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-md inline-block">
          {formatPublicKey(value, 8)}
        </p>
      )}
    </div>
  );
}
