import type { TypeRegistry } from "dedot/codecs";
import { describe, expect, it } from "vitest";

import { flattenFieldlessEnums } from "./flattenFieldlessEnums";

const enumType = (path: string[], members: [string, number[]][]) => ({
  path,
  typeDef: {
    type: "Enum",
    value: {
      members: members.map(([name, fieldTypeIds]) => ({
        name,
        fields: fieldTypeIds.map((typeId) => ({ typeId })),
      })),
    },
  },
});

const types: Record<number, unknown> = {
  // TokenSymbol: every variant is field-less
  1: enumType(
    ["TokenSymbol"],
    [
      ["ACA", []],
      ["DOT", []],
    ],
  ),
  // CurrencyId: Token(TokenSymbol) | ForeignAsset(u16)
  2: enumType(
    ["CurrencyId"],
    [
      ["Token", [1]],
      ["ForeignAsset", [3]],
    ],
  ),
  3: { path: [], typeDef: { type: "Primitive", value: { kind: "u16" } } },
  // AccountId32 wrapper
  4: {
    path: ["AccountId32"],
    typeDef: { type: "Struct", value: { fields: [{ typeId: 3 }] } },
  },
  // (AccountId32, CurrencyId)
  5: { path: [], typeDef: { type: "Tuple", value: { fields: [4, 2] } } },
  6: enumType(
    ["Option"],
    [
      ["None", []],
      ["Some", [2]],
    ],
  ),
  7: {
    path: [],
    typeDef: {
      type: "Struct",
      value: {
        fields: [
          { name: "currency_id", typeId: 2 },
          { name: "amount", typeId: 8 },
        ],
      },
    },
  },
  8: { path: [], typeDef: { type: "Compact", value: { typeParam: 3 } } },
  9: { path: [], typeDef: { type: "Sequence", value: { typeParam: 2 } } },
  // Unlimited | Limited(u16)
  10: enumType(
    ["WeightLimit"],
    [
      ["Unlimited", []],
      ["Limited", [3]],
    ],
  ),
  11: { path: [], typeDef: { type: "Struct", value: { fields: [] } } },
  // Tuple struct (u16, TokenSymbol)
  12: {
    path: [],
    typeDef: {
      type: "Struct",
      value: { fields: [{ typeId: 3 }, { typeId: 1 }] },
    },
  },
  13: { path: [], typeDef: { type: "Tuple", value: { fields: [1] } } },
};

const registry = {
  findType: (typeId: number) => types[typeId],
} as unknown as TypeRegistry;

const token = { type: "Token", value: { type: "DOT" } };
const flatToken = { type: "Token", value: "DOT" };

describe("flattenFieldlessEnums", () => {
  it("turns a field-less enum variant into a plain string", () => {
    expect(flattenFieldlessEnums(registry, 1, { type: "DOT" })).toBe("DOT");
    expect(flattenFieldlessEnums(registry, 2, token)).toEqual(flatToken);
  });

  it("keeps unit variants of enums that have variants with fields", () => {
    expect(flattenFieldlessEnums(registry, 10, { type: "Unlimited" })).toEqual({
      type: "Unlimited",
    });
  });

  it("walks tuples, structs, sequences, options and compacts", () => {
    expect(flattenFieldlessEnums(registry, 5, ["5Address", token])).toEqual([
      "5Address",
      flatToken,
    ]);
    expect(
      flattenFieldlessEnums(registry, 7, { currencyId: token, amount: 1n }),
    ).toEqual({ currencyId: flatToken, amount: 1n });
    expect(flattenFieldlessEnums(registry, 9, [token, token])).toEqual([
      flatToken,
      flatToken,
    ]);
    expect(flattenFieldlessEnums(registry, 6, token)).toEqual(flatToken);
    expect(flattenFieldlessEnums(registry, 6, undefined)).toBeUndefined();
    expect(flattenFieldlessEnums(registry, 8, 5)).toBe(5);
    expect(flattenFieldlessEnums(registry, 12, [5, { type: "DOT" }])).toEqual([
      5,
      "DOT",
    ]);
    expect(flattenFieldlessEnums(registry, 13, { type: "DOT" })).toBe("DOT");
  });

  it("leaves values that do not match the type unchanged", () => {
    const foreignAsset = { type: "ForeignAsset", value: 5 };
    const unknownVariant = { type: "Unknown", value: { type: "DOT" } };

    expect(flattenFieldlessEnums(registry, 2, foreignAsset)).toEqual(
      foreignAsset,
    );
    expect(flattenFieldlessEnums(registry, 2, unknownVariant)).toEqual(
      unknownVariant,
    );
    expect(flattenFieldlessEnums(registry, 1, "DOT")).toBe("DOT");
    expect(flattenFieldlessEnums(registry, 5, "not a tuple")).toBe(
      "not a tuple",
    );
    expect(flattenFieldlessEnums(registry, 12, "not a tuple")).toBe(
      "not a tuple",
    );
    expect(flattenFieldlessEnums(registry, 9, "not a sequence")).toBe(
      "not a sequence",
    );
    expect(flattenFieldlessEnums(registry, 7, "not a struct")).toBe(
      "not a struct",
    );
    expect(flattenFieldlessEnums(registry, 7, { amount: 1n })).toEqual({
      amount: 1n,
    });
    expect(flattenFieldlessEnums(registry, 11, { a: 1 })).toEqual({ a: 1 });
  });
});
