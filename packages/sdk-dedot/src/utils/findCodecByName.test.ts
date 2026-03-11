import type { TypeRegistry } from "dedot/codecs";
import { describe, expect, it, vi } from "vitest";

import { TypeNotFoundError } from "../errors";
import { findCodecByType } from "./findCodecByName";

const makeRegistry = (types: Record<number, { path: string[] }>) => {
  const findCodec = vi.fn().mockReturnValue("mock-codec");
  const registry = { types, findCodec } as unknown as TypeRegistry;
  return { registry, findCodec };
};

describe("findCodecByType", () => {
  it("finds type by full path", () => {
    const { registry, findCodec } = makeRegistry({
      1: { path: ["sp_core", "crypto", "AccountId32"] },
    });

    const result = findCodecByType(registry, "sp_core::crypto::AccountId32");

    expect(result).toBe("mock-codec");
    expect(findCodec).toHaveBeenCalledWith(1);
  });

  it("finds type by short name (last segment)", () => {
    const { registry, findCodec } = makeRegistry({
      5: { path: ["frame_system", "AccountInfo"] },
    });

    const result = findCodecByType(registry, "AccountInfo");

    expect(result).toBe("mock-codec");
    expect(findCodec).toHaveBeenCalledWith(5);
  });

  it("finds type by generated name (cleaned path)", () => {
    const { registry, findCodec } = makeRegistry({
      10: { path: ["pallet_balances", "types", "AccountData"] },
    });

    // "types" is in PATH_RM_INDEX_1, so index 1 is removed → ["pallet_balances", "AccountData"]
    // cleanPath → "PalletBalancesAccountData"
    const result = findCodecByType(registry, "PalletBalancesAccountData");

    expect(result).toBe("mock-codec");
    expect(findCodec).toHaveBeenCalledWith(10);
  });

  it("uses generated name without splice when path[1] is not in PATH_RM_INDEX_1", () => {
    const { registry, findCodec } = makeRegistry({
      20: { path: ["my_crate", "some_module", "MyType"] },
    });

    // cleanPath → "MyCrateSomeModuleMyType"
    const result = findCodecByType(registry, "MyCrateSomeModuleMyType");

    expect(result).toBe("mock-codec");
    expect(findCodec).toHaveBeenCalledWith(20);
  });

  it("throws TypeNotFoundError when name does not match any type", () => {
    const { registry } = makeRegistry({
      1: { path: ["sp_core", "AccountId32"] },
    });

    expect(() => findCodecByType(registry, "NonExistent")).toThrow(
      TypeNotFoundError,
    );
  });

  it("skips types with empty path", () => {
    const { registry, findCodec } = makeRegistry({
      1: { path: [] },
      2: { path: ["frame", "Call"] },
    });

    // "Call" should resolve to typeId 2, type 1 (empty path) is ignored
    const result = findCodecByType(registry, "Call");

    expect(result).toBe("mock-codec");
    expect(findCodec).toHaveBeenCalledWith(2);
  });

  it("first registered type wins for duplicate short names", () => {
    const { registry, findCodec } = makeRegistry({
      3: { path: ["crate_a", "Foo"] },
      7: { path: ["crate_b", "Foo"] },
    });

    findCodecByType(registry, "Foo");

    expect(findCodec).toHaveBeenCalledWith(3);
  });

  it("deduplicates consecutive identical segments in cleanPath", () => {
    const { registry, findCodec } = makeRegistry({
      42: { path: ["xcm", "xcm", "Junction"] },
    });

    // cleanPath maps → ["Xcm", "Xcm", "Junction"] → dedup consecutive → "XcmJunction"
    const result = findCodecByType(registry, "XcmJunction");

    expect(result).toBe("mock-codec");
    expect(findCodec).toHaveBeenCalledWith(42);
  });
});
