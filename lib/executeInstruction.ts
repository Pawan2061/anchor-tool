import { Transaction, Connection, Keypair } from "@solana/web3.js";
import { Program as AnchorProgram, Idl } from "@coral-xyz/anchor";
import { sendTransaction, TransactionSigner } from "@/lib/solana/transaction";

interface ExecuteInstructionParams {
  program: AnchorProgram<Idl>;
  instructionName: string;
  args: unknown[];
  accounts: Record<string, unknown>;
  connection: Connection;
  signer: TransactionSigner | null;
  keypair?: Keypair | null;
}

export async function executeInstruction({
  program,
  instructionName,
  args,
  accounts,
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

  const signers: Keypair[] = [];

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
    accounts: (accounts: Record<string, unknown>) => {
      instruction: () => Promise<Transaction>;
      rpc?: () => Promise<string>;
    };
    instruction: () => Promise<Transaction>;
    rpc?: () => Promise<string>;
  };

  const finalBuilder = methodBuilder.accounts(accounts || {});

  // Use provider RPC only when the active signer can actually sign via wallet adapter.
  // For imported keypairs we build the instruction and sign/send manually below.
  const canUseProviderRpc = !!signer?.signTransaction && !keypair;
  if (canUseProviderRpc && finalBuilder.rpc) {
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
