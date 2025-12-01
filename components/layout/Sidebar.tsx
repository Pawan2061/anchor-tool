"use client";

import { useState } from "react";
import { Wallet, FileCode, FolderKanban } from "lucide-react";
import { NetworkSelector } from "@/components/network/NetworkSelector";
import { WalletManager } from "@/components/wallet/WalletManager";
import { IDLLoader } from "@/components/program/IDLLoader";

type SidebarTab = "wallet" | "programs" | "collections";

const tabs = [
  { id: "wallet" as SidebarTab, label: "Wallet", icon: Wallet },
  { id: "programs" as SidebarTab, label: "Programs", icon: FileCode },
  { id: "collections" as SidebarTab, label: "Collections", icon: FolderKanban },
];

export function Sidebar() {
  const [activeTab, setActiveTab] = useState<SidebarTab>("wallet");

  return (
    <div className="w-[320px] border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 h-screen flex flex-col shadow-sm">
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">AP</span>
          </div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Anchor Postman
          </h1>
        </div>
        <NetworkSelector />
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-3 py-3 text-xs font-medium capitalize transition-all relative group ${
                activeTab === tab.id
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <Icon
                  className={`w-4 h-4 transition-transform ${
                    activeTab === tab.id ? "scale-110" : ""
                  }`}
                />
                <span>{tab.label}</span>
              </div>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-5 bg-slate-50 dark:bg-slate-950">
        {activeTab === "wallet" && <WalletManager />}
        {activeTab === "programs" && <IDLLoader />}
        {activeTab === "collections" && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FolderKanban className="w-12 h-12 text-slate-400 dark:text-slate-600 mb-3" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
              No collections yet
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Save requests to create collections
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
