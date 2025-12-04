import { Idl } from "@coral-xyz/anchor";

export function validateIdlTypes(idl: Idl): {
  isValid: boolean;
  missingTypes: string[];
  warnings: string[];
} {
  const missingTypes: string[] = [];
  const warnings: string[] = [];

  const definedTypes = new Set<string>();
  if (idl.types && Array.isArray(idl.types)) {
    idl.types.forEach((type) => {
      if (type.name) {
        definedTypes.add(type.name);
      }
    });
  } else {
    warnings.push("IDL has no 'types' array defined");
  }

  if (idl.instructions && Array.isArray(idl.instructions)) {
    idl.instructions.forEach((instruction) => {
      if (instruction.args && Array.isArray(instruction.args)) {
        instruction.args.forEach((arg) => {
          const missing = findMissingTypes(arg.type, definedTypes);
          missingTypes.push(...missing);
        });
      }

      if (instruction.accounts && Array.isArray(instruction.accounts)) {
        instruction.accounts.forEach((account) => {
          if (typeof account === "object" && "type" in account) {
            const missing = findMissingTypes(
              (account as { type: unknown }).type,
              definedTypes
            );
            missingTypes.push(...missing);
          }
        });
      }
    });
  }

  const uniqueMissingTypes = Array.from(new Set(missingTypes));

  return {
    isValid: uniqueMissingTypes.length === 0,
    missingTypes: uniqueMissingTypes,
    warnings,
  };
}

function findMissingTypes(
  type: unknown,
  definedTypes: Set<string>,
  missing: string[] = []
): string[] {
  if (typeof type === "string") {
    return missing;
  }

  if (typeof type === "object" && type !== null) {
    const typeObj = type as Record<string, unknown>;

    if (typeObj.defined && typeof typeObj.defined === "string") {
      const typeName = typeObj.defined;
      if (!definedTypes.has(typeName)) {
        missing.push(typeName);
      }
    }

    if (typeObj.option) {
      findMissingTypes(typeObj.option, definedTypes, missing);
    }

    if (typeObj.vec) {
      findMissingTypes(typeObj.vec, definedTypes, missing);
    }

    if (typeObj.array) {
      const arrayDef = typeObj.array as unknown[];
      if (arrayDef.length > 0) {
        findMissingTypes(arrayDef[0], definedTypes, missing);
      }
    }

    if (typeObj.fields && Array.isArray(typeObj.fields)) {
      typeObj.fields.forEach((field: unknown) => {
        if (typeof field === "object" && field !== null && "type" in field) {
          findMissingTypes(
            (field as { type?: unknown }).type,
            definedTypes,
            missing
          );
        }
      });
    }

    if (typeObj.variants && Array.isArray(typeObj.variants)) {
      typeObj.variants.forEach((variant: unknown) => {
        if (
          typeof variant === "object" &&
          variant !== null &&
          "fields" in variant
        ) {
          const variantObj = variant as { fields?: unknown[] };
          if (variantObj.fields && Array.isArray(variantObj.fields)) {
            variantObj.fields.forEach((field: unknown) => {
              if (
                typeof field === "object" &&
                field !== null &&
                "type" in field
              ) {
                findMissingTypes(
                  (field as { type?: unknown }).type,
                  definedTypes,
                  missing
                );
              }
            });
          }
        }
      });
    }
  }

  return missing;
}
