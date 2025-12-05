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
        const argName =
          typeof arg.name === "string"
            ? arg.name
            : typeof arg.name === "object" &&
              arg.name !== null &&
              "name" in arg.name
            ? (arg.name as { name: string }).name
            : `arg_${instruction.args!.indexOf(arg)}`;
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
        const argName =
          typeof arg.name === "string"
            ? arg.name
            : typeof arg.name === "object" &&
              arg.name !== null &&
              "name" in arg.name
            ? (arg.name as { name: string }).name
            : `arg_${instruction.args!.indexOf(arg)}`;
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
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Code2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
                {instruction.name}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Build and execute this instruction
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-800/60 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-md">
              <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              Instruction Details
            </h3>
          </div>

          {instruction.accounts && instruction.accounts.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Accounts
                </h4>
                <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  {instruction.accounts.length}
                </span>
              </div>
              <div className="space-y-2.5">
                {instruction.accounts.map(
                  (account: IdlAccountItem, index: number) => (
                    <div
                      key={index}
                      className="group p-3.5 bg-gradient-to-r from-slate-50 to-slate-50/50 dark:from-slate-800/50 dark:to-slate-800/30 rounded-lg border border-slate-200/60 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-700 text-xs font-mono text-slate-600 dark:text-slate-400 shrink-0">
                          {index}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-slate-900 dark:text-slate-50">
                            {account.name || `Account ${index + 1}`}
                          </p>
                          <div className="flex gap-1.5 mt-2 flex-wrap">
                            {isIdlAccount(account) && account.isMut && (
                              <span className="inline-flex items-center text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                                Mutable
                              </span>
                            )}
                            {isIdlAccount(account) && account.isSigner && (
                              <span className="inline-flex items-center text-xs font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                                Signer
                              </span>
                            )}
                            {isIdlAccount(account) && account.isOptional && (
                              <span className="inline-flex items-center text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
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
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Arguments
                </h4>
                <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  {instruction.args.length}
                </span>
              </div>
              <div className="space-y-2.5">
                {instruction.args.map((arg: IdlField, index: number) => (
                  <div
                    key={index}
                    className="group p-3.5 bg-gradient-to-r from-slate-50 to-slate-50/50 dark:from-slate-800/50 dark:to-slate-800/30 rounded-lg border border-slate-200/60 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-700 text-xs font-mono text-slate-600 dark:text-slate-400 shrink-0">
                        {index}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900 dark:text-slate-50">
                          {typeof arg.name === "string"
                            ? arg.name
                            : typeof arg.name === "object" &&
                              arg.name !== null &&
                              "name" in arg.name
                            ? (arg.name as { name: string }).name
                            : `Argument ${index + 1}`}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono break-all">
                          <span className="text-slate-400 dark:text-slate-500">
                            Type:
                          </span>{" "}
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
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-800/60 rounded-xl p-5 shadow-sm">
          <button
            type="button"
            onClick={() => setShowCommonAddresses(!showCommonAddresses)}
            className="w-full flex items-center justify-between text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-md group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Common Solana Addresses
              </span>
            </div>
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-medium transition-transform group-hover:scale-110">
              {showCommonAddresses ? "−" : "+"}
            </div>
          </button>
          {showCommonAddresses && (
            <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-800/30 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                    System Program
                  </p>
                  <p className="text-xs font-mono text-slate-900 dark:text-slate-50 break-all leading-relaxed">
                    {COMMON_PROGRAMS.systemProgram}
                  </p>
                </div>
                <div className="p-3.5 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-800/30 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                    Token Program
                  </p>
                  <p className="text-xs font-mono text-slate-900 dark:text-slate-50 break-all leading-relaxed">
                    {COMMON_PROGRAMS.tokenProgram}
                  </p>
                </div>
                <div className="p-3.5 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-800/30 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                    Associated Token Program
                  </p>
                  <p className="text-xs font-mono text-slate-900 dark:text-slate-50 break-all leading-relaxed">
                    {COMMON_PROGRAMS.associatedTokenProgram}
                  </p>
                </div>
                {getTokenMintAddress(network, "usdc") && (
                  <div className="p-3.5 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-800/30 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                      USDC Mint ({network})
                    </p>
                    <p className="text-xs font-mono text-slate-900 dark:text-slate-50 break-all leading-relaxed">
                      {getTokenMintAddress(network, "usdc")}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-start gap-2 p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200/50 dark:border-blue-900/30">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                  <span className="font-medium">Tip:</span> Click
                  &quot;Auto-fill&quot; buttons in account fields to use these
                  addresses automatically
                </p>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-800/60 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                <Code2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                Build Transaction
              </h3>
            </div>

            {instruction.accounts && instruction.accounts.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-5">
                  <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Accounts
                  </h4>
                  <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {instruction.accounts.length}
                  </span>
                </div>
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
                <div className="flex items-center gap-2 mb-5">
                  <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Arguments
                  </h4>
                  <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {instruction.args.length}
                  </span>
                </div>
                <div className="space-y-4">
                  {instruction.args.map((arg, index) => {
                    // Handle case where arg.name might be an object or string
                    const argName =
                      typeof arg.name === "string"
                        ? arg.name
                        : typeof arg.name === "object" &&
                          arg.name !== null &&
                          "name" in arg.name
                        ? (arg.name as { name: string }).name
                        : `arg_${index}`;
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
                <div className="p-5 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-800/30 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                  <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                    This instruction has no accounts or arguments. You can
                    execute it directly.
                  </p>
                </div>
              )}

            {submitError && (
              <div className="mt-6 p-4 bg-red-50/80 dark:bg-red-950/30 border border-red-200/60 dark:border-red-900/60 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400 leading-relaxed">
                  {submitError}
                </p>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 disabled:shadow-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Building Transaction...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Build & Execute Transaction</span>
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
