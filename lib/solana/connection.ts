import { Connection, Commitment } from "@solana/web3.js";
import { NetworkConfig, SolanaNetwork } from "@/types/solana";

export const NETWORK_CONFIGS: Record<SolanaNetwork, NetworkConfig> = {
  mainnet: {
    name: "mainnet",
    rpcUrl: "https://api.mainnet-beta.solana.com",
    label: "Mainnet",
  },
  devnet: {
    name: "devnet",
    rpcUrl: "https://api.devnet.solana.com",
    label: "Devnet",
  },
  testnet: {
    name: "testnet",
    rpcUrl: "https://api.testnet.solana.com",
    label: "Testnet",
  },
  localnet: {
    name: "localnet",
    rpcUrl: "http://127.0.0.1:8899",
    label: "Localnet",
  },
};

export function createConnection(
  network: SolanaNetwork,
  customRpcUrl?: string | null,
  commitment: Commitment = "confirmed"
): Connection {
  const config = NETWORK_CONFIGS[network];
  const rpcUrl = customRpcUrl || config.rpcUrl;

  return new Connection(rpcUrl, {
    commitment,
    confirmTransactionInitialTimeout: 60000,
  });
}

export async function checkConnection(
  connection: Connection
): Promise<boolean> {
  try {
    const version = await connection.getVersion();
    return !!version;
  } catch (error) {
    console.error("Connection check failed:", error);
    return false;
  }
}

export function getNetworkConfig(network: SolanaNetwork): NetworkConfig {
  return NETWORK_CONFIGS[network];
}
