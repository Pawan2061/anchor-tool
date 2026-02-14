import { PublicKey } from "@solana/web3.js";
import { Idl } from "@coral-xyz/anchor";

type IdlType = Idl["instructions"][number]["args"][number]["type"];

export function resolveDefinedTypeName(defined: unknown): string | null {
  if (typeof defined === "string") {
    return defined;
  }
  if (typeof defined === "object" && defined !== null && "name" in defined) {
    return resolveDefinedTypeName((defined as { name?: unknown }).name);
  }
  return null;
}

export function isPrimitiveType(type: IdlType): boolean {
  if (typeof type === "string") {
    const primitives = [
      "u8",
      "u16",
      "u32",
      "u64",
      "i8",
      "i16",
      "i32",
      "i64",
      "bool",
      "string",
      "publicKey",
    ];
    return primitives.includes(type);
  }
  return false;
}

export function isArrayType(
  type: IdlType
): type is { vec: IdlType } | { array: [IdlType, number] } {
  if (typeof type === "object" && type !== null) {
    return "vec" in type || "array" in type;
  }
  return false;
}

export function isOptionType(type: IdlType): type is { option: IdlType } {
  if (typeof type === "object" && type !== null) {
    return "option" in type;
  }
  return false;
}

export function isStructType(type: IdlType): type is { defined: unknown } {
  if (typeof type === "object" && type !== null) {
    return "defined" in type;
  }
  return false;
}

export function getOptionBaseType(type: { option: IdlType }): IdlType {
  return type.option;
}

export function getArrayElementType(
  type: { vec: IdlType } | { array: [IdlType, number] }
): IdlType {
  if ("vec" in type) {
    return type.vec;
  }
  return type.array[0];
}

export function getArrayLength(type: { array: [IdlType, number] }): number {
  return type.array[1];
}

export function typeToString(type: IdlType): string {
  if (typeof type === "string") {
    return type;
  }
  if (isArrayType(type)) {
    if ("vec" in type) {
      return `Vec<${typeToString(type.vec)}>`;
    }
    return `[${typeToString(type.array[0])}; ${type.array[1]}]`;
  }
  if (isOptionType(type)) {
    return `Option<${typeToString(type.option)}>`;
  }
  if (isStructType(type)) {
    return resolveDefinedTypeName(type.defined) ?? JSON.stringify(type.defined);
  }
  return JSON.stringify(type);
}

export function getDefaultValue(type: IdlType): unknown {
  if (typeof type === "string") {
    if (type === "bool") return false;
    if (type === "string") return "";
    if (type === "publicKey") return "";
    return 0;
  }
  if (isArrayType(type)) {
    if ("vec" in type) {
      return [];
    }
    const length = getArrayLength(type);
    return Array(length).fill(getDefaultValue(getArrayElementType(type)));
  }
  if (isOptionType(type)) {
    return null;
  }
  if (isStructType(type)) {
    return {};
  }
  return null;
}

export function parseValue(value: unknown, type: IdlType): unknown {
  if (typeof type === "string") {
    if (type === "bool") {
      return typeof value === "boolean"
        ? value
        : value === "true" || value === true;
    }
    if (type === "string") {
      return String(value);
    }
    if (type === "publicKey") {
      if (value instanceof PublicKey) return value;
      if (typeof value === "string" && value.trim()) {
        return new PublicKey(value);
      }
      throw new Error("Invalid public key");
    }
    const num = Number(value);
    if (isNaN(num)) throw new Error(`Invalid number: ${value}`);
    return num;
  }
  if (isArrayType(type)) {
    if (!Array.isArray(value)) {
      throw new Error("Expected array");
    }
    const elementType = getArrayElementType(type);
    return value.map((v) => parseValue(v, elementType));
  }
  if (isOptionType(type)) {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    return parseValue(value, getOptionBaseType(type));
  }
  if (isStructType(type)) {
    if (typeof value !== "object" || value === null) {
      throw new Error("Expected object");
    }
    return value;
  }
  return value;
}
