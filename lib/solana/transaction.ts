import {
  Connection,
  Transaction,
  PublicKey,
  Keypair,
  VersionedTransaction,
} from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";

export interface TransactionSigner {
  publicKey: PublicKey;
  signTransaction?: (tx: Transaction) => Promise<Transaction>;
  signAllTransactions?: (txs: Transaction[]) => Promise<Transaction[]>;
}

export async function sendTransaction(
  transaction: Transaction,
  connection: Connection,
  signer: TransactionSigner | null,
  keypair?: Keypair | null
): Promise<string> {
  if (!signer && !keypair) {
    throw new Error("No signer or keypair provided");
  }

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;

  const feePayer = signer?.publicKey || keypair?.publicKey;
  if (!feePayer) {
    throw new Error("No fee payer available");
  }
  transaction.feePayer = feePayer;

  if (keypair) {
    transaction.sign(keypair);
  } else if (signer?.signTransaction) {
    const signedTx = await signer.signTransaction(transaction);
    transaction = signedTx;
  } else {
    throw new Error("No signing method available");
  }

  const signature = await connection.sendRawTransaction(
    transaction.serialize(),
    {
      skipPreflight: false,
      maxRetries: 3,
    }
  );

  return signature;
}
