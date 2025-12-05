"use client";

import { useState } from "react";
import { FileCode, ChevronRight, Layers, Code2 } from "lucide-react";
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
        <div className="max-w-md mx-auto text-center animate-slide-up">
          <div className="w-20 h-20 rounded-2xl bg-[var(--warning-subtle)] flex items-center justify-center mx-auto mb-6">
            <FileCode className="w-10 h-10 text-[var(--warning)]" />
          </div>
          <h2 className="text-xl font-bold mb-3 text-[var(--foreground)]">
            No Instructions Found
          </h2>
          <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
            This program&apos;s IDL doesn&apos;t contain any instructions. Make
            sure you loaded a valid Anchor program IDL.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      <div className="w-80 flex flex-col border-r border-[var(--border)] bg-[var(--surface)]">
        <div className="p-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--accent)] flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-[var(--foreground)] truncate">
                {program.name}
              </h2>
              <p className="text-xs text-[var(--foreground-muted)] font-mono truncate">
                {program.programId.toString().slice(0, 8)}...
                {program.programId.toString().slice(-6)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 text-xs font-medium rounded-md bg-[var(--accent-subtle)] text-[var(--accent)]">
              {getInstructionCount(program.idl)} instructions
            </span>
            <span className="px-2 py-1 text-xs font-medium rounded-md bg-[var(--background-secondary)] text-[var(--foreground-muted)] capitalize">
              {program.network}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-2">
            {instructions.map((instruction, index) => {
              const isSelected = selectedInstruction?.name === instruction.name;
              return (
                <button
                  key={index}
                  onClick={() => setSelectedInstruction(instruction)}
                  className={`w-full text-left p-4 rounded-xl transition-all duration-200 group animate-slide-up ${
                    isSelected
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--background-secondary)] hover:bg-[var(--surface-hover)] border border-transparent hover:border-[var(--border)]"
                  }`}
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Code2
                          className={`w-4 h-4 flex-shrink-0 ${
                            isSelected
                              ? "text-white/90"
                              : "text-[var(--foreground-muted)]"
                          }`}
                        />
                        <p
                          className={`font-semibold text-sm truncate ${
                            isSelected
                              ? "text-white"
                              : "text-[var(--foreground)]"
                          }`}
                        >
                          {instruction.name}
                        </p>
                      </div>
                      <p
                        className={`text-xs ${
                          isSelected
                            ? "text-white/70"
                            : "text-[var(--foreground-muted)]"
                        }`}
                      >
                        {instruction.accounts?.length || 0} accounts
                        {instruction.args && instruction.args.length > 0 && (
                          <> • {instruction.args.length} args</>
                        )}
                      </p>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 flex-shrink-0 transition-transform ${
                        isSelected
                          ? "text-white/90 translate-x-0.5"
                          : "text-[var(--foreground-muted)] group-hover:translate-x-0.5"
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-[var(--background)]">
        {selectedInstruction ? (
          <InstructionBuilder
            program={program}
            instruction={selectedInstruction}
          />
        ) : (
          <div className="h-full flex items-center justify-center p-8">
            <div className="max-w-md mx-auto text-center animate-fade-in">
              <div className="w-20 h-20 rounded-xl bg-[var(--background-secondary)] flex items-center justify-center mx-auto mb-6">
                <FileCode className="w-10 h-10 text-[var(--foreground-muted)]" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-[var(--foreground)]">
                Select an Instruction
              </h3>
              <p className="text-sm text-[var(--foreground-muted)] leading-relaxed max-w-xs mx-auto">
                Choose an instruction from the list to build and test your
                transaction
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
