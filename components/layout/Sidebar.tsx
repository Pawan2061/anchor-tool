"use client";

import { useState } from "react";
import { NetworkSelector } from "@/components/network/NetworkSelector";
import { WalletManager } from "@/components/wallet/WalletManager";
import { IDLLoader } from "@/components/program/IDLLoader";

type SidebarTab = "wallet" | "programs" | "collections";

export function Sidebar() {
  const [activeTab, setActiveTab] = useState<SidebarTab>("wallet");

  return (
    <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 h-screen flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold mb-4">Anchor Postman</h1>
        <NetworkSelector />
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {(["wallet", "programs", "collections"] as SidebarTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "wallet" && <WalletManager />}
        {activeTab === "programs" && <IDLLoader />}
        {activeTab === "collections" && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>Collections will appear here</p>
            <p className="text-sm mt-2">Save requests to create collections</p>
          </div>
        )}
      </div>
    </div>
  );
}
