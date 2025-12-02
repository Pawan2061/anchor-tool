"use client";

import { useState, useRef } from "react";
import { FileCode, Plus, X, Loader2 } from "lucide-react";
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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Programs
          </h3>
        </div>
        <button
          onClick={() => setShowLoader(!showLoader)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
            showLoader
              ? "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              : "bg-blue-600 hover:bg-blue-700 text-white"
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
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-slate-700 dark:text-slate-300">
              Program Name
            </label>
            <input
              type="text"
              placeholder="My Program"
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 text-slate-700 dark:text-slate-300">
              Program ID
            </label>
            <input
              type="text"
              placeholder="Program public key"
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 text-slate-700 dark:text-slate-300">
              IDL File
            </label>
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 text-xs text-slate-600 dark:text-slate-400 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-300 hover:file:bg-slate-200 dark:hover:file:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 text-slate-700 dark:text-slate-300">
              Or Paste IDL JSON
            </label>
            <textarea
              placeholder='{"version": "0.1.0", "name": "my_program", ...}'
              value={idlJson}
              onChange={(e) => {
                setIdlJson(e.target.value);
                setError("");
              }}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={8}
            />
          </div>

          {error && (
            <div className="px-3 py-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-md">
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleLoad}
              className="flex-1 px-4 py-2.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors flex items-center justify-center gap-2"
            >
              <Loader2 className="w-3.5 h-3.5" />
              Load Program
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {programs.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
            Loaded Programs ({programs.length})
          </p>
          <div className="space-y-2">
            {programs.map((program) => (
              <div
                key={program.id}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  program.id === activeProgramId
                    ? "border-blue-500 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-sm"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm"
                }`}
                onClick={() => setActiveProgram(program.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm text-slate-900 dark:text-slate-50 truncate">
                        {program.name}
                      </p>
                      {program.id === activeProgramId && (
                        <span className="text-xs font-medium bg-blue-600 text-white px-2 py-0.5 rounded flex-shrink-0">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono break-all">
                      {program.programId.toString().slice(0, 8)}...
                      {program.programId.toString().slice(-8)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1.5">
                      {getInstructionCount(program.idl)} instructions •{" "}
                      <span className="capitalize">{program.network}</span>
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Remove ${program.name}?`)) {
                        removeProgram(program.id);
                      }
                    }}
                    className="ml-2 p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors flex-shrink-0"
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
        <div className="text-center py-8">
          <FileCode className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
            No programs loaded
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Click &quot;Load IDL&quot; to get started
          </p>
        </div>
      )}
    </div>
  );
}
