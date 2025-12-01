"use client";

import { Wifi, Wallet, FileCode, Play, ArrowRight } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useProgramStore } from "@/stores/programStore";
import { InstructionList } from "@/components/instruction/InstructionList";

const steps = [
  {
    icon: Wifi,
    title: "Connect to Network",
    description:
      "Select a Solana network (Mainnet, Devnet, Testnet, or Localnet) from the sidebar.",
    color: "blue",
  },
  {
    icon: Wallet,
    title: "Manage Wallets",
    description:
      "Generate a new wallet or import an existing keypair to sign transactions.",
    color: "emerald",
  },
  {
    icon: FileCode,
    title: "Load Program IDL",
    description:
      "Load your Anchor program's IDL file to see available instructions and accounts.",
    color: "purple",
  },
  {
    icon: Play,
    title: "Test Instructions",
    description:
      "Build and execute instructions with dynamic forms generated from your IDL.",
    color: "amber",
  },
];

export default function Home() {
  const activeProgram = useProgramStore((state) => state.getActiveProgram());

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {activeProgram ? (
          <InstructionList program={activeProgram} />
        ) : (
          <div className="h-full flex items-center justify-center p-8">
            <div className="max-w-5xl w-full mx-auto">
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-6 shadow-lg">
                  <span className="text-white font-bold text-2xl">AP</span>
                </div>
                <h1 className="text-4xl font-bold mb-3 text-slate-900 dark:text-slate-50">
                  Welcome to Anchor Postman
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                  A powerful tool for testing and interacting with Anchor
                  (Solana) programs.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const colorClasses = {
                    blue: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900",
                    emerald:
                      "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900",
                    purple:
                      "bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900",
                    amber:
                      "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900",
                  };
                  const iconColorClasses = {
                    blue: "text-blue-600 dark:text-blue-400",
                    emerald: "text-emerald-600 dark:text-emerald-400",
                    purple: "text-purple-600 dark:text-purple-400",
                    amber: "text-amber-600 dark:text-amber-400",
                  };

                  return (
                    <div
                      key={index}
                      className={`p-5 border rounded-lg bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow ${
                        colorClasses[step.color as keyof typeof colorClasses]
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-2.5 rounded-lg bg-white dark:bg-slate-800 ${
                            iconColorClasses[
                              step.color as keyof typeof iconColorClasses
                            ]
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                              {index + 1}
                            </span>
                            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                              {step.title}
                            </h2>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-6 border border-blue-200 dark:border-blue-900 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 shadow-sm">
                <h3 className="font-semibold mb-4 text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Quick Start Guide
                </h3>
                <ol className="space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center mt-0.5">
                      1
                    </span>
                    <span>
                      Select a network from the sidebar (start with Devnet for
                      testing)
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center mt-0.5">
                      2
                    </span>
                    <span>Generate or import a wallet in the Wallet tab</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center mt-0.5">
                      3
                    </span>
                    <span>
                      Load your program&apos;s IDL file in the Programs tab
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center mt-0.5">
                      4
                    </span>
                    <span>Start testing your Anchor program instructions!</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
