import { SolanaNetwork } from "@/types/solana";

export const COMMON_PROGRAMS = {
  systemProgram: "11111111111111111111111111111111",
  tokenProgram: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  token2022Program: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
  associatedTokenProgram: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
  rentSysvar: "SysvarRent111111111111111111111111111111111",
  clockSysvar: "SysvarC1ock11111111111111111111111111111111",
  stakeProgram: "Stake11111111111111111111111111111111111111",
  voteProgram: "Vote111111111111111111111111111111111111111",
  configProgram: "Config1111111111111111111111111111111111111",
  memoProgram: "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
  computeBudgetProgram: "ComputeBudget111111111111111111111111111111",
} as const;

export const TOKEN_MINTS: Record<SolanaNetwork, Record<string, string>> = {
  mainnet: {
    usdc: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    usdt: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    sol: "So11111111111111111111111111111111111111112",
  },
  devnet: {
    usdc: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    usdt: "EQCj3cy7Rj5X8TD4Z5X2L8K5X2L8K5X2L8K5X2L8K5X2L",
  },
  testnet: {
    usdc: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    usdt: "EQCj3cy7Rj5X8TD4Z5X2L8K5X2L8K5X2L8K5X2L8K5X2L",
  },
  localnet: {
    usdc: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    usdt: "EQCj3cy7Rj5X8TD4Z5X2L8K5X2L8K5X2L8K5X2L8K5X2L",
  },
};

export function getCommonProgramAddress(
  name: keyof typeof COMMON_PROGRAMS
): string {
  return COMMON_PROGRAMS[name];
}

export function getTokenMintAddress(
  network: SolanaNetwork,
  token: keyof typeof TOKEN_MINTS.mainnet
): string | undefined {
  return TOKEN_MINTS[network]?.[token];
}

export function getSuggestedAddress(
  accountName: string,
  network: SolanaNetwork
): string | null {
  const lowerName = accountName.toLowerCase();

  if (
    lowerName.includes("system") ||
    lowerName === "system_program" ||
    lowerName === "systemprogram"
  ) {
    return COMMON_PROGRAMS.systemProgram;
  }

  if (
    lowerName.includes("token_program") ||
    lowerName === "tokenprogram" ||
    (lowerName.includes("token") && lowerName.includes("program"))
  ) {
    return COMMON_PROGRAMS.tokenProgram;
  }

  if (
    lowerName.includes("associated_token") ||
    lowerName === "associatedtokenprogram" ||
    lowerName === "ata_program"
  ) {
    return COMMON_PROGRAMS.associatedTokenProgram;
  }

  if (lowerName.includes("usdc") && lowerName.includes("mint")) {
    return getTokenMintAddress(network, "usdc") || null;
  }

  if (lowerName.includes("usdt") && lowerName.includes("mint")) {
    return getTokenMintAddress(network, "usdt") || null;
  }

  return null;
}

export function getAccountDescription(accountName: string): string | null {
  const lowerName = accountName.toLowerCase();

  if (lowerName.includes("system") || lowerName === "system_program") {
    return "The Solana System Program - handles account creation and transfers";
  }

  if (
    lowerName.includes("token_program") ||
    lowerName.includes("tokenprogram")
  ) {
    return "The SPL Token Program - handles token operations";
  }

  if (lowerName.includes("associated_token") || lowerName === "ata_program") {
    return "The Associated Token Account Program - creates associated token accounts";
  }

  if (lowerName.includes("authority")) {
    return "The account that has authority/permission to perform this action";
  }

  if (lowerName.includes("mint")) {
    return "The token mint address - identifies a specific token";
  }

  if (lowerName.includes("factory")) {
    return "The factory account - typically a PDA that creates/manages other accounts";
  }

  if (lowerName.includes("user") || lowerName.includes("owner")) {
    return "The user or owner account";
  }

  if (lowerName.includes("payer")) {
    return "The account that pays for transaction fees";
  }

  return null;
}
