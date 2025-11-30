"use client";

import { useState } from "react";
import { Program } from "@/types/anchor";
import { Idl } from "@coral-xyz/anchor";
import { InstructionBuilder } from "./InstructionBuilder";
import { getInstructionCount } from "@/lib/anchor/idl";

type IdlInstruction = Idl["instructions"][number];

interface InstructionListProps {
  program: Program;
}

export function InstructionList({ program }: InstructionListProps) {
  const [selectedInstruction, setSelectedInstruction] =
    useState<IdlInstruction | null>(null);
  const instructions = program.idl.instructions || [];

  if (instructions.length === 0) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="p-6 border border-yellow-200 dark:border-yellow-800 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
            <h2 className="text-xl font-semibold mb-2 text-yellow-800 dark:text-yellow-200">
              No Instructions Found
            </h2>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              This program&apos;s IDL doesn&apos;t contain any instructions.
              Make sure you loaded a valid Anchor program IDL.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-y-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-1">{program.name}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
            {program.programId.toString().slice(0, 8)}...
            {program.programId.toString().slice(-8)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {getInstructionCount(program.idl)} instructions available
          </p>
        </div>

        <div className="p-2">
          {instructions.map((instruction, index) => (
            <button
              key={index}
              onClick={() => setSelectedInstruction(instruction)}
              className={`w-full text-left p-3 mb-2 rounded-md transition-colors ${
                selectedInstruction?.name === instruction.name
                  ? "bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700"
                  : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    {instruction.name}
                  </p>
                  {instruction.accounts && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {instruction.accounts.length} account
                      {instruction.accounts.length !== 1 ? "s" : ""}
                      {instruction.args && instruction.args.length > 0 && (
                        <>
                          {" "}
                          • {instruction.args.length} arg
                          {instruction.args.length !== 1 ? "s" : ""}
                        </>
                      )}
                    </p>
                  )}
                </div>
                {selectedInstruction?.name === instruction.name && (
                  <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                    Selected
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
        {selectedInstruction ? (
          <InstructionBuilder
            program={program}
            instruction={selectedInstruction}
          />
        ) : (
          <div className="p-8">
            <div className="max-w-2xl mx-auto text-center">
              <h3 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-300">
                Select an Instruction
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Choose an instruction from the list to start building and
                testing your transaction.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
