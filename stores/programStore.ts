import { create } from "zustand";
import { PublicKey } from "@solana/web3.js";
import { Idl } from "@coral-xyz/anchor";
import { Program } from "@/types/anchor";

interface ProgramStore {
  programs: Program[];
  activeProgramId: string | null;
  addProgram: (
    name: string,
    programId: PublicKey,
    idl: Idl,
    network: string
  ) => void;
  removeProgram: (id: string) => void;
  setActiveProgram: (id: string) => void;
  getActiveProgram: () => Program | null;
  updateProgram: (id: string, updates: Partial<Program>) => void;
}

export const useProgramStore = create<ProgramStore>((set, get) => ({
  programs: [],
  activeProgramId: null,

  addProgram: (
    name: string,
    programId: PublicKey,
    idl: Idl,
    network: string
  ) => {
    const id = `program-${Date.now()}`;
    const program: Program = {
      id,
      name,
      programId,
      idl,
      network,
      createdAt: Date.now(),
    };

    set((state) => ({
      programs: [...state.programs, program],
      activeProgramId: state.activeProgramId || id,
    }));
  },

  removeProgram: (id: string) => {
    set((state) => {
      const newPrograms = state.programs.filter((p) => p.id !== id);
      const newActiveId =
        state.activeProgramId === id
          ? newPrograms.length > 0
            ? newPrograms[0].id
            : null
          : state.activeProgramId;

      return {
        programs: newPrograms,
        activeProgramId: newActiveId,
      };
    });
  },

  setActiveProgram: (id: string) => {
    set({ activeProgramId: id });
  },

  getActiveProgram: () => {
    const { programs, activeProgramId } = get();
    return programs.find((p) => p.id === activeProgramId) || null;
  },

  updateProgram: (id: string, updates: Partial<Program>) => {
    set((state) => ({
      programs: state.programs.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
  },
}));
