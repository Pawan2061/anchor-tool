import { PublicKey } from "@solana/web3.js";
import { Idl, BN } from "@coral-xyz/anchor";

type IdlType = Idl["instructions"][number]["args"][number]["type"];
type IdlTypes = Idl["types"];
type IdlTypeDef = NonNullable<IdlTypes>[number];

type EnumVariant = {
  name: string;
  fields?: unknown[];
};

type EnumTypeDef = {
  kind: "enum";
  variants: EnumVariant[];
};

type StructField = {
  name: string;
  type: IdlType;
};

type StructTypeDef = {
  kind: "struct";
  fields: StructField[];
};

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

export function isStructType(type: IdlType): type is IdlType & { defined: unknown } {
  if (typeof type === "object" && type !== null) {
    return "defined" in type;
  }
  return false;
}

function isLargeIntegerType(type: string): boolean {
  return ["u64", "u128", "i64", "i128"].includes(type);
}

function isIntegerType(type: string): boolean {
  return [
    "u8",
    "u16",
    "u32",
    "u64",
    "u128",
    "i8",
    "i16",
    "i32",
    "i64",
    "i128",
  ].includes(type);
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

function findDefinedTypeDefinition(
  typeName: string,
  idlTypes?: IdlTypes
): IdlTypeDef | null {
  if (!idlTypes) return null;
  return idlTypes.find((t) => t.name === typeName) ?? null;
}

function parseStructValue(
  value: unknown,
  structType: StructTypeDef,
  idlTypes?: IdlTypes
): unknown {
  if (typeof value !== "object" || value === null) {
    throw new Error("Expected object");
  }
  const input = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  structType.fields.forEach((field) => {
    result[field.name] = parseValue(input[field.name], field.type, idlTypes);
  });
  return result;
}

function parseEnumValue(
  value: unknown,
  enumType: EnumTypeDef,
  idlTypes?: IdlTypes
): unknown {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Expected enum object");
  }

  const variantEntries = Object.entries(value);
  if (variantEntries.length !== 1) {
    throw new Error("Enum value must contain exactly one variant");
  }

  const [variantName, variantPayload] = variantEntries[0];
  const variant = enumType.variants.find((v) => v.name === variantName);
  if (!variant) {
    throw new Error(`Invalid enum variant: ${variantName}`);
  }

  const fields = Array.isArray(variant.fields) ? variant.fields : [];
  if (fields.length === 0) {
    return { [variantName]: {} };
  }

  const namedFields = fields.every(
    (f) => typeof f === "object" && f !== null && "name" in (f as object)
  );

  if (namedFields) {
    if (typeof variantPayload !== "object" || variantPayload === null) {
      throw new Error(`Variant ${variantName} expects object payload`);
    }
    const payloadObj = variantPayload as Record<string, unknown>;
    const parsedPayload: Record<string, unknown> = {};
    (fields as StructField[]).forEach((field) => {
      parsedPayload[field.name] = parseValue(
        payloadObj[field.name],
        field.type,
        idlTypes
      );
    });
    return { [variantName]: parsedPayload };
  }

  if (!Array.isArray(variantPayload)) {
    throw new Error(`Variant ${variantName} expects tuple payload`);
  }

  const parsedTuple = variantPayload.map((item, index) =>
    parseValue(item, fields[index] as IdlType, idlTypes)
  );
  return { [variantName]: parsedTuple };
}

function parseDefinedValue(
  value: unknown,
  defined: unknown,
  idlTypes?: IdlTypes
): unknown {
  const typeName = resolveDefinedTypeName(defined);
  if (!typeName) {
    return value;
  }

  const def = findDefinedTypeDefinition(typeName, idlTypes);
  if (!def || !def.type || typeof def.type !== "object") {
    return value;
  }

  const typeDef = def.type as { kind?: string; fields?: unknown[]; variants?: unknown[] };
  if (typeDef.kind === "struct") {
    const fields = Array.isArray(typeDef.fields) ? (typeDef.fields as StructField[]) : [];
    return parseStructValue(value, { kind: "struct", fields }, idlTypes);
  }
  if (typeDef.kind === "enum") {
    const variants = Array.isArray(typeDef.variants)
      ? (typeDef.variants as EnumVariant[])
      : [];
    return parseEnumValue(value, { kind: "enum", variants }, idlTypes);
  }

  return value;
}

export function parseValue(
  value: unknown,
  type: IdlType,
  idlTypes?: IdlTypes
): unknown {
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
    if (isLargeIntegerType(type)) {
      const raw = String(value).trim();
      if (!raw) throw new Error(`Invalid ${type} value`);
      try {
        return new BN(raw, 10);
      } catch {
        throw new Error(`Invalid ${type} value: ${value}`);
      }
    }

    if (isIntegerType(type)) {
      const num = Number(value);
      if (!Number.isInteger(num)) throw new Error(`Invalid integer: ${value}`);
      return num;
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
    return value.map((v) => parseValue(v, elementType, idlTypes));
  }
  if (isOptionType(type)) {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    return parseValue(value, getOptionBaseType(type), idlTypes);
  }
  if (isStructType(type)) {
    return parseDefinedValue(value, type.defined, idlTypes);
  }
  return value;
}
