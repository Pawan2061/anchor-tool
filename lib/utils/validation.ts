import { PublicKey } from "@solana/web3.js";

export function isValidPublicKey(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

export function isValidBase58(str: string): boolean {
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
  return base58Regex.test(str);
}

export function formatPublicKey(
  pubkey: PublicKey | string,
  chars: number = 4
): string {
  const str = typeof pubkey === "string" ? pubkey : pubkey.toString();
  if (str.length <= chars * 2) return str;
  return `${str.slice(0, chars)}...${str.slice(-chars)}`;
}

export function formatLamports(lamports: number): string {
  return (lamports / 1e9).toFixed(4) + " SOL";
}
