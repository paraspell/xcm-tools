import type { TypeId, TypeRegistry } from "dedot/codecs";
import type { Shape } from "dedot/shape";
import { stringPascalCase } from "dedot/utils";

import { TypeNotFoundError } from "../errors";

/**
 * Code snippet provided by the Dedot team.
 * Finds a codec by name and returns its shape,
 * which can then be used to encode data into hex.
 *
 * https://gist.github.com/sinzii/3e01e0c0716f879190f2a10ab7d23315
 */

const PATH_RM_INDEX_1 = ["generic", "misc", "pallet", "traits", "types"];

const cleanPath = (path: string[]): string => {
  return path
    .map((one) => stringPascalCase(one))
    .filter(
      (one, idx, currentPath) => idx === 0 || one !== currentPath[idx - 1],
    )
    .join("");
};

const buildTypeNameIndex = (registry: TypeRegistry): Map<string, TypeId> => {
  const index = new Map<string, TypeId>();

  for (const typeId of Object.keys(registry.types)) {
    const { path } = registry.types[typeId as unknown as TypeId];
    if (path.length === 0) continue;

    const fullPath = path.join("::");
    if (!index.has(fullPath)) {
      index.set(fullPath, Number(typeId));
    }

    const shortName = path[path.length - 1];
    if (!index.has(shortName)) {
      index.set(shortName, Number(typeId));
    }

    // Generated type name (same logic as codegen's BaseTypesGen)
    let generatedName: string;
    if (path.length > 1 && PATH_RM_INDEX_1.includes(path[1])) {
      const newPath = path.slice();
      newPath.splice(1, 1);
      generatedName = cleanPath(newPath);
    } else {
      generatedName = cleanPath(path);
    }
    if (!index.has(generatedName)) {
      index.set(generatedName, Number(typeId));
    }
  }

  return index;
};

export const findCodecByType = <I = unknown, O = I>(
  registry: TypeRegistry,
  name: string,
): Shape<I, O> => {
  const index = buildTypeNameIndex(registry);
  const typeId = index.get(name);

  if (typeId === undefined) {
    throw new TypeNotFoundError(name);
  }

  return registry.findCodec<I, O>(typeId);
};
