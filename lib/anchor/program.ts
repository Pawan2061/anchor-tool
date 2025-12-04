import {
  Program as AnchorProgram,
  AnchorProvider,
  Wallet,
} from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { Idl } from "@coral-xyz/anchor";
import { Program } from "@/types/anchor";
import { validateIdlTypes } from "./validateIdl";

export function createAnchorProgram(
  program: Program,
  connection: Connection,
  wallet: {
    publicKey: PublicKey;
    signTransaction?: (
      tx: Transaction | VersionedTransaction
    ) => Promise<Transaction | VersionedTransaction>;
    signAllTransactions?: (
      txs: (Transaction | VersionedTransaction)[]
    ) => Promise<(Transaction | VersionedTransaction)[]>;
  } | null
): AnchorProgram<Idl> {
  if (!wallet) {
    throw new Error("Wallet not connected");
  }

  const anchorWallet = {
    publicKey: wallet.publicKey,
    signTransaction:
      wallet.signTransaction ||
      (async <T extends Transaction | VersionedTransaction>(
        _tx: T
      ): Promise<T> => {
        throw new Error("Wallet does not support transaction signing");
      }),
    signAllTransactions:
      wallet.signAllTransactions ||
      (async <T extends Transaction | VersionedTransaction>(
        _txs: T[]
      ): Promise<T[]> => {
        throw new Error("Wallet does not support batch transaction signing");
      }),
  } as Wallet;

  const provider = new AnchorProvider(connection, anchorWallet, {
    commitment: "confirmed",
  });

  const validation = validateIdlTypes(program.idl);
  if (!validation.isValid) {
    const missingTypesList = validation.missingTypes.join(", ");
    const hasTypes = program.idl.types && Array.isArray(program.idl.types);
    const availableTypes =
      hasTypes && program.idl.types
        ? program.idl.types.map((t: { name: string }) => t.name).join(", ")
        : "none";

    let errorMessage = `IDL Validation Error: Missing type definition(s): ${missingTypesList}\n\n`;

    if (!hasTypes) {
      errorMessage += `Your IDL is missing the "types" array entirely.\n`;
    } else {
      errorMessage += `The "types" array exists but is missing: ${missingTypesList}\n`;
      errorMessage += `Available types in IDL: ${availableTypes}\n`;
    }

    errorMessage += `\nPlease ensure your IDL includes a complete "types" array with all custom types used by the program.`;
    if (validation.warnings.length > 0) {
      errorMessage += `\n\nWarnings: ${validation.warnings.join(", ")}`;
    }

    throw new Error(errorMessage);
  }

  try {
    return new AnchorProgram(program.idl, program.programId, provider);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Type not found")) {
      const typeMatch = error.message.match(
        /"defined":\s*\{\s*"name":\s*"([^"]+)"/
      );
      const missingType = typeMatch ? typeMatch[1] : "unknown";

      throw new Error(
        `IDL Error: Anchor cannot find type "${missingType}". ` +
          `This might indicate a mismatch between the IDL structure and Anchor's expectations. ` +
          `Please verify your IDL file is complete and matches the on-chain program.\n\n` +
          `Original error: ${error.message}`
      );
    }
    throw error;
  }
}
