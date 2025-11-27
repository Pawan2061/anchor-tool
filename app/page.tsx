"use client";

import { Sidebar } from "@/components/layout/Sidebar";

export default function Home() {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-4">
              Welcome to Anchor Postman
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              A powerful tool for testing and interacting with Anchor (Solana)
              programs.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
                <h2 className="text-xl font-semibold mb-2">
                  1. Connect to Network
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Select a Solana network (Mainnet, Devnet, Testnet, or
                  Localnet) from the sidebar.
                </p>
              </div>

              <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
                <h2 className="text-xl font-semibold mb-2">
                  2. Manage Wallets
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Generate a new wallet or import an existing keypair to sign
                  transactions.
                </p>
              </div>

              <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
                <h2 className="text-xl font-semibold mb-2">
                  3. Load Program IDL
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Load your Anchor program's IDL file to see available
                  instructions and accounts.
                </p>
              </div>

              <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
                <h2 className="text-xl font-semibold mb-2">
                  4. Test Instructions
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Build and execute instructions with dynamic forms generated
                  from your IDL.
                </p>
              </div>
            </div>

            <div className="mt-8 p-6 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <h3 className="font-semibold mb-2">Getting Started</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>
                  Select a network from the sidebar (start with Devnet for
                  testing)
                </li>
                <li>Generate or import a wallet in the Wallet tab</li>
                <li>Load your program's IDL file in the Programs tab</li>
                <li>Start testing your Anchor program instructions!</li>
              </ol>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
