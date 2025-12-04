import { Idl } from "@coral-xyz/anchor";

export function validateIDL(idl: unknown): idl is Idl {
  if (typeof idl !== "object" || idl === null) {
    return false;
  }

  const obj = idl as Record<string, unknown>;

  const version =
    obj.version ||
    (obj.metadata &&
      typeof obj.metadata === "object" &&
      (obj.metadata as Record<string, unknown>).version);

  if (typeof version !== "string") {
    return false;
  }

  const name =
    obj.name ||
    (obj.metadata &&
      typeof obj.metadata === "object" &&
      (obj.metadata as Record<string, unknown>).name);

  if (typeof name !== "string") {
    return false;
  }

  if (obj.instructions !== undefined && !Array.isArray(obj.instructions)) {
    return false;
  }

  if (obj.accounts !== undefined && !Array.isArray(obj.accounts)) {
    return false;
  }

  return true;
}

export function parseIDL(jsonString: string): Idl {
  try {
    const trimmed = jsonString.trim();
    if (!trimmed) {
      throw new Error("IDL JSON is empty");
    }

    const parsed = JSON.parse(trimmed);

    if (!validateIDL(parsed)) {
      const obj = parsed as Record<string, unknown>;
      const missing: string[] = [];

      const version =
        obj.version ||
        (obj.metadata &&
          typeof obj.metadata === "object" &&
          (obj.metadata as Record<string, unknown>).version);
      const name =
        obj.name ||
        (obj.metadata &&
          typeof obj.metadata === "object" &&
          (obj.metadata as Record<string, unknown>).name);

      if (typeof version !== "string") {
        missing.push("version");
      }
      if (typeof name !== "string") {
        missing.push("name");
      }

      throw new Error(
        missing.length > 0
          ? `Invalid IDL structure: missing required fields (${missing.join(
              ", "
            )})`
          : "Invalid IDL structure: must be a valid Anchor IDL"
      );
    }

    // Warn if types array is missing (not required by IDL spec, but needed for Anchor)
    const idl = parsed as Idl;
    if (!idl.types || idl.types.length === 0) {
      console.warn(
        "⚠️ IDL Warning: No 'types' array found. " +
          "If your program uses custom types (enums, structs), they should be defined in the 'types' array. " +
          "This may cause 'Type not found' errors when executing instructions."
      );
    }

    return idl;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unknown error parsing IDL");
  }
}

export function getInstructionCount(idl: Idl): number {
  return idl.instructions?.length || 0;
}

export function getAccountCount(idl: Idl): number {
  return idl.accounts?.length || 0;
}
