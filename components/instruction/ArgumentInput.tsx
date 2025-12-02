"use client";

import { useState } from "react";
import { Idl } from "@coral-xyz/anchor";
import {
  isArrayType,
  isOptionType,
  isStructType,
  getArrayElementType,
  getArrayLength,
  getOptionBaseType,
  typeToString,
  getDefaultValue,
} from "@/lib/anchor/instruction";

type IdlField = Idl["instructions"][number]["args"][number];

interface ArgumentInputProps {
  arg: IdlField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  idlTypes?: Idl["types"];
}

export function ArgumentInput({
  arg,
  value,
  onChange,
  error,
  idlTypes,
}: ArgumentInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const type = arg.type;
  const argName = arg.name || "argument";

  if (isOptionType(type)) {
    const baseType = getOptionBaseType(type);
    const isSet = value !== null && value !== undefined && value !== "";

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {argName}
            <span className="ml-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
              (Option)
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isSet}
              onChange={(e) => {
                if (e.target.checked) {
                  onChange(getDefaultValue(baseType));
                } else {
                  onChange(null);
                }
              }}
              className="rounded border-slate-300 dark:border-slate-700"
            />
            <span className="text-xs text-slate-600 dark:text-slate-400">
              Set value
            </span>
          </label>
        </div>
        {isSet && (
          <ArgumentInput
            arg={{ ...arg, type: baseType } as IdlField}
            value={value}
            onChange={onChange}
            error={error}
            idlTypes={idlTypes}
          />
        )}
      </div>
    );
  }

  if (isArrayType(type)) {
    const elementType = getArrayElementType(type);
    const isFixed = "array" in type;
    const length = isFixed ? getArrayLength(type) : null;
    const arrayValue = Array.isArray(value) ? value : [];

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {argName}
            <span className="ml-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
              ({typeToString(type)})
            </span>
          </label>
          {!isFixed && (
            <button
              type="button"
              onClick={() =>
                onChange([...arrayValue, getDefaultValue(elementType)])
              }
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              + Add Item
            </button>
          )}
        </div>
        <div className="space-y-2 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
          {(isFixed ? Array(length).fill(null) : arrayValue).map((_, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  [{index}]
                </span>
                {!isFixed && (
                  <button
                    type="button"
                    onClick={() => {
                      const newValue = [...arrayValue];
                      newValue.splice(index, 1);
                      onChange(newValue);
                    }}
                    className="text-xs text-red-600 dark:text-red-400 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
              <ArgumentInput
                arg={
                  {
                    ...arg,
                    type: elementType,
                    name: `${argName}[${index}]`,
                  } as IdlField
                }
                value={arrayValue[index] ?? getDefaultValue(elementType)}
                onChange={(newItemValue) => {
                  const newArray = [...arrayValue];
                  newArray[index] = newItemValue;
                  onChange(newArray);
                }}
                idlTypes={idlTypes}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isStructType(type)) {
    const structDef = idlTypes?.find((t) => t.name === type.defined);
    const structValue =
      typeof value === "object" && value !== null ? value : {};

    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {argName}
            <span className="ml-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
              ({type.defined})
            </span>
          </label>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {isExpanded ? "−" : "+"}
          </span>
        </button>
        {isExpanded && structDef && "fields" in structDef && (
          <div className="space-y-3 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
            {structDef.fields.map((field: any, index: number) => (
              <ArgumentInput
                key={index}
                arg={{ ...arg, type: field.type, name: field.name } as IdlField}
                value={structValue[field.name] ?? getDefaultValue(field.type)}
                onChange={(newFieldValue) => {
                  onChange({ ...structValue, [field.name]: newFieldValue });
                }}
                idlTypes={idlTypes}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (typeof type === "string") {
    if (type === "bool") {
      return (
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={value === true || value === "true"}
              onChange={(e) => onChange(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-700 w-4 h-4"
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {argName}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              (bool)
            </span>
          </label>
          {error && (
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>
      );
    }

    if (type === "string") {
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {argName}
            <span className="ml-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
              (string)
            </span>
          </label>
          <input
            type="text"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              error
                ? "border-red-300 dark:border-red-700"
                : "border-slate-300 dark:border-slate-700"
            }`}
          />
          {error && (
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>
      );
    }

    if (type === "publicKey") {
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {argName}
            <span className="ml-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
              (publicKey)
            </span>
          </label>
          <input
            type="text"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter public key..."
            className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-950 font-mono text-sm text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              error
                ? "border-red-300 dark:border-red-700"
                : "border-slate-300 dark:border-slate-700"
            }`}
          />
          {error && (
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {argName}
          <span className="ml-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
            ({type})
          </span>
        </label>
        <input
          type="number"
          value={value ?? 0}
          onChange={(e) => {
            const num = e.target.value === "" ? 0 : Number(e.target.value);
            onChange(isNaN(num) ? 0 : num);
          }}
          className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            error
              ? "border-red-300 dark:border-red-700"
              : "border-slate-300 dark:border-slate-700"
          }`}
        />
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {argName}
        <span className="ml-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
          ({typeToString(type)})
        </span>
      </label>
      <textarea
        value={
          typeof value === "string" ? value : JSON.stringify(value, null, 2)
        }
        onChange={(e) => {
          try {
            onChange(JSON.parse(e.target.value));
          } catch {
            onChange(e.target.value);
          }
        }}
        rows={3}
        className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          error
            ? "border-red-300 dark:border-red-700"
            : "border-slate-300 dark:border-slate-700"
        }`}
      />
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
