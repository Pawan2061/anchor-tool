"use client";

import { useState } from "react";
import { FileCode, CheckCircle2 } from "lucide-react";
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
      <div className="h-full flex items-center justify-center p-8">
        <div className="max-w-md mx-auto text-center">
          <div className="p-6 border border-amber-200 dark:border-amber-900 rounded-lg bg-amber-50 dark:bg-amber-950/20 shadow-sm">
            <FileCode className="w-10 h-10 text-amber-500 dark:text-amber-600 mx-auto mb-3" />
            <h2 className="text-lg font-semibold mb-2 text-amber-900 dark:text-amber-200">
              No Instructions Found
            </h2>
            <p className="text-sm text-amber-700 dark:text-amber-300">
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
      <div className="w-80 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-y-auto">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2 mb-2">
            <FileCode className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              {program.name}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mb-2">
            {program.programId.toString().slice(0, 8)}...
            {program.programId.toString().slice(-8)}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {getInstructionCount(program.idl)} instructions available
          </p>
        </div>

        <div className="p-3 space-y-1.5">
          {instructions.map((instruction, index) => (
            <button
              key={index}
              onClick={() => setSelectedInstruction(instruction)}
              className={`w-full text-left p-3 rounded-lg transition-all ${
                selectedInstruction?.name === instruction.name
                  ? "bg-blue-50 dark:bg-blue-950/20 border border-blue-300 dark:border-blue-800 shadow-sm"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm text-slate-900 dark:text-slate-50 truncate">
                      {instruction.name}
                    </p>
                    {selectedInstruction?.name === instruction.name && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    )}
                  </div>
                  {instruction.accounts && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
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
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
        {selectedInstruction ? (
          <InstructionBuilder
            program={program}
            instruction={selectedInstruction}
          />
        ) : (
          <div className="h-full flex items-center justify-center p-8">
            <div className="max-w-md mx-auto text-center">
              <FileCode className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-slate-700 dark:text-slate-300">
                Select an Instruction
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
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
