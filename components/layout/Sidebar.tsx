"use client";

import { useState } from "react";
import { Wallet, FileCode, FolderKanban, Terminal } from "lucide-react";
import { NetworkSelector } from "@/components/network/NetworkSelector";
import { WalletManager } from "@/components/wallet/WalletManager";
import { IDLLoader } from "@/components/program/IDLLoader";

type SidebarTab = "wallet" | "programs" | "collections";

const tabs = [
  { id: "wallet" as SidebarTab, label: "Wallet", icon: Wallet },
  { id: "programs" as SidebarTab, label: "Programs", icon: FileCode },
  { id: "collections" as SidebarTab, label: "History", icon: FolderKanban },
];

export function Sidebar() {
  const [activeTab, setActiveTab] = useState<SidebarTab>("wallet");

  return (
    <aside className="w-[320px] h-screen flex flex-col border-r border-[var(--border)] bg-[var(--surface)]">
      {/* Header */}
      <header className="p-5 border-b border-[var(--border)]">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-[var(--accent)] flex items-center justify-center">
            <Terminal className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-base font-bold text-[var(--foreground)] tracking-tight">
              Anchor Postman
            </h1>
            <p className="text-xs text-[var(--foreground-muted)]">
              Solana Program Tester
            </p>
          </div>
        </div>
        <NetworkSelector />
      </header>

      {/* Tab Navigation */}
      <nav className="flex gap-1 p-2 border-b border-[var(--border)] bg-[var(--background-secondary)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 relative px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? "text-[var(--accent)] bg-[var(--surface)]"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              <div className="flex flex-col items-center gap-1.5">
                <Icon
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isActive ? "scale-110" : ""
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span>{tab.label}</span>
              </div>
              {isActive && (
                <div className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[var(--accent)]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="animate-fade-in">
          {activeTab === "wallet" && <WalletManager />}
          {activeTab === "programs" && <IDLLoader />}
          {activeTab === "collections" && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-xl bg-[var(--background-secondary)] flex items-center justify-center mb-4">
                <FolderKanban className="w-8 h-8 text-[var(--foreground-muted)]" />
              </div>
              <p className="text-sm font-semibold text-[var(--foreground)] mb-1">
                No history yet
              </p>
              <p className="text-xs text-[var(--foreground-muted)] max-w-[200px]">
                Your recent transactions and saved requests will appear here
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="p-4 border-t border-[var(--border)] bg-[var(--background-secondary)]">
        <div className="flex items-center justify-center gap-2 text-xs text-[var(--foreground-muted)]">
          <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
          <span>Ready</span>
        </div>
      </footer>
    </aside>
  );
}
