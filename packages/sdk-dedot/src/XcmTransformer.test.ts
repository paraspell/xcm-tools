import { NumberFormatError } from "@paraspell/sdk-core";
import { decodeAddress, isEvmAddress } from "dedot/utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { checkAndConvertToNumberOrBigInt, transform } from "./XcmTransformer";

vi.mock("dedot/utils");

describe("XcmTransformer", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(decodeAddress).mockImplementation(() => {
      throw new Error("Invalid address");
    });
    vi.mocked(isEvmAddress).mockReturnValue(false);
  });

  describe("checkAndConvertToNumberOrBigInt", () => {
    it.each([
      ["0", 0],
      [String(Number.MIN_SAFE_INTEGER), Number.MIN_SAFE_INTEGER],
      [String(Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER],
      ["9007199254740992", 9007199254740992n],
      ["-9007199254740992", -9007199254740992n],
    ])("converts %s without losing precision", (input, expected) => {
      expect(checkAndConvertToNumberOrBigInt(input)).toBe(expected);
    });

    it("rejects values that are not integer strings", () => {
      expect(() => checkAndConvertToNumberOrBigInt("1.5")).toThrow(
        NumberFormatError,
      );
    });
  });

  describe("transform", () => {
    it("recursively transforms arrays and preserves primitives", () => {
      expect(transform([{ Fungible: 10 }, null, true])).toEqual([
        { type: "Fungible", value: 10 },
        null,
        true,
      ]);
    });

    it("preserves an items collection", () => {
      const items = [{ raw: true }];
      expect(transform({ items })).toEqual({ items });
    });

    it.each([
      [
        { AccountId32: { network: null, id: "0x01" } },
        {
          type: "AccountId32",
          value: { network: undefined, id: "0x01" },
        },
      ],
      [
        { AccountId32: { network: "polkadot", id: "0x02" } },
        {
          type: "AccountId32",
          value: { network: undefined, id: "0x02" },
        },
      ],
      [{ Id: "Alice" }, { type: "Id", value: "Alice" }],
      [{ Substrate: "Polkadot" }, { type: "Substrate", value: "Polkadot" }],
      [{ OtherReserve: "12" }, { type: "OtherReserve", value: 12 }],
      [
        { GlobalConsensus: { polkadot: null } },
        { type: "GlobalConsensus", value: { type: "Polkadot" } },
      ],
      [
        { GlobalConsensus: { kusama: null } },
        { type: "GlobalConsensus", value: { type: "Kusama" } },
      ],
      [{ PalletInstance: 50 }, { type: "PalletInstance", value: 50 }],
      [{ GeneralIndex: "123" }, { type: "GeneralIndex", value: 123n }],
      [
        { Ethereum: { chainId: 1 } },
        { type: "Ethereum", value: { chainId: 1 } },
      ],
      [
        { AccountKey20: { network: null, key: "0x01" } },
        {
          type: "AccountKey20",
          value: { network: undefined, key: "0x01" },
        },
      ],
      [
        { AccountKey20: { network: "ethereum", key: "0x02" } },
        {
          type: "AccountKey20",
          value: { network: undefined, key: "0x02" },
        },
      ],
      [
        { SetFeesMode: { jit_withdraw: true } },
        { type: "SetFeesMode", value: { jitWithdraw: true } },
      ],
      [
        { SetFeesMode: {} },
        { type: "SetFeesMode", value: { jitWithdraw: false } },
      ],
      [
        { PayFees: { asset: { Fungible: 5 } } },
        {
          type: "PayFees",
          value: { asset: { type: "Fungible", value: 5 } },
        },
      ],
      [
        { X1: [{ Parachain: 2000 }] },
        {
          type: "X1",
          value: [{ type: "Parachain", value: 2000 }],
        },
      ],
      [{ Fungible: 100 }, { type: "Fungible", value: 100 }],
      [
        { NetworkId: "Polkadot" },
        { type: "NetworkId", value: { type: "Polkadot" } },
      ],
      [{ Parachain: 1000 }, { type: "Parachain", value: 1000 }],
      [{ Blob: "0x1234" }, { type: "Blob", value: "0x1234" }],
      [
        { Wrapper: { Fungible: 7 } },
        {
          type: "Wrapper",
          value: { type: "Fungible", value: 7 },
        },
      ],
      [{ items: "Ready" }, { type: "items", value: { type: "Ready" } }],
      [{ X1: "Here" }, { type: "X1", value: { type: "Here" } }],
    ])("transforms a single-key variant %#", (input, expected) => {
      expect(transform(input)).toEqual(expected);
    });

    it("transforms fields in a multi-key object", () => {
      const call = { untouched: "call" };

      expect(
        transform({
          call,
          fee_item: "2",
          amount: "123",
          dest_weight: null,
          fun: "Fungible",
          origin_kind: "SovereignAccount",
          hex_value: "0x1234",
          enum_value: "Complete",
          nested_value: { Parachain: 2000 },
        }),
      ).toEqual({
        call,
        feeItem: 2,
        amount: 123n,
        destWeight: undefined,
        fun: "Fungible",
        originKind: "SovereignAccount",
        hexValue: "0x1234",
        enumValue: { type: "Complete" },
        nestedValue: { type: "Parachain", value: 2000 },
      });
    });

    it("keeps valid Substrate and EVM addresses as strings", () => {
      vi.mocked(decodeAddress)
        .mockReturnValueOnce(new Uint8Array([1]))
        .mockImplementation(() => {
          throw new Error("Not a Substrate address");
        });
      vi.mocked(isEvmAddress).mockReturnValue(true);

      expect(
        transform({
          substrate_address: "5Valid",
          evm_address: "0x0000000000000000000000000000000000000001",
        }),
      ).toEqual({
        substrateAddress: "5Valid",
        evmAddress: "0x0000000000000000000000000000000000000001",
      });
    });

    it("falls back to enum variants for invalid numeric strings", () => {
      expect(
        transform({
          amount: "not-a-number",
          currency_id: "not-a-number",
        }),
      ).toEqual({
        amount: { type: "not-a-number" },
        currencyId: { type: "not-a-number" },
      });
    });

    it("accepts numeric currency IDs", () => {
      vi.mocked(decodeAddress).mockReturnValue(new Uint8Array([1]));

      expect(transform({ currency_id: "42", other: true })).toEqual({
        currencyId: "42",
        other: true,
      });
    });
  });
});
