import { PublicKey, Transaction } from "@solana/web3.js";
import { Program } from "@/types/anchor";

interface ExecuteInstructionParams {
  program: Program;
  instructionName: string;
  args: unknown[];
  accountKeys: (PublicKey | null)[];
  idlAccounts: any[];
  connection: any;
  publicKey: PublicKey | null;
  sendTransaction: any;
}

export async function executeInstruction({
  program,
  instructionName,
  args,
  accountKeys,
  idlAccounts,
  connection,
  publicKey,
  sendTransaction,
}: ExecuteInstructionParams) {
  if (!publicKey) throw new Error("Wallet not connected");

  const accountObj: Record<string, PublicKey> = {};

  idlAccounts.forEach((acct: any, idx: number) => {
    const key = accountKeys[idx];

    if (key && !key.equals(PublicKey.default)) {
      accountObj[acct.name] = key;
    }
  });

  const methodBuilder = (program as any)[instructionName](...args);

  const ix = await methodBuilder.accounts(accountObj).instruction();

  const tx = new Transaction().add(ix);

  const signature = await sendTransaction(tx, connection);

  await connection.confirmTransaction(signature, "confirmed");

  return signature;
}
