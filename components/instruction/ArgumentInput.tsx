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

function isLargeIntegerType(type: string): boolean {
  return ["u64", "u128", "i64", "i128"].includes(type);
}

type VariantField = IdlField["type"] | { name: string; type: IdlField["type"] };
type EnumVariant = { name: string; fields?: VariantField[] };
const SYSTEM_PROGRAM_PLACEHOLDER = "11111111111111111111111111111111";

function getDefinedTypeDef(
  idlTypes: Idl["types"] | undefined,
  typeName: string
): { kind?: string; fields?: unknown[]; variants?: unknown[] } | null {
  if (!idlTypes) return null;
  const found = idlTypes.find((t) => t.name === typeName);
  if (!found || !found.type || typeof found.type !== "object") return null;
  return found.type as { kind?: string; fields?: unknown[]; variants?: unknown[] };
}

function getEnumVariants(typeDef: { variants?: unknown[] } | null): EnumVariant[] {
  if (!typeDef || !Array.isArray(typeDef.variants)) return [];
  return typeDef.variants as EnumVariant[];
}

function isNamedVariantFields(fields: VariantField[]): fields is { name: string; type: IdlField["type"] }[] {
  return fields.every(
    (f) => typeof f === "object" && f !== null && "name" in (f as object)
  );
}

function getExampleValue(
  type: IdlField["type"],
  idlTypes?: Idl["types"]
): unknown {
  if (typeof type === "string") {
    if (type === "bool") return true;
    if (type === "string") return "example";
    if (type === "publicKey") return SYSTEM_PROGRAM_PLACEHOLDER;
    if (isLargeIntegerType(type)) return "1";
    return 1;
  }

  if ("option" in type) {
    return getExampleValue(type.option as IdlField["type"], idlTypes);
  }

  if ("vec" in type) {
    return [getExampleValue(type.vec as IdlField["type"], idlTypes)];
  }

  if ("array" in type) {
    const [elementType, length] = type.array as [IdlField["type"], number];
    return Array.from({ length }, () => getExampleValue(elementType, idlTypes));
  }

  if ("defined" in type) {
    const typeName = resolveDefinedTypeName(type.defined);
    if (!typeName || !idlTypes) return {};
    const def = idlTypes.find((t) => t.name === typeName);
    const typeDef =
      def && def.type && typeof def.type === "object"
        ? (def.type as { kind?: string; fields?: unknown[]; variants?: unknown[] })
        : null;
    if (!typeDef) return {};

    if (typeDef.kind === "struct" && Array.isArray(typeDef.fields)) {
      const obj: Record<string, unknown> = {};
      (typeDef.fields as { name: string; type: IdlField["type"] }[]).forEach(
        (field) => {
          obj[field.name] = getExampleValue(field.type, idlTypes);
        }
      );
      return obj;
    }

    if (typeDef.kind === "enum" && Array.isArray(typeDef.variants) && typeDef.variants.length > 0) {
      const first = typeDef.variants[0] as EnumVariant;
      const fields = Array.isArray(first.fields) ? first.fields : [];
      if (fields.length === 0) return { [first.name]: {} };
      if (isNamedVariantFields(fields)) {
        const payload: Record<string, unknown> = {};
        fields.forEach((field) => {
          payload[field.name] = getExampleValue(field.type, idlTypes);
        });
        return { [first.name]: payload };
      }
      return {
        [first.name]: fields.map((field) =>
          getExampleValue(field as IdlField["type"], idlTypes)
        ),
      };
    }
  }

  return {};
}

export function ArgumentInput({
  arg,
  value,
  onChange,
  error,
  idlTypes,
}: ArgumentInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [exampleHint, setExampleHint] = useState<string | null>(null);
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
    const typeName = resolveDefinedTypeName(type.defined) ?? "Defined";
    const typeDef = getDefinedTypeDef(idlTypes, typeName);
    const structValue =
      typeof value === "object" && value !== null ? value : {};

    if (typeDef?.kind === "enum") {
      const variants = getEnumVariants(typeDef);
      const current =
        typeof value === "object" && value !== null && !Array.isArray(value)
          ? value
          : {};
      const [selectedVariantName] = Object.keys(current as Record<string, unknown>);
      const selectedVariant =
        variants.find((v) => v.name === selectedVariantName) ?? variants[0];
      const applyVariantExample = (variant: EnumVariant) => {
        const fields = Array.isArray(variant.fields) ? variant.fields : [];
        if (fields.length === 0) {
          onChange({ [variant.name]: {} });
          setExampleHint(
            `Selected "${variant.name}". This variant has no fields, so it is ready to submit.`
          );
          return;
        }
        if (isNamedVariantFields(fields)) {
          const payload: Record<string, unknown> = {};
          fields.forEach((field) => {
            payload[field.name] = getExampleValue(field.type, idlTypes);
          });
          onChange({ [variant.name]: payload });
          setExampleHint(
            `Filled example values for "${variant.name}". Replace placeholder public keys and text values before sending.`
          );
          return;
        }
        onChange({
          [variant.name]: fields.map((field) =>
            getExampleValue(field as IdlField["type"], idlTypes)
          ),
        });
        setExampleHint(
          `Filled tuple example values for "${variant.name}". Review each position before sending.`
        );
      };

      return (
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <span className="font-semibold text-sm text-[var(--foreground)]">
                {argName}
              </span>
              <code className="text-[10px] px-2 py-0.5 rounded bg-[var(--code-bg)] text-[var(--code-text)] font-mono">
                {typeName} (enum)
              </code>
            </label>
            <div className="flex gap-2">
              <select
                value={selectedVariant?.name ?? ""}
                onChange={(e) => {
                  setExampleHint(null);
                  const variant = variants.find((v) => v.name === e.target.value);
                  if (!variant) return;
                  const fields = Array.isArray(variant.fields) ? variant.fields : [];
                  if (fields.length === 0) {
                    onChange({ [variant.name]: {} });
                    return;
                  }
                  if (isNamedVariantFields(fields)) {
                    const initial: Record<string, unknown> = {};
                    fields.forEach((field) => {
                      initial[field.name] = getDefaultValue(field.type);
                    });
                    onChange({ [variant.name]: initial });
                  } else {
                    onChange({
                      [variant.name]: fields.map((field) =>
                        getDefaultValue(field as IdlField["type"])
                      ),
                    });
                  }
                }}
                className="flex-1 px-4 py-3 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)]"
              >
                {variants.map((variant) => (
                  <option key={variant.name} value={variant.name}>
                    {variant.name}
                  </option>
                ))}
              </select>
              {selectedVariant && (
                <button
                  type="button"
                  onClick={() => applyVariantExample(selectedVariant)}
                  className="px-3 py-2 rounded-xl bg-[var(--accent-subtle)] text-[var(--accent)] text-xs font-semibold hover:bg-[var(--accent)] hover:text-white transition-colors"
                >
                  Use Example
                </button>
              )}
            </div>
            {exampleHint && (
              <div className="mt-2 px-3 py-2 rounded-lg bg-[var(--info-subtle)] border border-[var(--info)]/20">
                <p className="text-xs text-[var(--info)] leading-relaxed">
                  {exampleHint}
                </p>
              </div>
            )}
          </div>

          {selectedVariant && (() => {
            const fields = Array.isArray(selectedVariant.fields)
              ? selectedVariant.fields
              : [];
            const payload =
              (current as Record<string, unknown>)[selectedVariant.name];

            if (fields.length === 0) {
              return null;
            }

            if (isNamedVariantFields(fields)) {
              const payloadObj =
                typeof payload === "object" && payload !== null && !Array.isArray(payload)
                  ? (payload as Record<string, unknown>)
                  : {};
              return (
                <div className="space-y-4 pl-4 border-l-2 border-[var(--border)]">
                  {fields.map((field, index) => (
                    <ArgumentInput
                      key={index}
                      arg={
                        {
                          ...arg,
                          type: field.type,
                          name: field.name,
                        } as IdlField
                      }
                      value={payloadObj[field.name] ?? getDefaultValue(field.type)}
                      onChange={(newFieldValue) => {
                        onChange({
                          [selectedVariant.name]: {
                            ...payloadObj,
                            [field.name]: newFieldValue,
                          },
                        });
                      }}
                      idlTypes={idlTypes}
                    />
                  ))}
                </div>
              );
            }

            const tuplePayload = Array.isArray(payload) ? payload : [];
            return (
              <div className="space-y-4 pl-4 border-l-2 border-[var(--border)]">
                {fields.map((field, index) => {
                  const fieldType = field as IdlField["type"];
                  return (
                    <ArgumentInput
                      key={index}
                      arg={
                        {
                          ...arg,
                          type: fieldType,
                          name: `${selectedVariant.name}[${index}]`,
                        } as IdlField
                      }
                      value={tuplePayload[index] ?? getDefaultValue(fieldType)}
                      onChange={(newFieldValue) => {
                        const next = [...tuplePayload];
                        next[index] = newFieldValue;
                        onChange({ [selectedVariant.name]: next });
                      }}
                      idlTypes={idlTypes}
                    />
                  );
                })}
              </div>
            );
          })()}
        </div>
      );
    }

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
              {typeName}
            </code>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-[var(--foreground-muted)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--foreground-muted)]" />
          )}
        </button>
        {isExpanded && typeDef && typeDef.kind === "struct" && Array.isArray(typeDef.fields) && (
          <div className="space-y-4 pl-4 border-l-2 border-[var(--border)]">
            {(typeDef.fields as { name: string; type: IdlField["type"] }[]).map(
              (field, index) => {
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
                        typeof structValue === "object" && structValue !== null
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

    const useTextInput = isLargeIntegerType(type);
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
          type={useTextInput ? "text" : "number"}
          value={
            useTextInput
              ? typeof value === "string"
                ? value
                : value !== undefined && value !== null
                ? String(value)
                : ""
              : typeof value === "number"
              ? value
              : typeof value === "string"
              ? Number(value) || 0
              : 0
          }
          onChange={(e) => {
            if (useTextInput) {
              onChange(e.target.value);
              return;
            }
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
