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
      const accounts: PublicKey[] = [];
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
            accounts.push(new PublicKey(value));
          } else if (isOptional) {
            accounts.push(PublicKey.default);
          }
        }
      }

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
        accounts: accounts.map((a) => a.toString()),
        args,
      });

      alert(
        `Instruction prepared!\n\nAccounts: ${accounts.length}\nArguments: ${args.length}\n\nTransaction building will be implemented in Phase 4.`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to build instruction";
      setSubmitError(errorMessage);
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
                        <span className="font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded flex-shrink-0">
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
                      <span className="font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded flex-shrink-0">
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
