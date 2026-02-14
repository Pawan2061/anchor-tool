import { PublicKey } from "@solana/web3.js";
import { Idl } from "@coral-xyz/anchor";

type IdlInstruction = Idl["instructions"][number];
export type IdlAccountItem = IdlInstruction["accounts"][number];

type AccountLike = {
  name?: string;
  address?: string;
  optional?: boolean;
  isOptional?: boolean;
  accounts?: IdlAccountItem[];
  docs?: string[];
};

function asAccountLike(item: IdlAccountItem): AccountLike {
  return item as unknown as AccountLike;
}

export function resolveAccountName(account: IdlAccountItem, index: number): string {
  const value = asAccountLike(account).name;
  return value && value.trim() ? value : `account_${index}`;
}

export function isAccountGroup(
  account: IdlAccountItem
): account is IdlAccountItem & { accounts: IdlInstruction["accounts"] } {
  const maybe = asAccountLike(account).accounts;
  return Array.isArray(maybe);
}

export function isOptionalAccount(account: IdlAccountItem): boolean {
  const maybe = asAccountLike(account);
  return maybe.isOptional === true || maybe.optional === true;
}

export function getAccountAddress(account: IdlAccountItem): string | null {
  const address = asAccountLike(account).address;
  return typeof address === "string" && address.trim() ? address : null;
}

export function getAccountDocs(account: IdlAccountItem): string | null {
  const docs = asAccountLike(account).docs;
  if (!Array.isArray(docs) || docs.length === 0) return null;
  const text = docs.join(" ").trim();
  return text || null;
}

export function buildAccountFieldKey(path: string[]): string {
  return path.join(".");
}

export function collectAccountFieldDefaults(
  accounts: IdlInstruction["accounts"] | undefined,
  parentPath: string[] = []
): Record<string, string> {
  const defaults: Record<string, string> = {};
  if (!accounts) return defaults;

  accounts.forEach((account, index) => {
    const name = resolveAccountName(account, index);
    const path = [...parentPath, name];

    if (isAccountGroup(account)) {
      Object.assign(
        defaults,
        collectAccountFieldDefaults(asAccountLike(account).accounts, path)
      );
      return;
    }

    defaults[buildAccountFieldKey(path)] = "";
  });

  return defaults;
}

export function collectAccountLeafCount(
  accounts: IdlInstruction["accounts"] | undefined
): number {
  if (!accounts) return 0;
  let count = 0;
  accounts.forEach((account) => {
    if (isAccountGroup(account)) {
      count += collectAccountLeafCount(asAccountLike(account).accounts);
      return;
    }
    count += 1;
  });
  return count;
}

export function buildAccountsObjectFromForm(
  accounts: IdlInstruction["accounts"] | undefined,
  data: Record<string, unknown>,
  parentPath: string[] = []
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (!accounts) return result;

  accounts.forEach((account, index) => {
    const name = resolveAccountName(account, index);
    const path = [...parentPath, name];

    if (isAccountGroup(account)) {
      result[name] = buildAccountsObjectFromForm(
        asAccountLike(account).accounts,
        data,
        path
      );
      return;
    }

    const fixedAddress = getAccountAddress(account);
    if (fixedAddress) {
      result[name] = new PublicKey(fixedAddress);
      return;
    }

    const fieldKey = buildAccountFieldKey(path);
    const rawValue = data[fieldKey];
    const value = typeof rawValue === "string" ? rawValue.trim() : "";

    if (!value) {
      if (isOptionalAccount(account)) {
        result[name] = null;
        return;
      }
      throw new Error(`Account ${fieldKey} is required`);
    }

    result[name] = new PublicKey(value);
  });

  return result;
}
