/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Field, TypeId, TypeRegistry } from "dedot/codecs";
import { normalizeName, stringPascalCase } from "dedot/utils";

const isUnitVariant = (value: any): value is { type: string } =>
  typeof value === "object" &&
  value !== null &&
  Object.keys(value).length === 1 &&
  typeof value.type === "string";

const flattenFields = (
  registry: TypeRegistry,
  fields: Field[],
  value: any,
): any => {
  if (fields.length === 0) return value;

  // Unnamed fields: a single one is a wrapper, several are a tuple
  if (fields[0].name === undefined) {
    if (fields.length === 1) {
      return flattenFieldlessEnums(registry, fields[0].typeId, value);
    }
    return Array.isArray(value) && value.length === fields.length
      ? fields.map(({ typeId }, i) =>
          flattenFieldlessEnums(registry, typeId, value[i]),
        )
      : value;
  }

  if (typeof value !== "object" || value === null) return value;

  const result = { ...value };
  for (const { name, typeId } of fields) {
    const key = normalizeName(name as string);
    if (key in result) {
      result[key] = flattenFieldlessEnums(registry, typeId, result[key]);
    }
  }
  return result;
};

/**
 * Walks a transformed value alongside its type in the chain metadata and turns
 * `{ type: 'X' }` into `'X'` wherever the type is an enum whose variants all
 * have no fields, because dedot represents such an enum as a plain string.
 */
export const flattenFieldlessEnums = (
  registry: TypeRegistry,
  typeId: TypeId,
  value: any,
): any => {
  const { typeDef, path } = registry.findType(typeId);

  switch (typeDef.type) {
    case "Struct":
      return flattenFields(registry, typeDef.value.fields, value);
    case "Tuple": {
      const { fields } = typeDef.value;
      if (fields.length === 1) {
        return flattenFieldlessEnums(registry, fields[0], value);
      }
      return Array.isArray(value) && value.length === fields.length
        ? fields.map((id, i) => flattenFieldlessEnums(registry, id, value[i]))
        : value;
    }
    case "Sequence":
    case "SizedVec":
      return Array.isArray(value)
        ? value.map((v) =>
            flattenFieldlessEnums(registry, typeDef.value.typeParam, v),
          )
        : value;
    case "Compact":
      return flattenFieldlessEnums(registry, typeDef.value.typeParam, value);
    case "Enum": {
      const { members } = typeDef.value;
      const fullPath = path.join("::");

      if (fullPath === "Option") {
        const some = members.find((m) => m.name === "Some");
        return value === undefined || value === null || !some
          ? value
          : flattenFields(registry, some.fields, value);
      }

      if (members.length > 0 && members.every((m) => m.fields.length === 0)) {
        return isUnitVariant(value) ? value.type : value;
      }

      if (typeof value !== "object" || value === null || !("value" in value)) {
        return value;
      }

      const member = members.find(
        (m) => stringPascalCase(m.name) === value.type,
      );
      return member
        ? {
            ...value,
            value: flattenFields(registry, member.fields, value.value),
          }
        : value;
    }
    default:
      return value;
  }
};
