import type { TSubstrateChain } from "@paraspell/sdk-core";
import { getNativeAssetSymbol } from "@paraspell/sdk-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { computeOriginFee } from "./computeOriginFee";
import { getLocationTokenId } from "./getLocationTokenId";

vi.mock("@paraspell/sdk-core");

vi.mock("./getLocationTokenId");

describe("computeOriginFee", () => {
  const mockChain = {} as TSubstrateChain;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should compute the total fee from delivery fees and execution fee", () => {
    const dryRun = {
      value: {
        emittedEvents: [
          {
            pallet: "XcmPallet",
            palletEvent: {
              name: "FeesPaid",
              data: {
                fees: [
                  { fun: { type: "Fungible", value: 500n }, id: "tokenId1" },
                  { fun: { type: "Fungible", value: 300n }, id: "tokenId2" },
                ],
              },
            },
          },
        ],
      },
    };

    vi.mocked(getNativeAssetSymbol).mockReturnValue("nativeSymbol");
    vi.mocked(getLocationTokenId).mockImplementation((id: string) =>
      id === "tokenId1" ? "nativeSymbol" : null,
    );

    const executionFee = 200n;
    const result = computeOriginFee(dryRun, mockChain, executionFee);

    expect(result).toBe(700n); // 500 (delivery fee)
    expect(getNativeAssetSymbol).toHaveBeenCalledWith(mockChain);
    expect(getLocationTokenId).toHaveBeenCalledTimes(2);
  });

  it("should return only the execution fee if there are no matching delivery fees", () => {
    const dryRun = {
      value: {
        emittedEvents: [
          {
            pallet: "PolkadotXcm",
            palletEvent: {
              name: "FeesPaid",
              data: {
                fees: [
                  { fun: { type: "Fungible", value: 500n }, id: "tokenId1" },
                ],
              },
            },
          },
        ],
      },
    };

    vi.mocked(getNativeAssetSymbol).mockReturnValue("nativeSymbol");
    vi.mocked(getLocationTokenId).mockReturnValue(null);

    const executionFee = 200n;
    const result = computeOriginFee(dryRun, mockChain, executionFee);

    expect(result).toBe(200n);
    expect(getLocationTokenId).toHaveBeenCalledWith("tokenId1", mockChain);
  });

  it("should exclude NonFungible fees from the total delivery fee", () => {
    const dryRun = {
      value: {
        emittedEvents: [
          {
            pallet: "CumulusXcm",
            palletEvent: {
              name: "FeesPaid",
              data: {
                fees: [
                  { fun: { type: "NonFungible", value: 500n }, id: "tokenId1" },
                  { fun: { type: "Fungible", value: 300n }, id: "tokenId2" },
                ],
              },
            },
          },
        ],
      },
    };

    vi.mocked(getNativeAssetSymbol).mockReturnValue("nativeSymbol");
    vi.mocked(getLocationTokenId).mockImplementation((id: string) =>
      id === "tokenId2" ? "nativeSymbol" : null,
    );

    const executionFee = 200n;
    const result = computeOriginFee(dryRun, mockChain, executionFee);

    expect(result).toBe(500n); // 300 (delivery fee)
  });

  it("should return 0 if no matching events are found", () => {
    const dryRun = {
      value: {
        emittedEvents: [
          {
            pallet: "OtherEvent",
            palletEvent: { name: "SomethingElse", data: {} },
          },
        ],
      },
    };

    vi.mocked(getNativeAssetSymbol).mockReturnValue("nativeSymbol");

    const executionFee = 0n;
    const result = computeOriginFee(dryRun, mockChain, executionFee);

    expect(result).toBe(0n);
    expect(getNativeAssetSymbol).toHaveBeenCalledWith(mockChain);
    expect(getLocationTokenId).not.toHaveBeenCalled();
  });

  it("should return only execution fee if no delivery fees are found", () => {
    const dryRun = {
      value: {
        emittedEvents: [],
      },
    };

    vi.mocked(getNativeAssetSymbol).mockReturnValue("nativeSymbol");

    const executionFee = 300n;
    const result = computeOriginFee(dryRun, mockChain, executionFee);

    expect(result).toBe(300n);
  });

  it("should return assetConversionFee if isFeeAsset is true and assetConversionFee is > 0, skipping final delivery fee calculation", () => {
    const dryRun = {
      value: {
        emittedEvents: [
          {
            pallet: "AssetConversion",
            palletEvent: {
              name: "SwapCreditExecuted",
              data: {},
            },
            type: "AssetConversion",
            value: {
              type: "SwapCreditExecuted",
              value: {
                amount_in: 1000n,
                amount_out: 900n,
                asset_in: "assetA",
                asset_out: "assetB",
                who: "someAccount",
              },
            },
          },
          {
            pallet: "XcmPallet",
            palletEvent: {
              name: "FeesPaid",
              data: {
                fees: [
                  { fun: { type: "Fungible", value: 50n }, id: "tokenId1" },
                ],
              },
            },
          },
        ],
      },
    };

    const executionFee = 200n;
    const isFeeAsset = true;

    vi.mocked(getLocationTokenId).mockReturnValue("someRelevantSymbolOrNull");

    const result = computeOriginFee(
      dryRun,
      mockChain,
      executionFee,
      isFeeAsset,
    );

    expect(result).toBe(1000n);

    expect(getNativeAssetSymbol).not.toHaveBeenCalled();
    expect(getLocationTokenId).toHaveBeenCalledWith("tokenId1", mockChain);
  });

  it("should sum multiple AssetConversion fees if isFeeAsset is true", () => {
    const dryRun = {
      value: {
        emittedEvents: [
          {
            pallet: "AssetConversion",
            palletEvent: {
              name: "SwapCreditExecuted",
              data: {},
            },
            type: "AssetConversion",
            value: {
              type: "SwapCreditExecuted",
              value: { amount_in: 1000n },
            },
          },
          {
            pallet: "AssetConversion",
            palletEvent: {
              name: "SwapCreditExecuted",
              data: {},
            },
            type: "AssetConversion",
            value: {
              type: "SwapCreditExecuted",
              value: { amount_in: 500n },
            },
          },
          {
            pallet: "AssetConversion",
            palletEvent: {
              name: "SwapCreditExecuted",
              data: {},
            },
            type: "AssetConversion",
            value: {
              type: "SwapCreditExecuted",
              value: { amount_in: undefined },
            },
          },
          {
            pallet: "AssetConversion",
            palletEvent: {
              name: "SwapCreditExecuted",
              data: {},
            },
            type: "AssetConversion",
            value: {
              type: "SwapCreditExecuted",
              value: { amount_in: null },
            },
          },
        ],
      },
    };

    const executionFee = 200n;
    const isFeeAsset = true;

    const result = computeOriginFee(
      dryRun,
      mockChain,
      executionFee,
      isFeeAsset,
    );

    expect(result).toBe(1500n);
    expect(getNativeAssetSymbol).not.toHaveBeenCalled();
    expect(getLocationTokenId).not.toHaveBeenCalled();
  });

  it("should use delivery and execution fees if isFeeAsset is true but no valid AssetConversion fee is found", () => {
    const dryRun = {
      value: {
        emittedEvents: [
          {
            pallet: "AssetConversion",
            palletEvent: {
              name: "SomeOtherAssetConversionEvent",
              data: {},
            },
            type: "AssetConversion",
            value: {
              type: "SomeOtherAssetConversionEvent",
              value: {
                amount_in: 1000n,
              },
            },
          },
          {
            pallet: "AssetConversion",
            palletEvent: {
              name: "SwapCreditExecuted",
              data: {},
            },
            type: "AssetConversion",
            value: {
              type: "SwapCreditExecuted",
              value: {
                amount_out: 900n,
              },
            },
          },
          {
            pallet: "XcmPallet",
            palletEvent: {
              name: "FeesPaid",
              data: {
                fees: [
                  { fun: { type: "Fungible", value: 500n }, id: "tokenId1" },
                ],
              },
            },
          },
        ],
      },
    };

    vi.mocked(getNativeAssetSymbol).mockReturnValue("nativeSymbol");
    vi.mocked(getLocationTokenId).mockImplementation((id: string) =>
      id === "tokenId1" ? "nativeSymbol" : null,
    );

    const executionFee = 200n;
    const isFeeAsset = true;

    const result = computeOriginFee(
      dryRun,
      mockChain,
      executionFee,
      isFeeAsset,
    );

    expect(result).toBe(700n);
    expect(getNativeAssetSymbol).toHaveBeenCalledWith(mockChain);
    expect(getLocationTokenId).toHaveBeenCalledWith("tokenId1", mockChain);
  });

  it("should ignore AssetConversion events and use delivery/execution fees if isFeeAsset is false", () => {
    const dryRun = {
      value: {
        emittedEvents: [
          {
            pallet: "AssetConversion",
            palletEvent: {
              name: "SwapCreditExecuted",
              data: {},
            },
            type: "AssetConversion",
            value: {
              type: "SwapCreditExecuted",
              value: {
                amount_in: 1000n,
                amount_out: 900n,
              },
            },
          },
          {
            pallet: "XcmPallet",
            palletEvent: {
              name: "FeesPaid",
              data: {
                fees: [
                  { fun: { type: "Fungible", value: 500n }, id: "tokenId1" },
                ],
              },
            },
          },
        ],
      },
    };

    vi.mocked(getNativeAssetSymbol).mockReturnValue("nativeSymbol");
    vi.mocked(getLocationTokenId).mockImplementation((id: string) =>
      id === "tokenId1" ? "nativeSymbol" : null,
    );

    const executionFee = 200n;
    const isFeeAsset = false;

    const result = computeOriginFee(
      dryRun,
      mockChain,
      executionFee,
      isFeeAsset,
    );

    expect(result).toBe(700n);
    expect(getNativeAssetSymbol).toHaveBeenCalledWith(mockChain);
    expect(getLocationTokenId).toHaveBeenCalledWith("tokenId1", mockChain);
  });
});
