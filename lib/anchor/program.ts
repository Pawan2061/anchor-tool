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

function normalizeInstructionAccount(
  account: Idl["instructions"][number]["accounts"][number]
): Idl["instructions"][number]["accounts"][number] {
  if (typeof account === "string") {
    return account;
  }
  if (typeof account !== "object" || account === null) {
    return account;
  }

  const accountObj = account as Record<string, unknown>;
  const normalizedAccount: {
    name: string;
    isMut?: boolean;
    isSigner?: boolean;
    isOptional?: boolean;
    address?: string;
    pda?: unknown;
    accounts?: Idl["instructions"][number]["accounts"];
  } = {
    name: (accountObj.name as string) || "",
  };

  if ("writable" in accountObj) {
    normalizedAccount.isMut = accountObj.writable === true;
  } else if ("isMut" in accountObj) {
    normalizedAccount.isMut = accountObj.isMut === true;
  }

  if ("signer" in accountObj) {
    normalizedAccount.isSigner = accountObj.signer === true;
  } else if ("isSigner" in accountObj) {
    normalizedAccount.isSigner = accountObj.isSigner === true;
  }

  if ("optional" in accountObj) {
    normalizedAccount.isOptional = accountObj.optional === true;
  } else if ("isOptional" in accountObj) {
    normalizedAccount.isOptional = accountObj.isOptional === true;
  }

  if ("address" in accountObj) {
    normalizedAccount.address = accountObj.address as string;
  }

  if ("pda" in accountObj) {
    normalizedAccount.pda = accountObj.pda;
  }

  if ("accounts" in accountObj && Array.isArray(accountObj.accounts)) {
    normalizedAccount.accounts = (
      accountObj.accounts as Idl["instructions"][number]["accounts"]
    ).map((child) => normalizeInstructionAccount(child));
  }

  return normalizedAccount as Idl["instructions"][number]["accounts"][number];
}

function normalizeIdl(idl: Idl): Idl {
  const normalized = JSON.parse(JSON.stringify(idl)) as Idl & {
    version?: string;
    name?: string;
  };
  if (normalized.metadata) {
    const metadata = normalized.metadata as Record<string, unknown>;
    if (metadata.version && !normalized.version) {
      normalized.version = metadata.version as string;
    }
    if (metadata.name && !normalized.name) {
      normalized.name = metadata.name as string;
    }
  }

  if (!normalized.version) {
    throw new Error("IDL is missing 'version' field (check metadata.version)");
  }
  if (!normalized.name) {
    throw new Error("IDL is missing 'name' field (check metadata.name)");
  }

  if (normalized.instructions && Array.isArray(normalized.instructions)) {
    normalized.instructions = normalized.instructions.map((instruction) => {
      if (instruction.accounts && Array.isArray(instruction.accounts)) {
        instruction.accounts = instruction.accounts.map((account) =>
          normalizeInstructionAccount(account)
        ) as Idl["instructions"][number]["accounts"];
      }
      return instruction;
    });
  }

  if (normalized.types && Array.isArray(normalized.types)) {
    normalized.types = normalized.types.map((typeDef) => {
      if (typeof typeDef === "object" && typeDef !== null) {
        const type = typeDef as Record<string, unknown>;
        if (type.type && typeof type.type === "object" && type.type !== null) {
          const typeObj = type.type as Record<string, unknown>;
          if (!typeObj.kind) {
            console.warn(
              `Type "${type.name}" is missing 'kind' property in its type definition`
            );
          }
        }
      }
      return typeDef;
    });
  }

  if (!normalized.accounts) {
    normalized.accounts = [];
  } else if (Array.isArray(normalized.accounts)) {
    normalized.accounts = normalized.accounts
      .map((accountDef) => {
        if (typeof accountDef === "object" && accountDef !== null) {
          const acc = accountDef as Record<string, unknown>;
          if ("type" in acc && acc.type) {
            const typeObj = acc.type as Record<string, unknown>;
            if (
              typeof typeObj === "object" &&
              typeObj !== null &&
              !typeObj.kind
            ) {
              const typeName = acc.name as string;
              const matchingType = normalized.types?.find(
                (t) => t.name === typeName
              );
              if (matchingType && matchingType.type) {
                acc.type = matchingType.type;
              } else {
                console.warn(
                  `Account "${typeName}" has a type field but missing 'kind' property and no matching type found`
                );
              }
            }
          } else if (acc.name && normalized.types) {
            const typeName = acc.name as string;
            const matchingType = normalized.types.find(
              (t) => t.name === typeName
            );
            if (matchingType && matchingType.type) {
              acc.type = matchingType.type;
            }
          }
        }
        return accountDef;
      })
      .filter((acc) => {
        if (typeof acc === "object" && acc !== null) {
          const accObj = acc as Record<string, unknown>;
          if ("type" in accObj && accObj.type) {
            const typeObj = accObj.type as Record<string, unknown>;
            if (typeof typeObj === "object" && typeObj !== null) {
              return !!typeObj.kind;
            }
          }
        }
        return true;
      });
  }

  if (!normalized.instructions) {
    normalized.instructions = [];
  }

  if (normalized.version && normalized.name && normalized.metadata) {
  }

  return normalized as Idl;
}

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
      (async <T extends Transaction | VersionedTransaction>(): Promise<T> => {
        throw new Error("Wallet does not support transaction signing");
      }),
    signAllTransactions:
      wallet.signAllTransactions ||
      (async <T extends Transaction | VersionedTransaction>(): Promise<T[]> => {
        throw new Error("Wallet does not support batch transaction signing");
      }),
  } as Wallet;

  const provider = new AnchorProvider(connection, anchorWallet, {
    commitment: "confirmed",
  });

  if (!program.idl) {
    throw new Error(
      `Program IDL is missing. Please ensure the program has a valid IDL loaded. ` +
        `Program: ${program.name || program.id}`
    );
  }

  if (typeof program.idl !== "object" || program.idl === null) {
    throw new Error(
      `Invalid IDL structure. IDL must be an object. ` +
        `Program: ${program.name || program.id}`
    );
  }

  const idlWithVersion = program.idl as Idl & { version?: string };
  const metadata = program.idl.metadata as Record<string, unknown> | undefined;
  const version =
    idlWithVersion.version || (metadata?.version as string | undefined);
  const idlWithName = program.idl as Idl & { name?: string };
  const name = idlWithName.name || (metadata?.name as string | undefined);

  if (!version) {
    throw new Error(
      `IDL is missing required "version" field. Please ensure your IDL is complete. ` +
        `Program: ${program.name || program.id}`
    );
  }

  if (!name) {
    throw new Error(
      `IDL is missing required "name" field. Please ensure your IDL is complete. ` +
        `Program: ${program.name || program.id}`
    );
  }

  if (!("instructions" in program.idl)) {
    throw new Error(
      `IDL is missing required "instructions" field. Please ensure your IDL is complete. ` +
        `Program: ${program.name || program.id}`
    );
  }

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
    const normalizedIdl = normalizeIdl(program.idl);

    console.log("Normalized IDL structure:", {
      version: normalizedIdl.version,
      name: normalizedIdl.name,
      hasMetadata: !!normalizedIdl.metadata,
      instructionsCount: normalizedIdl.instructions?.length || 0,
      typesCount: normalizedIdl.types?.length || 0,
      accountsCount: normalizedIdl.accounts?.length || 0,
      firstInstruction: normalizedIdl.instructions?.[0]
        ? {
            name: normalizedIdl.instructions[0].name,
            accountsCount: normalizedIdl.instructions[0].accounts?.length || 0,
            firstAccount: normalizedIdl.instructions[0].accounts?.[0],
          }
        : null,
      firstType: normalizedIdl.types?.[0]
        ? {
            name: normalizedIdl.types[0].name,
            hasType: !!normalizedIdl.types[0].type,
            typeKind: (normalizedIdl.types[0].type as Record<string, unknown>)
              ?.kind,
          }
        : null,
    });

    const idlString = JSON.stringify(normalizedIdl, null, 2);
    console.log(
      "Full normalized IDL (first 2000 chars):",
      idlString.substring(0, 2000)
    );

    try {
      return new AnchorProgram(normalizedIdl, program.programId, provider);
    } catch (anchorError) {
      if (normalizedIdl.accounts && normalizedIdl.accounts.length > 0) {
        console.warn(
          "Retrying without top-level accounts array due to Anchor compatibility issue"
        );
        const idlWithoutAccounts = {
          ...normalizedIdl,
          accounts: [],
        };
        try {
          return new AnchorProgram(
            idlWithoutAccounts as Idl,
            program.programId,
            provider
          );
        } catch (retryError) {
          console.error("Retry without accounts also failed:", retryError);
        }
      }
      console.error("Anchor Program creation failed:", {
        error:
          anchorError instanceof Error
            ? anchorError.message
            : String(anchorError),
        stack: anchorError instanceof Error ? anchorError.stack : undefined,
        normalizedIdlKeys: Object.keys(normalizedIdl),
        hasVersion: !!normalizedIdl.version,
        hasName: !!normalizedIdl.name,
        instructionsStructure: normalizedIdl.instructions?.map((i) => ({
          name: i.name,
          accountsCount: i.accounts?.length || 0,
          argsCount: i.args?.length || 0,
        })),
        typesStructure: normalizedIdl.types?.map((t) => ({
          name: t.name,
          hasType: !!t.type,
          typeKind: (t.type as Record<string, unknown>)?.kind,
        })),
        accountsStructure: normalizedIdl.accounts?.map((a) => {
          if (typeof a === "object" && a !== null) {
            const acc = a as Record<string, unknown>;
            return {
              name: acc.name,
              hasType: "type" in acc,
              typeKind:
                acc.type && typeof acc.type === "object"
                  ? (acc.type as Record<string, unknown>)?.kind
                  : undefined,
            };
          }
          return { type: typeof a };
        }),
      });
      throw anchorError;
    }
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes("kind") ||
        error.message.includes("Cannot read properties of undefined")
      ) {
        const idlInfo = {
          hasVersion: !!(program.idl as Idl & { version?: string }).metadata
            ?.version,
          hasName: !!(program.idl as Idl & { name?: string }).metadata?.name,
          hasMetadata: !!program.idl.metadata,
          instructionsCount: program.idl.instructions?.length || 0,
          typesCount: program.idl.types?.length || 0,
        };

        throw new Error(
          `IDL Structure Error: The IDL appears to be missing required fields or has an invalid structure. ` +
            `This often happens when: ` +
            `1. The IDL is incomplete or corrupted, ` +
            `2. Required fields like "instructions" or "accounts" are missing, ` +
            `3. Enum types are not properly structured, ` +
            `4. Types are missing the "kind" property in their type definition. ` +
            `Please verify your IDL file is complete and valid.\n\n` +
            `Program: ${program.name || program.id}\n` +
            `IDL Info: ${JSON.stringify(idlInfo, null, 2)}\n` +
            `Original error: ${error.message}\n\n` +
            `Tip: Ensure all types in the "types" array have a "type" object with a "kind" property (e.g., "struct" or "enum").`
        );
      }

      if (error.message.includes("Type not found")) {
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
    }
    throw error;
  }
}
