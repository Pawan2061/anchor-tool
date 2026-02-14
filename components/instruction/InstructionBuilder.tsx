"use client";

import { useState, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Code2,
  Users,
  FileText,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  Zap,
  BookOpen,
  Anchor,
} from "lucide-react";
import { Program } from "@/types/anchor";
import { Idl } from "@coral-xyz/anchor";
import { AccountInput } from "./AccountInput";
import { ArgumentInput } from "./ArgumentInput";
import { isValidPublicKey } from "@/lib/utils/validation";
import { parseValue, getDefaultValue } from "@/lib/anchor/instruction";
import { useNetworkStore } from "@/stores/networkStore";
import { useWalletStore } from "@/stores/walletStore";
import { createAnchorProgram } from "@/lib/anchor/program";
import { executeInstruction } from "@/lib/executeInstruction";
import {
  IdlAccountItem,
  buildAccountFieldKey,
  buildAccountsObjectFromForm,
  collectAccountFieldDefaults,
  collectAccountLeafCount,
  getAccountDocs,
  getAccountAddress,
  isAccountGroup,
  isOptionalAccount,
  resolveAccountName,
} from "@/lib/anchor/accounts";
import {
  COMMON_PROGRAMS,
  getTokenMintAddress,
} from "@/lib/utils/commonAddresses";

type IdlInstruction = Idl["instructions"][number];
type IdlField = IdlInstruction["args"][number];

function resolveArgName(arg: IdlField, fallback: string): string {
  const normalizeName = (name: unknown): string | null => {
    if (typeof name === "string") {
      return name;
    }
    if (typeof name === "object" && name !== null && "name" in name) {
      return normalizeName((name as { name?: unknown }).name);
    }
    return null;
  };

  return normalizeName(arg.name) ?? fallback;
}

function isIdlAccount(
  account: IdlAccountItem
): account is Extract<IdlAccountItem, { isMut?: boolean }> {
  return "isMut" in account;
}

interface InstructionBuilderProps {
  program: Program;
  instruction: IdlInstruction;
}

export function InstructionBuilder({
  program,
  instruction,
}: InstructionBuilderProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showCommonAddresses, setShowCommonAddresses] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { connection, network } = useNetworkStore();
  const { getActiveWallet, getActiveKeypair, getActiveSigner } =
    useWalletStore();

  const buildValidationSchema = () => {
    const schema: Record<string, z.ZodTypeAny> = {};

    const addAccountSchema = (
      accounts: IdlInstruction["accounts"] | undefined,
      parentPath: string[] = []
    ) => {
      if (!accounts) return;

      accounts.forEach((account, index) => {
        const accountName = resolveAccountName(account, index);
        const path = [...parentPath, accountName];

        if (isAccountGroup(account)) {
          addAccountSchema(account.accounts, path);
          return;
        }

        if (getAccountAddress(account)) {
          return;
        }

        const fieldKey = buildAccountFieldKey(path);
        if (isOptionalAccount(account)) {
          schema[fieldKey] = z
            .string()
            .optional()
            .refine(
              (val) => !val || isValidPublicKey(val),
              "Must be a valid Solana public key"
            );
        } else {
          schema[fieldKey] = z
            .string()
            .min(1, "Account is required")
            .refine(isValidPublicKey, "Must be a valid Solana public key");
        }
      });
    };
    addAccountSchema(instruction.accounts);

    if (instruction.args) {
      instruction.args.forEach((arg, index) => {
        const argName = resolveArgName(arg, `arg_${index}`);
        const type = arg.type;

        if (typeof type === "string") {
          if (type === "bool") {
            schema[argName] = z.boolean();
          } else if (type === "string") {
            schema[argName] = z.string();
          } else if (type === "publicKey") {
            schema[argName] = z
              .string()
              .refine(isValidPublicKey, "Must be a valid Solana public key");
          } else {
            schema[argName] = z.union([z.number(), z.string()]);
          }
        } else {
          schema[argName] = z.any();
        }
      });
    }

    return z.object(schema);
  };

  const schema = buildValidationSchema();
  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: (() => {
      const defaults: Record<string, unknown> = {};
      Object.assign(defaults, collectAccountFieldDefaults(instruction.accounts));
      instruction.args?.forEach((arg, index) => {
        const argName = resolveArgName(arg, `arg_${index}`);
        defaults[argName] = getDefaultValue(arg.type);
      });
      return defaults;
    })(),
  });

  const formValues = watch();

  const onSubmit = async (data: Record<string, unknown>) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (!connection) {
        throw new Error(
          "Not connected to network. Please connect to a network first."
        );
      }

      const wallet = getActiveWallet();
      const keypair = getActiveKeypair();
      const signer = getActiveSigner();

      if (!wallet && !keypair) {
        throw new Error("No wallet connected. Please connect a wallet first.");
      }

      const accounts = buildAccountsObjectFromForm(instruction.accounts, data);

      const args: unknown[] = [];
      if (instruction.args) {
        for (const [index, arg] of instruction.args.entries()) {
          const argName = resolveArgName(arg, `arg_${index}`);
          const value = data[argName];
          args.push(parseValue(value, arg.type, program.idl.types));
        }
      }

      console.log("Instruction data:", {
        program: program.programId.toString(),
        instruction: instruction.name,
        accounts,
        args,
      });

      const anchorProgram = createAnchorProgram(program, connection, signer);

      const signature = await executeInstruction({
        program: anchorProgram,
        instructionName: instruction.name,
        args,
        accounts,
        connection,
        signer,
        keypair,
      });

      alert(
        `Transaction executed successfully!\n\nSignature: ${signature}\n\nView on Solana Explorer: https://explorer.solana.com/tx/${signature}?cluster=${program.network}`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to execute instruction";
      setSubmitError(errorMessage);
      console.error("Error executing instruction:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderAccountSummary = (
    accounts: IdlInstruction["accounts"] | undefined,
    parentPath: string[] = []
  ): ReactElement[] => {
    if (!accounts) return [];

    return accounts.flatMap((account, index) => {
      const accountName = resolveAccountName(account, index);
      const path = [...parentPath, accountName];
      const pathLabel = path.join(" > ");
      const accountDocs = getAccountDocs(account);

      if (isAccountGroup(account)) {
        return renderAccountSummary(account.accounts, path);
      }

      return [
        <div
          key={path.join(".")}
          className="flex items-center gap-3 p-3 rounded-lg bg-[var(--background-secondary)]"
        >
          <span className="w-6 h-6 rounded-md bg-[var(--surface)] text-xs font-mono flex items-center justify-center text-[var(--foreground-muted)]">
            {index}
          </span>
          <div className="min-w-0">
            <span className="font-medium text-sm text-[var(--foreground)]">
              {accountName}
            </span>
            {accountDocs && (
              <p className="text-[10px] text-[var(--foreground-muted)] truncate">
                {accountDocs}
              </p>
            )}
            {parentPath.length > 0 && (
              <p className="text-[10px] text-[var(--foreground-muted)] truncate">
                {pathLabel}
              </p>
            )}
          </div>
          <div className="flex gap-1.5 ml-auto">
            {isIdlAccount(account) && account.isMut && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--info-subtle)] text-[var(--info)]">
                MUT
              </span>
            )}
            {isIdlAccount(account) && account.isSigner && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--success-subtle)] text-[var(--success)]">
                SIGNER
              </span>
            )}
            {isOptionalAccount(account) && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--warning-subtle)] text-[var(--warning)]">
                OPT
              </span>
            )}
          </div>
        </div>,
      ];
    });
  };

  const renderAccountInputs = (
    accounts: IdlInstruction["accounts"] | undefined,
    parentPath: string[] = [],
    depth = 0
  ): ReactElement[] => {
    if (!accounts) return [];

    return accounts.flatMap((account, index) => {
      const accountName = resolveAccountName(account, index);
      const path = [...parentPath, accountName];
      const fieldKey = buildAccountFieldKey(path);

      if (isAccountGroup(account)) {
        return [
          <div
            key={fieldKey}
            className={`rounded-xl border border-[var(--border)] p-4 ${
              depth > 0 ? "bg-[var(--background-secondary)]" : "bg-[var(--surface)]"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)] mb-3">
              {path.join(" > ")}
            </p>
            <div className="space-y-4">
              {renderAccountInputs(account.accounts, path, depth + 1)}
            </div>
          </div>,
        ];
      }

      return [
        <AccountInput
          key={fieldKey}
          account={account}
          index={index}
          value={(formValues[fieldKey] as string) || ""}
          onChange={(value) => setValue(fieldKey, value)}
          error={errors[fieldKey]?.message as string | undefined}
          pathLabel={parentPath.length > 0 ? parentPath.join(" > ") : undefined}
          idlDescription={getAccountDocs(account) ?? undefined}
        />,
      ];
    });
  };

  return (
    <div className="min-h-full bg-[var(--background)]">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8 animate-slide-up">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-lg bg-[var(--accent)] flex items-center justify-center flex-shrink-0">
              <Code2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
                {instruction.name}
              </h2>
              <p className="text-sm text-[var(--foreground-muted)] mt-1">
                Build and execute this instruction on {program.network}
              </p>
            </div>
          </div>
        </div>

        <div
          className="mb-6 animate-slide-up"
          style={{ animationDelay: "0.05s" }}
        >
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors group"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-[var(--foreground-muted)] group-hover:text-[var(--accent)] transition-colors" />
              <span className="font-semibold text-sm text-[var(--foreground)]">
                Instruction Details
              </span>
              <span className="px-2 py-0.5 text-xs rounded-md bg-[var(--background-secondary)] text-[var(--foreground-muted)]">
                {collectAccountLeafCount(instruction.accounts)} accounts •{" "}
                {instruction.args?.length || 0} args
              </span>
            </div>
            {showDetails ? (
              <ChevronUp className="w-5 h-5 text-[var(--foreground-muted)]" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[var(--foreground-muted)]" />
            )}
          </button>

          {showDetails && (
            <div className="mt-3 p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] animate-slide-up">
              {instruction.accounts && instruction.accounts.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-4 h-4 text-[var(--accent)]" />
                    <h4 className="text-sm font-semibold text-[var(--foreground)]">
                      Required Accounts
                    </h4>
                  </div>
                  <div className="grid gap-2">
                    {renderAccountSummary(instruction.accounts)}
                  </div>
                </div>
              )}

              {instruction.args && instruction.args.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-4 h-4 text-[var(--accent)]" />
                    <h4 className="text-sm font-semibold text-[var(--foreground)]">
                      Arguments
                    </h4>
                  </div>
                  <div className="grid gap-2">
                    {instruction.args.map((arg: IdlField, index: number) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-lg bg-[var(--background-secondary)]"
                      >
                        <span className="w-6 h-6 rounded-md bg-[var(--surface)] text-xs font-mono flex items-center justify-center text-[var(--foreground-muted)]">
                          {index}
                        </span>
                        <span className="font-medium text-sm text-[var(--foreground)]">
                          {resolveArgName(arg, `Argument ${index + 1}`)}
                        </span>
                        <code className="ml-auto text-xs px-2 py-1 rounded bg-[var(--code-bg)] text-[var(--code-text)] font-mono">
                          {typeof arg.type === "string"
                            ? arg.type
                            : JSON.stringify(arg.type)}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!instruction.accounts || instruction.accounts.length === 0) &&
                (!instruction.args || instruction.args.length === 0) && (
                  <p className="text-sm text-[var(--foreground-muted)] text-center py-4">
                    This instruction has no accounts or arguments.
                  </p>
                )}
            </div>
          )}
        </div>
        <div
          className="mb-6 animate-slide-up"
          style={{ animationDelay: "0.1s" }}
        >
          <button
            type="button"
            onClick={() => setShowCommonAddresses(!showCommonAddresses)}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-[var(--warning)] group-hover:text-[var(--accent)] transition-colors" />
              <span className="font-semibold text-sm text-[var(--foreground)]">
                Common Addresses
              </span>
            </div>
            {showCommonAddresses ? (
              <ChevronUp className="w-5 h-5 text-[var(--foreground-muted)]" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[var(--foreground-muted)]" />
            )}
          </button>

          {showCommonAddresses && (
            <div className="mt-3 p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] animate-slide-up">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  {
                    name: "System Program",
                    address: COMMON_PROGRAMS.systemProgram,
                  },
                  {
                    name: "Token Program",
                    address: COMMON_PROGRAMS.tokenProgram,
                  },
                  {
                    name: "Associated Token",
                    address: COMMON_PROGRAMS.associatedTokenProgram,
                  },
                  ...(getTokenMintAddress(network, "usdc")
                    ? [
                        {
                          name: `USDC (${network})`,
                          address: getTokenMintAddress(network, "usdc")!,
                        },
                      ]
                    : []),
                ].map((item, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-[var(--background-secondary)] group cursor-pointer hover:bg-[var(--surface-hover)] transition-colors"
                    onClick={() => navigator.clipboard.writeText(item.address)}
                    title="Click to copy"
                  >
                    <p className="text-xs font-semibold text-[var(--foreground-muted)] mb-1.5">
                      {item.name}
                    </p>
                    <p className="text-xs font-mono text-[var(--foreground)] break-all leading-relaxed group-hover:text-[var(--accent)] transition-colors">
                      {item.address}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[var(--foreground-muted)] mt-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                Click any address to copy • Use Auto-fill buttons in form fields
              </p>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="animate-slide-up"
          style={{ animationDelay: "0.15s" }}
        >
          <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--background-secondary)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-subtle)] flex items-center justify-center">
                  <Send className="w-4 h-4 text-[var(--accent)]" />
                </div>
                <div>
                  <h3 className="font-bold text-[var(--foreground)]">
                    Build Transaction
                  </h3>
                  <p className="text-xs text-[var(--foreground-muted)]">
                    Fill in the required fields and execute
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {instruction.accounts && instruction.accounts.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-5">
                    <Users className="w-4 h-4 text-[var(--accent)]" />
                    <h4 className="font-semibold text-[var(--foreground)]">
                      Accounts
                    </h4>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--background-secondary)] text-[var(--foreground-muted)]">
                      {collectAccountLeafCount(instruction.accounts)}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {renderAccountInputs(instruction.accounts)}
                  </div>
                </div>
              )}

              {instruction.args && instruction.args.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-5">
                    <FileText className="w-4 h-4 text-[var(--accent)]" />
                    <h4 className="font-semibold text-[var(--foreground)]">
                      Arguments
                    </h4>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--background-secondary)] text-[var(--foreground-muted)]">
                      {instruction.args.length}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {instruction.args.map((arg, index) => {
                      const argName = resolveArgName(arg, `arg_${index}`);
                      return (
                        <ArgumentInput
                          key={index}
                          arg={arg}
                          value={formValues[argName]}
                          onChange={(value) => setValue(argName, value)}
                          error={errors[argName]?.message as string | undefined}
                          idlTypes={program.idl.types}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {(!instruction.accounts || instruction.accounts.length === 0) &&
                (!instruction.args || instruction.args.length === 0) && (
                  <div className="py-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--background-secondary)] flex items-center justify-center mx-auto mb-4">
                      <Zap className="w-8 h-8 text-[var(--foreground-muted)]" />
                    </div>
                    <p className="text-sm text-[var(--foreground-muted)]">
                      This instruction has no accounts or arguments.
                      <br />
                      You can execute it directly.
                    </p>
                  </div>
                )}

              {submitError && (
                <div className="mb-6 p-4 rounded-xl bg-[var(--error-subtle)] border border-[var(--error)]/20">
                  <p className="text-sm text-[var(--error)] leading-relaxed">
                    {submitError}
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-5 border-t border-[var(--border)] bg-[var(--background-secondary)]">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-4 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold transition-all duration-200 flex items-center justify-center gap-3"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Building Transaction...</span>
                  </>
                ) : (
                  <>
                    <Anchor className="w-5 h-5" />
                    <span>Execute Transaction</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
