"use client";

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
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
            {instruction.name}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Build and execute this instruction
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Instruction Details
          </h3>

          {instruction.accounts && instruction.accounts.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                Accounts ({instruction.accounts.length})
              </h4>
              <div className="space-y-2">
                {instruction.accounts.map(
                  (account: IdlAccountItem, index: number) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                          {index}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                            {account.name || `Account ${index + 1}`}
                          </p>
                          <div className="flex gap-2 mt-1">
                            {isIdlAccount(account) && account.isMut && (
                              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                                Mutable
                              </span>
                            )}
                            {isIdlAccount(account) && account.isSigner && (
                              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">
                                Signer
                              </span>
                            )}
                            {isIdlAccount(account) && account.isOptional && (
                              <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded">
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
              <h4 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                Arguments ({instruction.args.length})
              </h4>
              <div className="space-y-2">
                {instruction.args.map((arg: IdlField, index: number) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                        {index}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                          {arg.name || `Argument ${index + 1}`}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">
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
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This instruction has no accounts or arguments.
              </p>
            )}
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Build Transaction
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Form builder will be implemented here to collect account addresses
            and arguments.
          </p>
        </div>
      </div>
    </div>
  );
}
