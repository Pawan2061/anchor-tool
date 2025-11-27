import { PublicKey } from "@solana/web3.js";
import { Idl } from "@coral-xyz/anchor";

export interface Program {
  id: string;
  name: string;
  programId: PublicKey;
  idl: Idl;
  network: string;
  createdAt: number;
}

export interface Instruction {
  name: string;
  accounts: AccountMeta[];
  args: InstructionArg[];
}

export interface AccountMeta {
  name: string;
  isMut: boolean;
  isSigner: boolean;
  isOptional?: boolean;
}

export interface InstructionArg {
  name: string;
  type: string;
  required: boolean;
}

export interface SavedRequest {
  id: string;
  name: string;
  programId: string;
  instructionName: string;
  parameters: Record<string, any>;
  accounts: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  requests: SavedRequest[];
  createdAt: number;
  updatedAt: number;
}
