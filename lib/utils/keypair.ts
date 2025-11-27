import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

export function generateKeypair(): Keypair {
  return Keypair.generate();
}

export function keypairFromSecretKey(
  secretKey: Uint8Array | number[]
): Keypair {
  return Keypair.fromSecretKey(
    secretKey instanceof Uint8Array ? secretKey : new Uint8Array(secretKey)
  );
}

export function keypairFromBase58(base58: string): Keypair {
  try {
    const secretKey = bs58.decode(base58);
    return Keypair.fromSecretKey(secretKey);
  } catch (error) {
    throw new Error("Invalid base58 secret key");
  }
}

export function keypairToBase58(keypair: Keypair): string {
  return bs58.encode(keypair.secretKey);
}

export function parseKeypairFromString(input: string): Keypair {
  try {
    return keypairFromBase58(input);
  } catch {
    try {
      const arr = JSON.parse(input);
      return keypairFromSecretKey(arr);
    } catch {
      throw new Error(
        "Invalid keypair format. Expected base58 string or JSON array."
      );
    }
  }
}
