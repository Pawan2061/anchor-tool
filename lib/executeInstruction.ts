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
  const signers: Keypair[] = [];

  idlAccounts.forEach((acct: IdlAccountItem, idx: number) => {
    const key = accountKeys[idx];
    const accountName = typeof acct === "string" ? acct : acct.name;

    if (!accountName) return;

    if (typeof acct === "object" && acct !== null && "address" in acct) {
      const address = (acct as { address?: string }).address;
      if (address) {
        accountObj[accountName] = new PublicKey(address);
        return;
      }
    }

    if (key && !key.equals(PublicKey.default)) {
      accountObj[accountName] = key;

      const isSigner =
        typeof acct === "object" &&
        acct !== null &&
        ("isSigner" in acct
          ? (acct as { isSigner?: boolean }).isSigner
          : "signer" in acct
          ? (acct as { signer?: boolean }).signer
          : false);

      if (isSigner && !key.equals(publicKey)) {
      }
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
      rpc?: () => Promise<string>;
    };
    instruction: () => Promise<Transaction>;
    rpc?: () => Promise<string>;
  };

  const accountsToUse = Object.keys(accountObj).length > 0 ? accountObj : {};
  const finalBuilder = methodBuilder.accounts(accountsToUse);

  if (finalBuilder.rpc) {
    try {
      const signature = await finalBuilder.rpc();
      await connection.confirmTransaction(signature, "confirmed");
      return signature;
    } catch (rpcError) {
      console.error("RPC method failed:", rpcError);
      throw rpcError;
    }
  }

  const instruction = await finalBuilder.instruction();
  const tx = new Transaction().add(instruction);

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.lastValidBlockHeight = lastValidBlockHeight;

  const feePayer = signer?.publicKey || keypair?.publicKey;
  if (!feePayer) {
    throw new Error("No fee payer available");
  }
  tx.feePayer = feePayer;

  if (keypair) {
    tx.sign(keypair, ...signers);
    const signature = await connection.sendRawTransaction(tx.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
    });
    await connection.confirmTransaction(signature, "confirmed");
    return signature;
  } else if (signer?.signTransaction) {
    const signedTx = await signer.signTransaction(tx);
    const signature = await connection.sendRawTransaction(
      signedTx.serialize(),
      {
        skipPreflight: false,
        maxRetries: 3,
      }
    );
    await connection.confirmTransaction(signature, "confirmed");
    return signature;
  }

  const signature = await sendTransaction(tx, connection, signer, keypair);
  await connection.confirmTransaction(signature, "confirmed");
  return signature;
}
