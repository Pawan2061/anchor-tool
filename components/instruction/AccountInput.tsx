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
      {/* Label Row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <label className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-[var(--foreground)]">
            {accountName}
          </span>
          <div className="flex gap-1.5">
            {isSigner && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--success-subtle)] text-[var(--success)]">
                SIGNER
              </span>
            )}
            {isOptional && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--warning-subtle)] text-[var(--warning)]">
                OPTIONAL
              </span>
            )}
            {isMutable && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--info-subtle)] text-[var(--info)]">
                MUT
              </span>
            )}
          </div>
        </label>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {suggestedAddress && !value && (
            <button
              type="button"
              onClick={handleUseSuggested}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-[var(--accent-subtle)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-all"
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
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-[var(--background-secondary)] text-[var(--foreground)] hover:bg-[var(--surface-hover)] border border-[var(--border)] transition-all"
            >
              <Wallet className="w-3 h-3" />
              Use Wallet
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      {description && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[var(--info-subtle)] border border-[var(--info)]/20">
          <Info className="w-4 h-4 text-[var(--info)] mt-0.5 flex-shrink-0" />
          <p className="text-xs text-[var(--info)] leading-relaxed">
            {description}
          </p>
        </div>
      )}

      {/* Input Field */}
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
          className={`w-full px-4 py-3 pr-12 rounded-xl bg-[var(--background-secondary)] border font-mono text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all ${
            error
              ? "border-[var(--error)] bg-[var(--error-subtle)]"
              : "border-[var(--border)] hover:border-[var(--foreground-muted)]"
          }`}
        />
        {value && isValidPublicKey(value) && (
          <button
            type="button"
            onClick={handleCopy}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
            title="Copy address"
          >
            {copied ? (
              <Check className="w-4 h-4 text-[var(--success)]" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs font-medium text-[var(--error)]">{error}</p>
      )}

      {/* Formatted Address */}
      {value && isValidPublicKey(value) && !error && (
        <p className="text-xs font-mono text-[var(--foreground-muted)] px-3 py-1.5 rounded-lg bg-[var(--background-secondary)] inline-block">
          {formatPublicKey(value, 8)}
        </p>
      )}
    </div>
  );
}
