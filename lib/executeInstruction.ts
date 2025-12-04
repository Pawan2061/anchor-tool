import { PublicKey, Transaction, Connection, Keypair } from "@solana/web3.js";
import { Program as AnchorProgram, Idl } from "@coral-xyz/anchor";
import { sendTransaction, TransactionSigner } from "@/lib/solana/transaction";

type IdlAccountItem = Idl["instructions"][number]["accounts"][number];

interface ExecuteInstructionParams {
  program: AnchorProgram<Idl>;
  instructionName: string;
  args: unknown[];
  accountKeys: (PublicKey | null)[];
  idlAccounts: IdlAccountItem[];
  connection: Connection;
  signer: TransactionSigner | null;
  keypair?: Keypair | null;
}

export async function executeInstruction({
  program,
  instructionName,
  args,
  accountKeys,
  idlAccounts,
  connection,
  signer,
  keypair,
}: ExecuteInstructionParams) {
  if (!signer && !keypair) {
    throw new Error("Wallet not connected");
  }

  const publicKey = signer?.publicKey || keypair?.publicKey;
  if (!publicKey) {
    throw new Error("No public key available");
  }

  const accountObj: Record<string, PublicKey> = {};

  idlAccounts.forEach((acct: IdlAccountItem, idx: number) => {
    const key = accountKeys[idx];
    const accountName = typeof acct === "string" ? acct : acct.name;

    if (key && !key.equals(PublicKey.default) && accountName) {
      accountObj[accountName] = key;
    }
  });

  const methods = (
    program as unknown as {
      methods: Record<string, (...args: unknown[]) => unknown>;
    }
  ).methods;
  const method = methods[instructionName];
  if (!method) {
    throw new Error(`Instruction "${instructionName}" not found in program`);
  }

  const methodBuilder = method(...args) as {
    accounts: (accounts: Record<string, PublicKey>) => {
      instruction: () => Promise<Transaction>;
    };
    instruction: () => Promise<Transaction>;
  };

  const accountsToUse = Object.keys(accountObj).length > 0 ? accountObj : {};
  const finalBuilder = methodBuilder.accounts(accountsToUse);

  const instruction = await finalBuilder.instruction();

  const tx = new Transaction().add(instruction);

  const signature = await sendTransaction(tx, connection, signer, keypair);

  await connection.confirmTransaction(signature, "confirmed");

  return signature;
}
