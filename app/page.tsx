"use client";

import {
  Wifi,
  Wallet,
  FileCode,
  Play,
  ChevronRight,
  Terminal,
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useProgramStore } from "@/stores/programStore";
import { InstructionList } from "@/components/instruction/InstructionList";

const steps = [
  {
    icon: Wifi,
    title: "Connect to Network",
    description: "Select your target Solana network from the sidebar",
  },
  {
    icon: Wallet,
    title: "Setup Wallet",
    description: "Generate a keypair or connect an external wallet",
  },
  {
    icon: FileCode,
    title: "Load Program",
    description: "Import your Anchor program's IDL file",
  },
  {
    icon: Play,
    title: "Execute",
    description: "Build and send transactions to your program",
  },
];

export default function Home() {
  const activeProgram = useProgramStore((state) => state.getActiveProgram());

  return (
    <div className="flex h-screen bg-[var(--background)] overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {activeProgram ? (
          <InstructionList program={activeProgram} />
        ) : (
          <div className="min-h-full flex items-center justify-center p-8">
            <div className="max-w-4xl w-full mx-auto">
              <div className="text-center mb-16 animate-slide-up">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] text-sm font-medium mb-6 border border-[var(--accent)]/20">
                  <Terminal className="w-4 h-4" />
                  <span>Developer Tool for Solana</span>
                </div>

                <h1 className="text-5xl md:text-6xl font-extrabold mb-4 tracking-tight">
                  <span className="text-[var(--foreground)]">Anchor</span>
                  <span className="text-[var(--accent)] ml-3">Postman</span>
                </h1>

                <p className="text-lg text-[var(--foreground-muted)] max-w-xl mx-auto leading-relaxed">
                  Test, debug, and interact with your Anchor programs. Build
                  transactions visually and execute them instantly.
                </p>
              </div>

              {/* Steps Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={index}
                      className="group relative animate-slide-up"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="relative p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] transition-all duration-200 h-full card-hover">
                        {/* Step number */}
                        <div className="absolute -top-2.5 -left-2.5 w-6 h-6 rounded-md bg-[var(--accent)] text-white text-xs font-bold flex items-center justify-center">
                          {index + 1}
                        </div>

                        <div className="w-12 h-12 rounded-lg bg-[var(--background-secondary)] flex items-center justify-center mb-4 group-hover:bg-[var(--accent-subtle)] transition-colors">
                          <Icon className="w-6 h-6 text-[var(--foreground-muted)] group-hover:text-[var(--accent)] transition-colors" />
                        </div>

                        <h3 className="text-base font-bold text-[var(--foreground)] mb-2">
                          {step.title}
                        </h3>
                        <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div
                className="animate-slide-up"
                style={{ animationDelay: "0.2s" }}
              >
                <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-8">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-xl font-bold text-[var(--foreground)] mb-2 flex items-center gap-2">
                        <ChevronRight className="w-5 h-5 text-[var(--accent)]" />
                        Ready to start?
                      </h2>
                      <p className="text-sm text-[var(--foreground-muted)] max-w-md">
                        Load your program&apos;s IDL from the sidebar to begin
                        testing instructions. Start with Devnet for safe
                        experimentation.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                      <a
                        href="https://www.anchor-lang.com/docs"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2.5 rounded-xl bg-[var(--background-secondary)] text-[var(--foreground)] text-sm font-semibold hover:bg-[var(--surface-hover)] border border-[var(--border)] transition-all text-center"
                      >
                        View Docs
                      </a>
                      <button
                        className="px-5 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
                        onClick={() => {
                          document
                            .querySelector('[data-tab="programs"]')
                            ?.dispatchEvent(new Event("click"));
                        }}
                      >
                        <FileCode className="w-4 h-4" />
                        Load IDL
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="text-center mt-12 animate-fade-in"
                style={{ animationDelay: "0.3s" }}
              >
                <p className="text-xs text-[var(--foreground-muted)]">
                  <kbd className="px-2 py-1 rounded bg-[var(--surface)] border border-[var(--border)] font-mono text-[10px]">
                    ⌘
                  </kbd>
                  {" + "}
                  <kbd className="px-2 py-1 rounded bg-[var(--surface)] border border-[var(--border)] font-mono text-[10px]">
                    K
                  </kbd>{" "}
                  to quick search • Built for Solana developers
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
