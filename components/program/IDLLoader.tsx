"use client";

import { useState, useRef } from "react";
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

      // Reset form
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Programs</h3>
        <button
          onClick={() => setShowLoader(!showLoader)}
          className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          {showLoader ? "Cancel" : "Load IDL"}
        </button>
      </div>

      {showLoader && (
        <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-md space-y-3 bg-white dark:bg-gray-800">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Program Name
            </label>
            <input
              type="text"
              placeholder="My Program"
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Program ID
            </label>
            <input
              type="text"
              placeholder="Program public key"
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 font-mono text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              IDL File
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Or Paste IDL JSON
            </label>
            <textarea
              placeholder='{"version": "0.1.0", "name": "my_program", ...}'
              value={idlJson}
              onChange={(e) => {
                setIdlJson(e.target.value);
                setError("");
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 font-mono text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={8}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleLoad}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors font-medium"
            >
              Load Program
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {programs.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Loaded Programs:
          </p>
          {programs.map((program) => (
            <div
              key={program.id}
              className={`p-3 border rounded-md cursor-pointer transition-colors ${
                program.id === activeProgramId
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
              onClick={() => setActiveProgram(program.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {program.name}
                    </p>
                    {program.id === activeProgramId && (
                      <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-mono mt-1">
                    {program.programId.toString().slice(0, 8)}...
                    {program.programId.toString().slice(-8)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {getInstructionCount(program.idl)} instructions •{" "}
                    {program.network}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Remove ${program.name}?`)) {
                      removeProgram(program.id);
                    }
                  }}
                  className="ml-2 px-2 py-1 text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                  title="Remove program"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {programs.length === 0 && !showLoader && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No programs loaded.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Click "Load IDL" to get started.
          </p>
        </div>
      )}
    </div>
  );
}
