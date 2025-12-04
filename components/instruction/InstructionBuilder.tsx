"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Code2, Users, FileText, Send, Loader2 } from "lucide-react";
import { PublicKey } from "@solana/web3.js";
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
  COMMON_PROGRAMS,
  getTokenMintAddress,
} from "@/lib/utils/commonAddresses";
import { Info } from "lucide-react";

type IdlInstruction = Idl["instructions"][number];
type IdlAccountItem = IdlInstruction["accounts"][number];
type IdlField = IdlInstruction["args"][number];

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
  const { connection, network } = useNetworkStore();
  const { getActiveWallet, getActiveKeypair, getActiveSigner } =
    useWalletStore();

  const buildValidationSchema = () => {
    const schema: Record<string, z.ZodTypeAny> = {};

    if (instruction.accounts) {
      instruction.accounts.forEach((account, index) => {
        const accountName = account.name || `account_${index}`;
        const isOptional = isIdlAccount(account) && account.isOptional;

        if (isOptional) {
          schema[accountName] = z
            .string()
            .optional()
            .refine(
              (val) => !val || isValidPublicKey(val),
              "Must be a valid Solana public key"
            );
        } else {
          schema[accountName] = z
            .string()
            .min(1, "Account is required")
            .refine(isValidPublicKey, "Must be a valid Solana public key");
        }
      });
    }

    if (instruction.args) {
      instruction.args.forEach((arg) => {
        const argName = arg.name || `arg_${instruction.args!.indexOf(arg)}`;
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
            schema[argName] = z.number();
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
      instruction.accounts?.forEach((account, index) => {
        const accountName = account.name || `account_${index}`;
        defaults[accountName] = "";
      });
      instruction.args?.forEach((arg) => {
        const argName = arg.name || `arg_${instruction.args!.indexOf(arg)}`;
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
      // Validate connection
      if (!connection) {
        throw new Error(
          "Not connected to network. Please connect to a network first."
        );
      }

      // Get wallet and signer
      const wallet = getActiveWallet();
      const keypair = getActiveKeypair();
      const signer = getActiveSigner();

      if (!wallet && !keypair) {
        throw new Error("No wallet connected. Please connect a wallet first.");
      }

      // Build accounts array
      const accounts: (PublicKey | null)[] = [];
      if (instruction.accounts) {
        for (const account of instruction.accounts) {
          const accountName =
            account.name || `account_${instruction.accounts.indexOf(account)}`;
          const value = data[accountName];
          const isOptional = isIdlAccount(account) && account.isOptional;

          if (!value && !isOptional) {
            throw new Error(`Account ${accountName} is required`);
          }

          if (value) {
            accounts.push(new PublicKey(value as string));
          } else if (isOptional) {
            accounts.push(null);
          }
        }
      }

      // Build args array
      const args: unknown[] = [];
      if (instruction.args) {
        for (const arg of instruction.args) {
          const argName = arg.name || `arg_${instruction.args.indexOf(arg)}`;
          const value = data[argName];
          args.push(parseValue(value, arg.type));
        }
      }

      console.log("Instruction data:", {
        program: program.programId.toString(),
        instruction: instruction.name,
        accounts: accounts.map((a) => a?.toString() || "null"),
        args,
      });

      // Create Anchor program instance
      const anchorProgram = createAnchorProgram(program, connection, signer);

      // Execute the instruction
      const signature = await executeInstruction({
        program: anchorProgram,
        instructionName: instruction.name,
        args,
        accountKeys: accounts,
        idlAccounts: instruction.accounts || [],
        connection,
        signer,
        keypair,
      });

      // Show success message
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

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Code2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {instruction.name}
            </h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 ml-9">
            Build and execute this instruction
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-base font-semibold mb-5 text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Instruction Details
          </h3>

          {instruction.accounts && instruction.accounts.length > 0 && (
            <div className="mb-6">
              <h4 className="text-xs font-semibold mb-3 text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <Users className="w-3.5 h-3.5" />
                Accounts ({instruction.accounts.length})
              </h4>
              <div className="space-y-2">
                {instruction.accounts.map(
                  (account: IdlAccountItem, index: number) => (
                    <div
                      key={index}
                      className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded shrink-0">
                          {index}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-slate-900 dark:text-slate-50">
                            {account.name || `Account ${index + 1}`}
                          </p>
                          <div className="flex gap-1.5 mt-1.5 flex-wrap">
                            {isIdlAccount(account) && account.isMut && (
                              <span className="text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                                Mutable
                              </span>
                            )}
                            {isIdlAccount(account) && account.isSigner && (
                              <span className="text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded">
                                Signer
                              </span>
                            )}
                            {isIdlAccount(account) && account.isOptional && (
                              <span className="text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded">
                                Optional
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {instruction.args && instruction.args.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold mb-3 text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" />
                Arguments ({instruction.args.length})
              </h4>
              <div className="space-y-2">
                {instruction.args.map((arg: IdlField, index: number) => (
                  <div
                    key={index}
                    className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded shrink-0">
                        {index}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900 dark:text-slate-50">
                          {arg.name || `Argument ${index + 1}`}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono break-all">
                          Type:{" "}
                          {typeof arg.type === "string"
                            ? arg.type
                            : JSON.stringify(arg.type)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!instruction.accounts || instruction.accounts.length === 0) &&
            (!instruction.args || instruction.args.length === 0) && (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                This instruction has no accounts or arguments.
              </p>
            )}
        </div>

        {/* Common Addresses Helper Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm">
          <button
            type="button"
            onClick={() => setShowCommonAddresses(!showCommonAddresses)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Common Solana Addresses
              </span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {showCommonAddresses ? "−" : "+"}
            </span>
          </button>
          {showCommonAddresses && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    System Program
                  </p>
                  <p className="text-xs font-mono text-slate-900 dark:text-slate-50 break-all">
                    {COMMON_PROGRAMS.systemProgram}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Token Program
                  </p>
                  <p className="text-xs font-mono text-slate-900 dark:text-slate-50 break-all">
                    {COMMON_PROGRAMS.tokenProgram}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Associated Token Program
                  </p>
                  <p className="text-xs font-mono text-slate-900 dark:text-slate-50 break-all">
                    {COMMON_PROGRAMS.associatedTokenProgram}
                  </p>
                </div>
                {getTokenMintAddress(network, "usdc") && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      USDC Mint ({network})
                    </p>
                    <p className="text-xs font-mono text-slate-900 dark:text-slate-50 break-all">
                      {getTokenMintAddress(network, "usdc")}
                    </p>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                💡 Tip: Click &quot;Auto-fill&quot; buttons in account fields to
                use these addresses automatically
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-base font-semibold mb-5 text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <Code2 className="w-4 h-4" />
              Build Transaction
            </h3>

            {instruction.accounts && instruction.accounts.length > 0 && (
              <div className="mb-6">
                <h4 className="text-xs font-semibold mb-4 text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" />
                  Accounts ({instruction.accounts.length})
                </h4>
                <div className="space-y-4">
                  {instruction.accounts.map((account, index) => {
                    const accountName = account.name || `account_${index}`;
                    return (
                      <AccountInput
                        key={index}
                        account={account}
                        index={index}
                        value={(formValues[accountName] as string) || ""}
                        onChange={(value) => setValue(accountName, value)}
                        error={
                          errors[accountName]?.message as string | undefined
                        }
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {instruction.args && instruction.args.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold mb-4 text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" />
                  Arguments ({instruction.args.length})
                </h4>
                <div className="space-y-4">
                  {instruction.args.map((arg, index) => {
                    const argName = arg.name || `arg_${index}`;
                    return (
                      <div key={index}>
                        <ArgumentInput
                          arg={arg}
                          value={formValues[argName]}
                          onChange={(value) => setValue(argName, value)}
                          error={errors[argName]?.message as string | undefined}
                          idlTypes={program.idl.types}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {(!instruction.accounts || instruction.accounts.length === 0) &&
              (!instruction.args || instruction.args.length === 0) && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                    This instruction has no accounts or arguments. You can
                    execute it directly.
                  </p>
                </div>
              )}

            {submitError && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-md">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {submitError}
                </p>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Building...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Build & Execute Transaction
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
