"use client";

import { useState, useRef } from "react";
import { FileCode, Plus, X, Upload, CheckCircle2, Layers } from "lucide-react";
import { PublicKey } from "@solana/web3.js";
import { useProgramStore } from "@/stores/programStore";
import { useNetworkStore } from "@/stores/networkStore";
import { isValidPublicKey } from "@/lib/utils/validation";
import { parseIDL, getInstructionCount } from "@/lib/anchor/idl";

export function IDLLoader() {
  const {
    addProgram,
    programs,
    setActiveProgram,
    activeProgramId,
    removeProgram,
  } = useProgramStore();
  const { network } = useNetworkStore();
  const [showLoader, setShowLoader] = useState(false);
  const [programName, setProgramName] = useState("");
  const [programId, setProgramId] = useState("");
  const [idlJson, setIdlJson] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const idl = parseIDL(content);

        setIdlJson(content);
        setError("");

        if (!programName.trim() && idl.name) {
          setProgramName(idl.name);
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(`Invalid IDL file: ${errorMessage}`);
      }
    };
    reader.onerror = () => {
      setError("Failed to read file");
    };
    reader.readAsText(file);
  };

  const handleLoad = () => {
    setError("");

    if (!programName.trim()) {
      setError("Please enter a program name");
      return;
    }

    if (!programId.trim()) {
      setError("Please enter a program ID");
      return;
    }

    if (!isValidPublicKey(programId)) {
      setError("Invalid program ID (must be a valid Solana public key)");
      return;
    }

    if (!idlJson.trim()) {
      setError("Please load an IDL file or paste IDL JSON");
      return;
    }

    try {
      const idl = parseIDL(idlJson);
      const pubkey = new PublicKey(programId);
      addProgram(programName, pubkey, idl, network);

      setProgramName("");
      setProgramId("");
      setIdlJson("");
      setShowLoader(false);
      setError("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to load IDL: ${errorMessage}`);
    }
  };

  const handleCancel = () => {
    setShowLoader(false);
    setProgramName("");
    setProgramId("");
    setIdlJson("");
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[var(--foreground-muted)]" />
          <h3 className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">
            Programs
          </h3>
        </div>
        <button
          onClick={() => setShowLoader(!showLoader)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            showLoader
              ? "bg-[var(--background-secondary)] text-[var(--foreground)] hover:bg-[var(--surface-hover)] border border-[var(--border)]"
              : "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white"
          }`}
        >
          {showLoader ? (
            <>
              <X className="w-3.5 h-3.5" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              Load IDL
            </>
          )}
        </button>
      </div>

      {showLoader && (
        <div className="p-5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] space-y-4 animate-slide-up">
          <div>
            <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-2">
              Program Name
            </label>
            <input
              type="text"
              placeholder="My Program"
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-2">
              Program ID
            </label>
            <input
              type="text"
              placeholder="Program public key"
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] font-mono text-xs text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-2">
              IDL File
            </label>
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
                id="idl-file-input"
              />
              <label
                htmlFor="idl-file-input"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-[var(--background-secondary)] border-2 border-dashed border-[var(--border)] text-sm text-[var(--foreground-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] cursor-pointer transition-all"
              >
                <Upload className="w-4 h-4" />
                {idlJson ? "File loaded ✓" : "Choose IDL file..."}
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--foreground-muted)] mb-2">
              Or Paste IDL JSON
            </label>
            <textarea
              placeholder='{"version": "0.1.0", "name": "my_program", ...}'
              value={idlJson}
              onChange={(e) => {
                setIdlJson(e.target.value);
                setError("");
              }}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] font-mono text-xs text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all resize-none"
              rows={6}
            />
          </div>

          {error && (
            <div className="px-3 py-2.5 rounded-lg bg-[var(--error-subtle)] border border-[var(--error)]/20">
              <p className="text-xs text-[var(--error)]">{error}</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleLoad}
              className="flex-1 px-4 py-3 text-sm font-semibold rounded-xl bg-[var(--success)] hover:bg-emerald-600 text-white transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Load Program
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-3 text-sm font-semibold rounded-xl bg-[var(--background-secondary)] text-[var(--foreground)] hover:bg-[var(--surface-hover)] border border-[var(--border)] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {programs.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">
            Loaded Programs ({programs.length})
          </p>
          <div className="space-y-2">
            {programs.map((program) => (
              <div
                key={program.id}
                className={`p-3 rounded-xl cursor-pointer transition-all ${
                  program.id === activeProgramId
                    ? "bg-[var(--accent-subtle)] border-2 border-[var(--accent)]"
                    : "bg-[var(--surface-elevated)] border border-[var(--border)] hover:border-[var(--foreground-muted)]"
                }`}
                onClick={() => setActiveProgram(program.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm text-[var(--foreground)] truncate">
                        {program.name}
                      </p>
                      {program.id === activeProgramId && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[var(--accent)] text-white">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--foreground-muted)] font-mono mb-2">
                      {program.programId.toString().slice(0, 8)}...
                      {program.programId.toString().slice(-6)}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--background-secondary)] text-[var(--foreground-muted)]">
                        {getInstructionCount(program.idl)} instructions
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--background-secondary)] text-[var(--foreground-muted)] capitalize">
                        {program.network}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Remove ${program.name}?`)) {
                        removeProgram(program.id);
                      }
                    }}
                    className="ml-2 p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--error)] hover:bg-[var(--error-subtle)] transition-colors flex-shrink-0"
                    title="Remove program"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {programs.length === 0 && !showLoader && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-[var(--background-secondary)] flex items-center justify-center mx-auto mb-4">
            <FileCode className="w-8 h-8 text-[var(--foreground-muted)]" />
          </div>
          <p className="text-sm font-semibold text-[var(--foreground)] mb-1">
            No programs loaded
          </p>
          <p className="text-xs text-[var(--foreground-muted)]">
            Click &quot;Load IDL&quot; to get started
          </p>
        </div>
      )}
    </div>
  );
}
