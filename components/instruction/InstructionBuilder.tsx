"use client";

import { Code2, Users, FileText } from "lucide-react";
import { Program } from "@/types/anchor";
import { Idl } from "@coral-xyz/anchor";

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

export function InstructionBuilder({ instruction }: InstructionBuilderProps) {
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

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Code2 className="w-4 h-4" />
            Build Transaction
          </h3>
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
              Form builder will be implemented here to collect account addresses
              and arguments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
