"use client";

import { useState } from "react";
import { Info, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
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
  resolveDefinedTypeName,
} from "@/lib/anchor/instruction";
import {
  getArgumentDescription,
  getArgumentPlaceholder,
} from "@/lib/utils/argumentHelpers";

type IdlField = Idl["instructions"][number]["args"][number];

interface ArgumentInputProps {
  arg: IdlField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  idlTypes?: Idl["types"];
}

function resolveArgName(name: unknown, fallback = "argument"): string {
  if (typeof name === "string") {
    return name;
  }
  if (typeof name === "object" && name !== null && "name" in name) {
    return resolveArgName((name as { name?: unknown }).name, fallback);
  }
  return fallback;
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
  const argName = resolveArgName(arg.name);
  const typeString = typeof type === "string" ? type : typeToString(type);
  const description = getArgumentDescription(argName, typeString);
  const placeholder = getArgumentPlaceholder(argName, typeString);

  if (isOptionType(type)) {
    const baseType = getOptionBaseType(type);
    const isSet = value !== null && value !== undefined && value !== "";

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2">
            <span className="font-semibold text-sm text-[var(--foreground)]">
              {argName}
            </span>
            <code className="text-[10px] px-2 py-0.5 rounded bg-[var(--code-bg)] text-[var(--code-text)] font-mono">
              Option
            </code>
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
              className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
            />
            <span className="text-xs text-[var(--foreground-muted)]">
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
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2">
            <span className="font-semibold text-sm text-[var(--foreground)]">
              {argName}
            </span>
            <code className="text-[10px] px-2 py-0.5 rounded bg-[var(--code-bg)] text-[var(--code-text)] font-mono">
              {typeToString(type)}
            </code>
          </label>
          {!isFixed && (
            <button
              type="button"
              onClick={() =>
                onChange([...arrayValue, getDefaultValue(elementType)])
              }
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-[var(--accent-subtle)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-all"
            >
              <Plus className="w-3 h-3" />
              Add Item
            </button>
          )}
        </div>
        <div className="space-y-3 pl-4 border-l-2 border-[var(--border)]">
          {(isFixed ? Array(length).fill(null) : arrayValue).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[var(--foreground-muted)] bg-[var(--background-secondary)] px-2 py-1 rounded">
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
                    className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--error)] hover:bg-[var(--error-subtle)] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
    const structTypeName = resolveDefinedTypeName(type.defined) ?? "Struct";
    const structDef = idlTypes?.find((t) => t.name === structTypeName);
    const structValue =
      typeof value === "object" && value !== null ? value : {};

    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-[var(--foreground)]">
              {argName}
            </span>
            <code className="text-[10px] px-2 py-0.5 rounded bg-[var(--code-bg)] text-[var(--code-text)] font-mono">
              {structTypeName}
            </code>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-[var(--foreground-muted)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--foreground-muted)]" />
          )}
        </button>
        {isExpanded && structDef && "fields" in structDef && (
          <div className="space-y-4 pl-4 border-l-2 border-[var(--border)]">
            {Array.isArray(structDef.fields) &&
              structDef.fields.map(
                (
                  field: { name: string; type: IdlField["type"] },
                  index: number
                ) => {
                  const fieldValue =
                    typeof structValue === "object" &&
                    structValue !== null &&
                    field.name in structValue
                      ? (structValue as Record<string, unknown>)[field.name]
                      : undefined;
                  return (
                    <ArgumentInput
                      key={index}
                      arg={
                        {
                          ...arg,
                          type: field.type,
                          name: field.name,
                        } as IdlField
                      }
                      value={fieldValue ?? getDefaultValue(field.type)}
                      onChange={(newFieldValue) => {
                        const currentValue =
                          typeof structValue === "object" &&
                          structValue !== null
                            ? (structValue as Record<string, unknown>)
                            : {};
                        onChange({
                          ...currentValue,
                          [field.name]: newFieldValue,
                        });
                      }}
                      idlTypes={idlTypes}
                    />
                  );
                }
              )}
          </div>
        )}
      </div>
    );
  }

  if (typeof type === "string") {
    if (type === "bool") {
      return (
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors">
            <input
              type="checkbox"
              checked={value === true || value === "true"}
              onChange={(e) => onChange(e.target.checked)}
              className="w-5 h-5 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
            />
            <span className="font-semibold text-sm text-[var(--foreground)]">
              {argName}
            </span>
            <code className="text-[10px] px-2 py-0.5 rounded bg-[var(--code-bg)] text-[var(--code-text)] font-mono">
              bool
            </code>
          </label>
          {error && (
            <p className="text-xs font-medium text-[var(--error)]">{error}</p>
          )}
        </div>
      );
    }

    if (type === "string") {
      return (
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <span className="font-semibold text-sm text-[var(--foreground)]">
              {argName}
            </span>
            <code className="text-[10px] px-2 py-0.5 rounded bg-[var(--code-bg)] text-[var(--code-text)] font-mono">
              string
            </code>
          </label>
          {description && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[var(--info-subtle)] border border-[var(--info)]/20">
              <Info className="w-4 h-4 text-[var(--info)] mt-0.5 flex-shrink-0" />
              <p className="text-xs text-[var(--info)] leading-relaxed">
                {description}
              </p>
            </div>
          )}
          <input
            type="text"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full px-4 py-3 rounded-xl bg-[var(--background-secondary)] border text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all ${
              error
                ? "border-[var(--error)] bg-[var(--error-subtle)]"
                : "border-[var(--border)] hover:border-[var(--foreground-muted)]"
            }`}
          />
          {error && (
            <p className="text-xs font-medium text-[var(--error)]">{error}</p>
          )}
        </div>
      );
    }

    if (type === "publicKey") {
      return (
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <span className="font-semibold text-sm text-[var(--foreground)]">
              {argName}
            </span>
            <code className="text-[10px] px-2 py-0.5 rounded bg-[var(--code-bg)] text-[var(--code-text)] font-mono">
              publicKey
            </code>
          </label>
          <input
            type="text"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter public key..."
            className={`w-full px-4 py-3 rounded-xl bg-[var(--background-secondary)] border font-mono text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all ${
              error
                ? "border-[var(--error)] bg-[var(--error-subtle)]"
                : "border-[var(--border)] hover:border-[var(--foreground-muted)]"
            }`}
          />
          {error && (
            <p className="text-xs font-medium text-[var(--error)]">{error}</p>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <span className="font-semibold text-sm text-[var(--foreground)]">
            {argName}
          </span>
          <code className="text-[10px] px-2 py-0.5 rounded bg-[var(--code-bg)] text-[var(--code-text)] font-mono">
            {type}
          </code>
        </label>
        {description && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[var(--info-subtle)] border border-[var(--info)]/20">
            <Info className="w-4 h-4 text-[var(--info)] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[var(--info)] leading-relaxed">
              {description}
            </p>
          </div>
        )}
        <input
          type="number"
          value={
            typeof value === "number"
              ? value
              : typeof value === "string"
              ? Number(value) || 0
              : 0
          }
          onChange={(e) => {
            const num = e.target.value === "" ? 0 : Number(e.target.value);
            onChange(isNaN(num) ? 0 : num);
          }}
          placeholder={placeholder}
          className={`w-full px-4 py-3 rounded-xl bg-[var(--background-secondary)] border font-mono text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all ${
            error
              ? "border-[var(--error)] bg-[var(--error-subtle)]"
              : "border-[var(--border)] hover:border-[var(--foreground-muted)]"
          }`}
        />
        {error && (
          <p className="text-xs font-medium text-[var(--error)]">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2">
        <span className="font-semibold text-sm text-[var(--foreground)]">
          {argName}
        </span>
        <code className="text-[10px] px-2 py-0.5 rounded bg-[var(--code-bg)] text-[var(--code-text)] font-mono">
          {typeToString(type)}
        </code>
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
        rows={4}
        className={`w-full px-4 py-3 rounded-xl bg-[var(--background-secondary)] border font-mono text-xs text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all resize-none ${
          error
            ? "border-[var(--error)] bg-[var(--error-subtle)]"
            : "border-[var(--border)] hover:border-[var(--foreground-muted)]"
        }`}
      />
      {error && (
        <p className="text-xs font-medium text-[var(--error)]">{error}</p>
      )}
    </div>
  );
}
