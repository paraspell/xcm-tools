import type {
  TAssetInfo,
  TChain,
  TDryRunCallBaseOptions,
  TDryRunXcmBaseOptions,
  TSerializedExtrinsics,
  TSerializedStateQuery,
  WithAmount,
} from "@paraspell/sdk-core";
import {
  BatchMode,
  isAssetEqual,
  SubmitTransactionError,
  isSenderSigner,
  localizeLocation,
  RuntimeApiUnavailableError,
  type TLocation,
  type TSubstrateChain,
  Version,
  wrapTxBypass,
} from "@paraspell/sdk-core";
import type { Mock } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import DedotApi from "./DedotApi";
import type { TDedotApi, TDedotExtrinsic, TDedotSigner } from "./types";
import { computeOriginFee } from "./utils/computeOriginFee";
import { transform } from "./XcmTransformer";

vi.mock("dedot", () => ({
  DedotClient: {
    new: vi.fn().mockResolvedValue({}),
  },
  WsProvider: vi.fn(),
}));

vi.mock("dedot/utils", () => ({
  blake2AsHex: vi.fn().mockReturnValue("0xabcdef"),
  decodeAddress: vi.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
  hexToU8a: vi
    .fn()
    .mockImplementation(
      (hex: string) =>
        new Uint8Array(
          (hex.startsWith("0x") ? hex.slice(2) : hex)
            .match(/.{1,2}/g)
            ?.map((b: string) => parseInt(b, 16)) ?? [],
        ),
    ),
  isHex: vi.fn().mockReturnValue(false),
  stringToU8a: vi
    .fn()
    .mockImplementation((str: string) => new TextEncoder().encode(str)),
  u8aToHex: vi.fn().mockReturnValue("0x010203"),
  isEvmAddress: vi.fn().mockReturnValue(false),
}));

vi.mock("./XcmTransformer", () => ({
  transform: vi.fn().mockReturnValue({ transformed: true }),
}));

vi.mock("./utils", () => ({
  findCodecByType: vi.fn().mockReturnValue({
    tryEncode: vi.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
  }),
}));

vi.mock("./utils/computeOriginFee", () => ({
  computeOriginFee: vi.fn().mockReturnValue(500n),
}));

vi.mock("./utils/signer", () => ({
  createKeyringPair: vi.fn().mockReturnValue({
    address: "5MockAddress",
    publicKey: new Uint8Array(32),
  }),
}));

vi.mock("@paraspell/sdk-core", async (importOriginal) => ({
  ...(await importOriginal()),
  addXcmVersionHeader: vi.fn(),
  wrapTxBypass: vi.fn(),
  localizeLocation: vi.fn(),
  isAssetEqual: vi.fn(),
  isSenderSigner: vi.fn().mockReturnValue(false),
  resolveModuleError: vi
    .fn()
    .mockImplementation(
      (
        _chain: string,
        err: { type?: string; value?: { error?: { type?: string } } },
      ) => ({
        reason: err?.type ?? "Unknown",
        subReason: err?.value?.error?.type,
      }),
    ),
}));

const createMockApi = (mockTx: TDedotExtrinsic) => ({
  tx: {
    utility: {
      batch: vi.fn().mockReturnValue(mockTx),
      batchAll: vi.fn().mockReturnValue(mockTx),
      dispatchAs: vi.fn().mockReturnValue(mockTx),
    },
    xcmPallet: {
      methodName: vi.fn().mockReturnValue(mockTx),
    },
    polkadotXcm: {
      transferAssets: vi.fn(),
    },
  },
  query: {
    evm: {
      accountStorages: vi.fn().mockResolvedValue("0xstorage"),
    },
    multiTransactionPayment: {
      accountCurrencyMap: vi.fn(),
    },
    ethereumOutboundQueue: {
      operatingMode: vi.fn().mockResolvedValue("Normal"),
    },
    system: {
      account: vi.fn(),
    },
  },
  call: {
    dryRunApi: {
      dryRunCall: vi.fn(),
      dryRunXcm: vi.fn(),
    },
    xcmPaymentApi: {
      queryXcmWeight: vi.fn().mockResolvedValue({
        value: { refTime: 100n, proofSize: 200n },
      }),
      queryWeightToAssetFee: vi.fn().mockResolvedValue({ value: 100n }),
      queryDeliveryFees: vi.fn().mockResolvedValue({
        value: { value: [{ fun: { value: 7n } }] },
      }),
    },
    assetConversionApi: {
      quotePriceExactTokensForTokens: vi.fn().mockResolvedValue(42n),
    },
  },
  registry: {},
  metadata: {
    latest: {
      pallets: [] as Array<{
        name: string;
        index: number;
        calls?: unknown;
      }>,
      types: [] as Array<{ path?: string[] }>,
    },
  },
  consts: {},
  rpc: {
    system_chain: vi.fn(),
    system_properties: vi.fn(),
  },
  toTx: vi.fn().mockReturnValue(mockTx),
  disconnect: vi.fn(),
});

type MockApi = ReturnType<typeof createMockApi>;

describe("DedotApi", () => {
  let dedotApi: DedotApi;
  let mockApi: TDedotApi;
  let mockApiRaw: MockApi;
  let mockTx: TDedotExtrinsic;
  const mockChain = "Acala";

  beforeEach(async () => {
    vi.clearAllMocks();

    mockTx = {
      call: {
        palletCall: {
          name: "transferAssetsUsingTypeAndThen",
          params: {
            assets: { value: [{}, {}] },
          },
        },
      },
      paymentInfo: vi.fn().mockResolvedValue({
        partialFee: 1000n,
        weight: { refTime: 10n, proofSize: 20n },
      }),
      signAndSend: vi.fn().mockResolvedValue("0xtxhash"),
    } as unknown as TDedotExtrinsic;

    mockApiRaw = createMockApi(mockTx);
    mockApi = mockApiRaw as unknown as TDedotApi;

    dedotApi = new DedotApi();
    vi.spyOn(dedotApi, "leaseClient").mockResolvedValue(mockApi);
    await dedotApi.init(mockChain);

    vi.spyOn(dedotApi, "hasXcmPaymentApiSupport").mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return DEDOT api type", () => {
    expect(dedotApi.type).toBe("DEDOT");
  });

  describe("accountToHex", () => {
    it("returns hex with 0x prefix by default", () => {
      const result = dedotApi.accountToHex("someAddress");
      expect(result).toBe("0x010203");
    });

    it("returns hex without prefix when isPrefixed=false", () => {
      const result = dedotApi.accountToHex("someAddress", false);
      expect(result).toBe("010203");
    });

    it("returns the address as-is if it's already hex", async () => {
      const { isHex } = await import("dedot/utils");
      vi.mocked(isHex).mockReturnValueOnce(true);
      const result = dedotApi.accountToHex("0xabcdef");
      expect(result).toBe("0xabcdef");
    });
  });

  describe("accountToUint8a", () => {
    it("returns decoded Uint8Array", () => {
      const result = dedotApi.accountToUint8a("someAddress");
      expect(result).toEqual(new Uint8Array([1, 2, 3]));
    });
  });

  describe("deserializeExtrinsics", () => {
    it("creates a transaction with converted module/method", () => {
      vi.mocked(transform).mockReturnValue({ val: "transformed" });

      const serialized: TSerializedExtrinsics = {
        module: "XcmPallet",
        method: "method_name",
        params: { key: "value" },
      };

      const result = dedotApi.deserializeExtrinsics(serialized);

      expect(transform).toHaveBeenCalledWith({ key: "value" });
      expect(mockApiRaw.tx.xcmPallet.methodName).toHaveBeenCalled();
      expect(result).toBe(mockTx);
    });
  });

  describe("txFromHex", () => {
    it("converts a hex string to a transaction", async () => {
      const result = await dedotApi.txFromHex("0xdeadbeef");
      expect(mockApiRaw.toTx).toHaveBeenCalledWith("0xdeadbeef");
      expect(result).toBe(mockTx);
    });
  });

  describe("txToHex", () => {
    it("returns the callHex of the transaction", async () => {
      const tx = { callHex: "0xcafebabe" } as unknown as TDedotExtrinsic;
      const result = await dedotApi.txToHex(tx);
      expect(result).toBe("0xcafebabe");
    });
  });

  describe("queryState", () => {
    it("queries state with single param", async () => {
      const serialized: TSerializedStateQuery = {
        module: "System",
        method: "account",
        params: ["addr"],
      };

      mockApiRaw.query.system.account.mockResolvedValue({ data: "result" });

      const result = await dedotApi.queryState(serialized);
      expect(mockApiRaw.query.system.account).toHaveBeenCalledWith("addr");
      expect(result).toEqual({ data: "result" });
    });

    it("queries state with multiple params as array", async () => {
      const serialized: TSerializedStateQuery = {
        module: "System",
        method: "account",
        params: ["addr", "extra"],
      };

      mockApiRaw.query.system.account.mockResolvedValue({ data: "result" });

      const result = await dedotApi.queryState(serialized);
      expect(mockApiRaw.query.system.account).toHaveBeenCalledWith([
        { val: "transformed" },
        { val: "transformed" },
      ]);
      expect(result).toEqual({ data: "result" });
    });
  });

  describe("queryRuntimeApi", () => {
    it("calls the runtime api with params spread", async () => {
      const serialized: TSerializedStateQuery = {
        module: "Balances",
        method: "query_xcm_weight",
        params: ["xcm"],
      };

      const mockCallMethod = vi.fn().mockResolvedValue({ weight: 100n });
      Object.assign(mockApiRaw.call, {
        balances: { queryXcmWeight: mockCallMethod },
      });

      const result = await dedotApi.queryRuntimeApi(serialized);
      expect(mockCallMethod).toHaveBeenCalledWith({ val: "transformed" });
      expect(result).toEqual({ weight: 100n });
    });
  });

  describe("callBatchMethod", () => {
    it("calls batchAll for BATCH_ALL mode", () => {
      const calls = [mockTx, mockTx];
      dedotApi.callBatchMethod(calls, BatchMode.BATCH_ALL);
      expect(mockApiRaw.tx.utility.batchAll).toHaveBeenCalled();
      expect(mockApiRaw.tx.utility.batch).not.toHaveBeenCalled();
    });

    it("calls batch for BATCH mode", () => {
      const calls = [mockTx, mockTx];
      dedotApi.callBatchMethod(calls, BatchMode.BATCH);
      expect(mockApiRaw.tx.utility.batch).toHaveBeenCalled();
      expect(mockApiRaw.tx.utility.batchAll).not.toHaveBeenCalled();
    });
  });

  describe("callDispatchAsMethod", () => {
    it("creates a dispatchAs call", () => {
      const result = dedotApi.callDispatchAsMethod(mockTx, "someAddress");
      expect(mockApiRaw.tx.utility.dispatchAs).toHaveBeenCalledWith(
        {
          type: "System",
          value: { type: "Signed", value: "someAddress" },
        },
        mockTx.call,
      );
      expect(result).toBe(mockTx);
    });
  });

  describe("objectToHex", () => {
    it("encodes object to hex using the registry codec", async () => {
      const result = await dedotApi.objectToHex(
        { some: "xcm" },
        "XcmVersionedXcm",
      );

      expect(transform).toHaveBeenCalledWith({ some: "xcm" });
      expect(result).toBe("0x010203");
    });
  });

  describe("hexToUint8a / stringToUint8a", () => {
    it("converts hex to Uint8Array", () => {
      const result = dedotApi.hexToUint8a("0xff");
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it("converts string to Uint8Array", () => {
      const result = dedotApi.stringToUint8a("hello");
      expect(result).toBeInstanceOf(Uint8Array);
    });
  });

  describe("getPaymentInfo", () => {
    it("returns payment info from the transaction", async () => {
      const info = await dedotApi.getPaymentInfo(mockTx, "someAddress");
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(vi.mocked(mockTx.paymentInfo)).toHaveBeenCalledWith("someAddress");
      expect(info).toEqual({
        partialFee: 1000n,
        weight: { refTime: 10n, proofSize: 20n },
      });
    });
  });

  describe("getEvmStorage", () => {
    it("returns storage value", async () => {
      const result = await dedotApi.getEvmStorage("contract", "slot");
      expect(mockApiRaw.query.evm.accountStorages).toHaveBeenCalledWith(
        "contract",
        "slot",
      );
      expect(result).toBe("0xstorage");
    });
  });

  describe("getMethod", () => {
    it("returns the method name lowercased", () => {
      const result = dedotApi.getMethod(mockTx);
      expect(result).toBe("transferAssetsUsingTypeAndThen");
    });
  });

  describe("getTypeThenAssetCount", () => {
    it("returns asset count for transferAssetsUsingTypeAndThen", () => {
      const result = dedotApi.getTypeThenAssetCount(mockTx);
      expect(result).toBe(2);
    });

    it("returns undefined for other methods", () => {
      const otherTx = {
        call: {
          palletCall: {
            name: "OtherMethod",
            params: {},
          },
        },
      } as unknown as TDedotExtrinsic;
      const result = dedotApi.getTypeThenAssetCount(otherTx);
      expect(result).toBeUndefined();
    });
  });

  describe("hasMethod", () => {
    it("returns true when the method exists", async () => {
      const result = await dedotApi.hasMethod("PolkadotXcm", "transfer_assets");
      expect(result).toBe(true);
    });

    it("returns false when the pallet does not exist", async () => {
      const result = await dedotApi.hasMethod("AssetConversion", "some_method");
      expect(result).toBe(false);
    });
  });

  describe("blake2AsHex", () => {
    it("returns a blake2 hash hex", () => {
      const result = dedotApi.blake2AsHex(new Uint8Array([1, 2, 3]));
      expect(result).toBe("0xabcdef");
    });
  });

  describe("clone", () => {
    it("returns a new DedotApi instance", () => {
      const cloned = dedotApi.clone();
      expect(cloned).toBeInstanceOf(DedotApi);
      expect(cloned).not.toBe(dedotApi);
    });
  });

  describe("validateSubstrateAddress", () => {
    it("returns true for a valid address", () => {
      expect(dedotApi.validateSubstrateAddress("5Valid")).toBe(true);
    });

    it("returns false for an invalid address", async () => {
      const { decodeAddress } = await import("dedot/utils");
      vi.mocked(decodeAddress).mockImplementationOnce(() => {
        throw new Error("Invalid");
      });
      expect(dedotApi.validateSubstrateAddress("bad")).toBe(false);
    });
  });

  describe("deriveAddress", () => {
    it("returns the signer address for signer-type sender", async () => {
      const { isSenderSigner } = await import("@paraspell/sdk-core");
      vi.mocked(isSenderSigner).mockReturnValueOnce(true);

      const sender = {
        address: "5SignerAddr",
      } as unknown as TDedotSigner;
      const result = dedotApi.deriveAddress(sender);
      expect(result).toBe("5SignerAddr");
    });

    it("returns address from keyring pair for string sender", () => {
      const result = dedotApi.deriveAddress("//Alice");
      expect(result).toBe("5MockAddress");
    });
  });

  describe("getBridgeStatus", () => {
    it("returns the operating mode", async () => {
      const result = await dedotApi.getBridgeStatus();
      expect(
        mockApiRaw.query.ethereumOutboundQueue.operatingMode,
      ).toHaveBeenCalled();
      expect(result).toBe("Normal");
    });
  });

  describe("resolveFeeAsset", () => {
    const createOptions = (): TDryRunCallBaseOptions<TDedotExtrinsic> => ({
      tx: mockTx,
      address: "addr",
      chain: "Hydration",
      version: Version.V5,
      destination: "Darwinia",
      asset: { symbol: "DOT" } as WithAmount<TAssetInfo>,
    });

    it("returns native asset for non-Hydration chains", async () => {
      const nativeAsset = { symbol: "DOT" } as TAssetInfo;
      vi.spyOn(dedotApi, "findNativeAssetInfoOrThrow").mockReturnValue(
        nativeAsset,
      );

      const result = await dedotApi.resolveFeeAsset({
        ...createOptions(),
        chain: "Acala",
      });

      expect(result).toEqual({ isCustomAsset: false, asset: nativeAsset });
    });

    it("returns native asset when Hydration has no currency mapping", async () => {
      const nativeAsset = { symbol: "HDX" } as TAssetInfo;
      vi.spyOn(dedotApi, "findNativeAssetInfoOrThrow").mockReturnValue(
        nativeAsset,
      );
      mockApiRaw.query.multiTransactionPayment.accountCurrencyMap.mockResolvedValueOnce(
        null,
      );

      const result = await dedotApi.resolveFeeAsset(createOptions());

      expect(
        mockApiRaw.query.multiTransactionPayment.accountCurrencyMap,
      ).toHaveBeenCalledWith("addr");
      expect(result).toEqual({ isCustomAsset: false, asset: nativeAsset });
    });

    it("returns mapped asset when Hydration has a currency mapping", async () => {
      const mappedAsset = { symbol: "USDC" } as TAssetInfo;
      mockApiRaw.query.multiTransactionPayment.accountCurrencyMap.mockResolvedValueOnce(
        "1001",
      );
      const findAssetInfoOrThrowSpy = vi
        .spyOn(dedotApi, "findAssetInfoOrThrow")
        .mockReturnValue(mappedAsset);

      const result = await dedotApi.resolveFeeAsset(createOptions());

      expect(
        mockApiRaw.query.multiTransactionPayment.accountCurrencyMap,
      ).toHaveBeenCalledWith("addr");
      expect(findAssetInfoOrThrowSpy).toHaveBeenCalledWith("Hydration", {
        id: "1001",
      });
      expect(result).toEqual({ isCustomAsset: true, asset: mappedAsset });
    });
  });

  describe("getDryRunCall", () => {
    let dryRunCallMock: Mock;
    const testAddress = "some_address";

    beforeEach(() => {
      vi.spyOn(dedotApi, "hasDryRunSupport").mockImplementation(
        (chain) => chain !== "Acala",
      );

      dryRunCallMock = mockApiRaw.call.dryRunApi.dryRunCall;
      vi.mocked(computeOriginFee).mockReturnValue(500n);
    });

    it("throws RuntimeApiUnavailableError for unsupported chain", async () => {
      await expect(
        dedotApi.getDryRunCall({
          tx: mockTx,
          address: testAddress,
          chain: "Acala",
          destination: "Acala",
          version: Version.V5,
          asset: {} as WithAmount<TAssetInfo>,
        }),
      ).rejects.toThrow(RuntimeApiUnavailableError);
    });

    it("succeeds on first attempt without version", async () => {
      const successResponse = {
        isOk: true,
        value: {
          executionResult: {
            isOk: true,
            value: { actualWeight: { refTime: 10n, proofSize: 20n } },
          },
          forwardedXcms: [],
        },
      };
      dryRunCallMock.mockResolvedValue(successResponse);
      vi.spyOn(dedotApi, "findNativeAssetInfoOrThrow").mockReturnValue({
        symbol: "GLMR",
      } as TAssetInfo);

      const result = await dedotApi.getDryRunCall({
        tx: mockTx,
        address: testAddress,
        chain: "Darwinia",
        destination: "Acala",
        version: Version.V5,
        asset: { symbol: "GLMR" } as WithAmount<TAssetInfo>,
      });

      expect(dryRunCallMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        success: true,
        fee: 500n,
        asset: { symbol: "GLMR" },
        weight: { refTime: 10n, proofSize: 20n },
        forwardedXcms: [],
        destParaId: undefined,
      });
    });

    it("retries with version when VersionedConversionFailed", async () => {
      const failResponse = {
        isOk: true,
        value: {
          executionResult: {
            isOk: false,
            value: { error: { value: { type: "VersionedConversionFailed" } } },
          },
          forwardedXcms: [],
        },
      };
      const successResponse = {
        isOk: true,
        value: {
          executionResult: {
            isOk: true,
            value: { actualWeight: { refTime: 30n, proofSize: 40n } },
          },
          forwardedXcms: [
            [
              {
                value: { interior: { type: "Here" } },
              },
            ],
          ],
        },
      };

      dryRunCallMock
        .mockResolvedValueOnce(failResponse)
        .mockResolvedValueOnce(successResponse);

      vi.spyOn(dedotApi, "findNativeAssetInfoOrThrow").mockReturnValue({
        symbol: "DOT",
      } as TAssetInfo);

      const result = await dedotApi.getDryRunCall({
        tx: mockTx,
        address: testAddress,
        chain: "AssetHubPolkadot",
        destination: "Acala",
        version: Version.V5,
        asset: { symbol: "DOT" } as WithAmount<TAssetInfo>,
      });

      expect(dryRunCallMock).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.destParaId).toBe(0);
      }
    });

    it("retries with version when first call throws 'Expected 3 parameters'", async () => {
      const successResponse = {
        isOk: true,
        value: {
          executionResult: {
            isOk: true,
            value: { actualWeight: { refTime: 10n, proofSize: 20n } },
          },
          forwardedXcms: [],
        },
      };

      dryRunCallMock
        .mockRejectedValueOnce(new Error("Expected 3 parameters"))
        .mockResolvedValueOnce(successResponse);

      vi.spyOn(dedotApi, "findNativeAssetInfoOrThrow").mockReturnValue({
        symbol: "DOT",
      } as TAssetInfo);

      const result = await dedotApi.getDryRunCall({
        tx: mockTx,
        address: testAddress,
        chain: "Darwinia",
        destination: "Acala",
        version: Version.V5,
        asset: { symbol: "DOT" } as WithAmount<TAssetInfo>,
      });

      expect(dryRunCallMock).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(true);
    });

    it("returns failure with second-attempt message when retry also throws", async () => {
      dryRunCallMock
        .mockRejectedValueOnce(new Error("Expected 3 parameters"))
        .mockRejectedValueOnce(new Error("hex string expected"));

      vi.spyOn(dedotApi, "findNativeAssetInfoOrThrow").mockReturnValue({
        symbol: "DOT",
      } as TAssetInfo);

      const result = await dedotApi.getDryRunCall({
        tx: mockTx,
        address: testAddress,
        chain: "Hydration",
        destination: "AssetHubPolkadot",
        version: Version.V5,
        asset: { symbol: "DOT" } as WithAmount<TAssetInfo>,
      });

      expect(dryRunCallMock).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.dryRunError.reason).toBe("hex string expected");
      }
    });

    it("returns failure when first call throws unexpected error", async () => {
      dryRunCallMock.mockRejectedValue(new Error("Network error"));

      vi.spyOn(dedotApi, "findNativeAssetInfoOrThrow").mockReturnValue({
        symbol: "GLMR",
      } as TAssetInfo);

      const result = await dedotApi.getDryRunCall({
        tx: mockTx,
        address: testAddress,
        chain: "Darwinia",
        destination: "Acala",
        version: Version.V5,
        asset: { symbol: "GLMR" } as WithAmount<TAssetInfo>,
      });

      expect(dryRunCallMock).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.dryRunError.reason).toBe("Network error");
      }
    });

    it("returns failure when execution is not successful and not retryable", async () => {
      const failResponse = {
        isOk: true,
        value: {
          executionResult: {
            isOk: false,
            value: { error: { value: { type: "SomeError" } } },
          },
          forwardedXcms: [],
        },
      };
      dryRunCallMock.mockResolvedValue(failResponse);
      vi.spyOn(dedotApi, "findNativeAssetInfoOrThrow").mockReturnValue({
        symbol: "GLMR",
      } as TAssetInfo);

      const result = await dedotApi.getDryRunCall({
        tx: mockTx,
        address: testAddress,
        chain: "Darwinia",
        destination: "Acala",
        version: Version.V5,
        asset: { symbol: "USDT" } as WithAmount<TAssetInfo>,
      });

      expect(dryRunCallMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        success: false,
        dryRunError: { reason: "SomeError" },
        asset: { symbol: "GLMR" },
      });
    });

    it("wraps tx when useRootOrigin is true", async () => {
      const successResponse = {
        isOk: true,
        value: {
          executionResult: {
            isOk: true,
            value: { actualWeight: { refTime: 10n, proofSize: 20n } },
          },
          forwardedXcms: [],
        },
      };
      dryRunCallMock.mockResolvedValue(successResponse);
      vi.mocked(wrapTxBypass).mockResolvedValue(mockTx);
      vi.spyOn(dedotApi, "findNativeAssetInfoOrThrow").mockReturnValue({
        symbol: "GLMR",
      } as TAssetInfo);

      await dedotApi.getDryRunCall({
        tx: mockTx,
        address: testAddress,
        chain: "Darwinia",
        destination: "Acala",
        useRootOrigin: true,
        version: Version.V5,
        asset: { symbol: "GLMR" } as WithAmount<TAssetInfo>,
      });

      expect(wrapTxBypass).toHaveBeenCalled();
      expect(dryRunCallMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "System",
          value: { type: "Root" },
        }),
        mockTx.call,
      );
    });

    it("extracts destParaId from forwarded xcm with parachain interior", async () => {
      const successResponse = {
        isOk: true,
        value: {
          executionResult: {
            isOk: true,
            value: { actualWeight: { refTime: 10n, proofSize: 20n } },
          },
          forwardedXcms: [
            [
              {
                value: {
                  interior: {
                    type: "X1",
                    value: [{ value: 2000 }],
                  },
                },
              },
            ],
          ],
        },
      };
      dryRunCallMock.mockResolvedValue(successResponse);
      vi.spyOn(dedotApi, "findNativeAssetInfoOrThrow").mockReturnValue({
        symbol: "GLMR",
      } as TAssetInfo);

      const result = await dedotApi.getDryRunCall({
        tx: mockTx,
        address: testAddress,
        chain: "Darwinia",
        destination: "Acala",
        version: Version.V5,
        asset: {} as WithAmount<TAssetInfo>,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.destParaId).toBe(2000);
      }
    });
  });

  describe("getDryRunXcm", () => {
    const originLocation: TLocation = {
      parents: 0,
      interior: { Here: null },
    };
    const dummyXcm = { some: "xcm-payload" };

    beforeEach(() => {
      vi.spyOn(dedotApi, "hasDryRunSupport").mockImplementation(
        (chain) => chain !== "Acala",
      );
    });

    it("throws for unsupported chain", async () => {
      await expect(
        dedotApi.getDryRunXcm({
          originLocation,
          xcm: dummyXcm,
          chain: "Acala",
          asset: { symbol: "USDT" } as TAssetInfo,
          version: Version.V5,
        } as TDryRunXcmBaseOptions<TDedotExtrinsic>),
      ).rejects.toThrow(RuntimeApiUnavailableError);
    });

    it("returns success with fee and weight", async () => {
      vi.spyOn(dedotApi, "hasXcmPaymentApiSupport").mockReturnValue(true);

      const mockResponse = {
        isOk: true,
        value: {
          executionResult: {
            type: "Complete",
            value: { used: { refTime: 11n, proofSize: 22n } },
          },
          forwardedXcms: [
            [
              {
                value: {
                  interior: {
                    type: "X1",
                    value: [{ value: 1000 }],
                  },
                },
              },
            ],
          ],
        },
      };
      mockApiRaw.call.dryRunApi.dryRunXcm.mockResolvedValue(mockResponse);

      const getXcmPaymentApiFeeSpy = vi
        .spyOn(dedotApi, "getXcmPaymentApiFee")
        .mockResolvedValue(999n);

      const result = await dedotApi.getDryRunXcm({
        originLocation,
        xcm: dummyXcm,
        chain: "AssetHubPolkadot",
        asset: { symbol: "USDT", location: {} } as TAssetInfo,
        version: Version.V5,
      } as TDryRunXcmBaseOptions<TDedotExtrinsic>);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.fee).toBe(999n);
        expect(result.destParaId).toBe(1000);
      }

      getXcmPaymentApiFeeSpy.mockRestore();
    });

    it("returns failure with reason on incomplete execution", async () => {
      const mockResponse = {
        isOk: true,
        value: {
          executionResult: {
            type: "Incomplete",
            value: { error: { type: "SomeXcmError" } },
          },
          forwardedXcms: [],
        },
      };
      mockApiRaw.call.dryRunApi.dryRunXcm.mockResolvedValue(mockResponse);

      const result = await dedotApi.getDryRunXcm({
        originLocation,
        xcm: dummyXcm,
        chain: "AssetHubPolkadot",
        asset: { symbol: "USDT" } as TAssetInfo,
        version: Version.V5,
      } as TDryRunXcmBaseOptions<TDedotExtrinsic>);

      expect(result).toEqual({
        success: false,
        dryRunError: { reason: "SomeXcmError" },
        asset: { symbol: "USDT" },
      });
    });

    it("returns failureIndex when incomplete error carries an instruction index", async () => {
      const mockResponse = {
        isOk: true,
        value: {
          executionResult: {
            type: "Incomplete",
            value: { error: { index: 2, error: { type: "SomeXcmError" } } },
          },
          forwardedXcms: [],
        },
      };
      mockApiRaw.call.dryRunApi.dryRunXcm.mockResolvedValue(mockResponse);

      const result = await dedotApi.getDryRunXcm({
        originLocation,
        xcm: dummyXcm,
        chain: "AssetHubPolkadot",
        asset: { symbol: "USDT" } as TAssetInfo,
        version: Version.V5,
      } as TDryRunXcmBaseOptions<TDedotExtrinsic>);

      expect(result).toEqual({
        success: false,
        dryRunError: { reason: "SomeXcmError", instructionIndex: 2 },
        asset: { symbol: "USDT" },
      });
    });

    it("returns failure when XcmPaymentApi is not supported", async () => {
      vi.spyOn(dedotApi, "hasXcmPaymentApiSupport").mockReturnValue(false);

      const mockResponse = {
        isOk: true,
        value: {
          executionResult: {
            type: "Complete",
            value: { used: { refTime: 10n, proofSize: 20n } },
          },
          forwardedXcms: [],
        },
      };
      mockApiRaw.call.dryRunApi.dryRunXcm.mockResolvedValue(mockResponse);

      const result = await dedotApi.getDryRunXcm({
        originLocation,
        xcm: dummyXcm,
        chain: "AssetHubPolkadot",
        asset: { symbol: "USDT" } as TAssetInfo,
        version: Version.V5,
      } as TDryRunXcmBaseOptions<TDedotExtrinsic>);

      expect(result).toEqual({
        success: false,
        dryRunError: {
          reason:
            "Cannot determine destination fee. XcmPaymentApi is not supported by this chain",
        },
        asset: { symbol: "USDT" },
      });
    });
  });

  describe("getXcmPaymentApiFee", () => {
    const chain: TSubstrateChain = "Darwinia";
    const localXcm = { type: "V4", value: [] };
    const baseAsset: TAssetInfo = {
      symbol: "GLMR",
      decimals: 18,
      location: { parents: 0, interior: { Here: null } },
    };

    beforeEach(() => {
      vi.mocked(localizeLocation).mockImplementation(
        (_: TChain, loc: TLocation) => loc,
      );
      vi.spyOn(dedotApi, "getDeliveryFee").mockResolvedValue(0n);
    });

    it("adds delivery fee to exec fee", async () => {
      vi.spyOn(dedotApi, "getDeliveryFee").mockResolvedValueOnce(7n);

      const result = await dedotApi.getXcmPaymentApiFee(
        chain,
        localXcm,
        [{}, [{}]],
        baseAsset,
        Version.V5,
      );

      expect(result).toBe(107n);
    });
  });

  describe("getDeliveryFee", () => {
    const chain: TSubstrateChain = "Darwinia";
    const baseAsset: TAssetInfo = {
      symbol: "GLMR",
      decimals: 18,
      location: { parents: 0, interior: { Here: null } },
    };

    beforeEach(() => {
      vi.spyOn(dedotApi, "findNativeAssetInfoOrThrow").mockReturnValue(
        baseAsset,
      );
      vi.mocked(localizeLocation).mockImplementation(
        (_: TChain, loc: TLocation) => loc,
      );
      vi.mocked(isAssetEqual).mockReturnValue(true);
    });

    it("returns delivery fee directly for native asset", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const forwardedXcm: any[] = [{}, [{}]];
      const result = await dedotApi.getDeliveryFee(
        chain,
        forwardedXcm,
        baseAsset,
        baseAsset.location,
        Version.V5,
      );
      expect(result).toBe(7n);
    });

    it("returns 0 when forwardedXcm is empty", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const forwardedXcm: any[] = [];
      const result = await dedotApi.getDeliveryFee(
        chain,
        forwardedXcm,
        baseAsset,
        baseAsset.location,
        Version.V5,
      );
      expect(result).toBe(0n);
    });

    it("converts delivery fee via queryRuntimeApi for non-native asset", async () => {
      vi.mocked(isAssetEqual).mockReturnValue(false);
      vi.spyOn(dedotApi, "queryRuntimeApi").mockResolvedValue(5n);

      const asset: TAssetInfo = {
        symbol: "USDC",
        decimals: 6,
        location: { parents: 1, interior: { Here: null } },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const forwardedXcm: any[] = [{}, [{}]];
      const result = await dedotApi.getDeliveryFee(
        chain,
        forwardedXcm,
        asset,
        asset.location,
        Version.V5,
      );

      expect(result).toBe(5n);
    });

    it("falls back to 0 when queryRuntimeApi throws", async () => {
      vi.mocked(isAssetEqual).mockReturnValue(false);
      vi.spyOn(dedotApi, "queryRuntimeApi").mockRejectedValue(
        new Error("not available"),
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const forwardedXcm: any[] = [{}, [{}]];
      const result = await dedotApi.getDeliveryFee(
        chain,
        forwardedXcm,
        baseAsset,
        baseAsset.location,
        Version.V5,
      );

      expect(result).toBe(0n);
    });

    it("retries with 3rd param when first call throws 'Expected 3 parameters'", async () => {
      mockApiRaw.call.xcmPaymentApi.queryDeliveryFees
        .mockRejectedValueOnce(new Error("Expected 3 parameters"))
        .mockResolvedValueOnce({
          value: { value: [{ fun: { value: 9n } }] },
        });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const forwardedXcm: any[] = [{}, [{}]];
      const result = await dedotApi.getDeliveryFee(
        chain,
        forwardedXcm,
        baseAsset,
        baseAsset.location,
        Version.V5,
      );

      expect(
        mockApiRaw.call.xcmPaymentApi.queryDeliveryFees,
      ).toHaveBeenCalledTimes(2);
      expect(result).toBe(9n);
    });
  });

  describe("getXcmWeight", () => {
    it("returns parsed weight", async () => {
      const result = await dedotApi.getXcmWeight({ some: "xcm" });
      expect(result).toEqual({ refTime: 100n, proofSize: 200n });
    });

    it("preserves transformed XCM and defaults missing weight fields to zero", async () => {
      mockApiRaw.call.xcmPaymentApi.queryXcmWeight.mockResolvedValueOnce({
        value: {},
      });

      const xcm = { type: "V5", value: [] };
      await expect(dedotApi.getXcmWeight(xcm)).resolves.toEqual({
        refTime: 0n,
        proofSize: 0n,
      });
      expect(transform).not.toHaveBeenCalledWith(xcm);
    });
  });

  describe("encoding and capability helpers", () => {
    it.each([
      ["0x0", "0x00"],
      ["0x00", "0x00"],
      ["1", "01"],
      ["12", "12"],
    ])("encodes %s as an even-length hex value", (input, encoded) => {
      expect(dedotApi.encodeTx(input)).toEqual({ encoded });
    });

    it("returns undefined when transfer assets are missing or malformed", () => {
      const missingAssets = {
        call: {
          palletCall: {
            name: "transferAssetsUsingTypeAndThen",
            params: {},
          },
        },
      } as unknown as TDedotExtrinsic;
      const malformedAssets = {
        call: {
          palletCall: {
            name: "transferAssetsUsingTypeAndThen",
            params: { assets: { value: {} } },
          },
        },
      } as unknown as TDedotExtrinsic;

      expect(dedotApi.getTypeThenAssetCount(missingAssets)).toBeUndefined();
      expect(dedotApi.getTypeThenAssetCount(malformedAssets)).toBeUndefined();
    });

    it("returns false when checking a method throws", async () => {
      Object.defineProperty(mockApiRaw.tx, "broken", {
        get() {
          throw new Error("metadata unavailable");
        },
      });

      await expect(
        dedotApi.hasMethod("Broken" as never, "method"),
      ).resolves.toBe(false);
    });

    it("detects available and unavailable runtime APIs", async () => {
      await expect(dedotApi.hasRuntimeApi("DryRunApi")).resolves.toBe(true);
      delete (mockApiRaw.call as Partial<typeof mockApiRaw.call>).dryRunApi;
      await expect(dedotApi.hasRuntimeApi("DryRunApi")).resolves.toBe(false);
    });

    it("maps pallet metadata and identifies extrinsic support", async () => {
      mockApiRaw.metadata.latest.pallets = [
        { name: "Balances", index: 10, calls: {} },
        { name: "System", index: 0, calls: undefined },
      ];

      await expect(dedotApi.fetchPalletList()).resolves.toEqual([
        { name: "Balances", index: 10, hasExtrinsics: true },
        { name: "System", index: 0, hasExtrinsics: false },
      ]);
    });

    it("identifies EVM and non-EVM account metadata", async () => {
      mockApiRaw.metadata.latest.types = [{ path: ["AccountId20"] }];
      await expect(dedotApi.isEvmChain()).resolves.toBe(true);

      mockApiRaw.metadata.latest.types = [{ path: ["AccountId32"] }];
      await expect(dedotApi.isEvmChain()).resolves.toBe(false);

      mockApiRaw.metadata.latest.types = [];
      await expect(dedotApi.isEvmChain()).resolves.toBe(false);
    });

    it("reads an available RPC method", async () => {
      const rpcMethod = vi.fn().mockReturnValue("0xvalue");
      Object.assign(mockApiRaw.rpc, { state_getStorage: rpcMethod });

      await expect(
        dedotApi.getFromRpc("state", "getStorage", "0xkey"),
      ).resolves.toBe("0xvalue");
      expect(rpcMethod).toHaveBeenCalledTimes(2);
    });

    it("rejects missing and unsupported RPC methods", async () => {
      await expect(
        dedotApi.getFromRpc("state", "missing", "0xkey"),
      ).rejects.toThrow("RPC method state.missing not available");

      Object.assign(mockApiRaw.rpc, {
        state_empty: vi.fn().mockReturnValue(undefined),
      });
      await expect(
        dedotApi.getFromRpc("state", "empty", "0xkey"),
      ).rejects.toThrow("RPC method state.empty not available");
    });

    it("creates and initializes a separate API for another chain", async () => {
      const init = vi
        .spyOn(DedotApi.prototype, "init")
        .mockResolvedValue(undefined);

      const result = await dedotApi.createApiForChain("Astar");

      expect(result).toBeInstanceOf(DedotApi);
      expect(init).toHaveBeenCalledWith("Astar");
    });
  });

  describe("constants and system properties", () => {
    it("reads constants and returns undefined for missing pallets", async () => {
      Object.assign(mockApiRaw.consts, {
        balances: { existentialDeposit: 10n },
      });

      await expect(
        dedotApi.getConstant("Balances", "ExistentialDeposit"),
      ).resolves.toBe(10n);
      await expect(
        dedotApi.getConstant("Missing", "Value"),
      ).resolves.toBeUndefined();
    });

    it("returns undefined when reading constants throws", async () => {
      Object.defineProperty(mockApiRaw, "consts", {
        get() {
          throw new Error("constants unavailable");
        },
      });

      await expect(
        dedotApi.getConstant("Balances", "Value"),
      ).resolves.toBeUndefined();
    });

    it("normalizes scalar and array system properties", async () => {
      mockApiRaw.rpc.system_properties
        .mockResolvedValueOnce({
          ss58Format: 42,
          tokenSymbol: "DOT",
          tokenDecimals: 10,
        })
        .mockResolvedValueOnce({
          ss58Format: "invalid",
          tokenSymbol: ["KSM", "DOT"],
          tokenDecimals: [12, 10],
        })
        .mockResolvedValueOnce(undefined);

      await expect(dedotApi.getSystemProperties()).resolves.toEqual({
        ss58Format: 42,
        tokenSymbol: "DOT",
        tokenDecimals: 10,
      });
      await expect(dedotApi.getSystemProperties()).resolves.toEqual({
        ss58Format: undefined,
        tokenSymbol: "KSM",
        tokenDecimals: 12,
      });
      await expect(dedotApi.getSystemProperties()).resolves.toEqual({
        ss58Format: undefined,
        tokenSymbol: undefined,
        tokenDecimals: undefined,
      });
    });
  });

  describe("fee API fallbacks", () => {
    const asset: TAssetInfo = {
      symbol: "DOT",
      decimals: 10,
      location: { parents: 0, interior: { Here: null } },
    };

    beforeEach(() => {
      vi.mocked(localizeLocation).mockImplementation(
        (_chain: TChain, location: TLocation) => location,
      );
    });

    it("uses an overridden weight and transforms XCM when requested", async () => {
      vi.spyOn(dedotApi, "getDeliveryFee").mockResolvedValue(0n);
      mockApiRaw.call.xcmPaymentApi.queryWeightToAssetFee.mockResolvedValueOnce(
        {
          value: "unsupported",
        },
      );

      const result = await dedotApi.getXcmPaymentApiFee(
        "Darwinia",
        { raw: true },
        [],
        asset,
        Version.V5,
        true,
        { refTime: 1n, proofSize: 2n },
      );

      expect(result).toBe(0n);
      expect(transform).toHaveBeenCalledWith({ raw: true });
      expect(
        mockApiRaw.call.xcmPaymentApi.queryXcmWeight,
      ).not.toHaveBeenCalled();
    });

    it("uses the Bridge Hub execution-fee fallback for an unknown asset", async () => {
      vi.spyOn(dedotApi, "getDeliveryFee").mockResolvedValue(2n);
      const fallback = vi
        .spyOn(dedotApi, "getBridgeHubFallbackExecFee")
        .mockResolvedValue(30n);
      mockApiRaw.call.xcmPaymentApi.queryWeightToAssetFee.mockResolvedValueOnce(
        {
          success: false,
          value: { type: "AssetNotFound" },
        },
      );

      await expect(
        dedotApi.getXcmPaymentApiFee(
          "BridgeHubPolkadot",
          {},
          [],
          asset,
          Version.V5,
        ),
      ).resolves.toBe(32n);
      expect(fallback).toHaveBeenCalled();
    });

    it("returns zero when the Bridge Hub relay fee cannot be decoded", async () => {
      mockApiRaw.call.xcmPaymentApi.queryWeightToAssetFee.mockResolvedValueOnce(
        {
          value: {},
        },
      );

      await expect(
        dedotApi.getBridgeHubFallbackExecFee(
          "BridgeHubPolkadot",
          { refTime: 1n, proofSize: 2n },
          asset,
          Version.V5,
        ),
      ).resolves.toBe(0n);
    });

    it.each([
      [4n, 9n, 9n],
      ["4", undefined, 0n],
      [4, 9n, 9n],
    ])(
      "converts a %s Bridge Hub relay fee on Asset Hub",
      async (relayFee, convertedFee, expected) => {
        mockApiRaw.call.xcmPaymentApi.queryWeightToAssetFee.mockResolvedValueOnce(
          {
            value: relayFee,
          },
        );
        const assetHubApi = {
          init: vi.fn().mockResolvedValue(undefined),
          queryRuntimeApi: vi.fn().mockResolvedValue(convertedFee),
        };
        vi.spyOn(dedotApi, "clone").mockReturnValue(
          assetHubApi as unknown as DedotApi,
        );
        vi.spyOn(dedotApi, "getRelayChainOf").mockReturnValue("Polkadot");

        await expect(
          dedotApi.getBridgeHubFallbackExecFee(
            "BridgeHubPolkadot",
            { refTime: 1n, proofSize: 2n },
            asset,
            Version.V5,
          ),
        ).resolves.toBe(expected);
        expect(assetHubApi.init).toHaveBeenCalledWith("AssetHubPolkadot");
      },
    );

    it("returns zero when delivery-fee conversion has no quote", async () => {
      vi.mocked(isAssetEqual).mockReturnValue(false);
      vi.spyOn(dedotApi, "findNativeAssetInfoOrThrow").mockReturnValue(asset);
      vi.spyOn(dedotApi, "queryRuntimeApi").mockResolvedValue(undefined);

      await expect(
        dedotApi.getDeliveryFee(
          "Darwinia",
          [{}, [{}]],
          { ...asset, symbol: "USDC" },
          asset.location,
          Version.V5,
        ),
      ).resolves.toBe(0n);
    });

    it("propagates unrelated delivery-fee errors", async () => {
      vi.spyOn(dedotApi, "findNativeAssetInfoOrThrow").mockReturnValue(asset);
      mockApiRaw.call.xcmPaymentApi.queryDeliveryFees.mockRejectedValueOnce(
        "RPC unavailable",
      );

      await expect(
        dedotApi.getDeliveryFee(
          "Darwinia",
          [{}, [{}]],
          asset,
          asset.location,
          Version.V5,
        ),
      ).rejects.toBe("RPC unavailable");
    });
  });

  describe("additional dry-run result shapes", () => {
    const asset = {
      symbol: "DOT",
      decimals: 10,
      location: { parents: 0, interior: { Here: null } },
    } as TAssetInfo;

    it("uses XcmPaymentApi for an explicit fee asset", async () => {
      vi.spyOn(dedotApi, "hasXcmPaymentApiSupport").mockReturnValue(true);
      vi.spyOn(dedotApi, "getXcmPaymentApiFee").mockResolvedValue(12n);
      mockApiRaw.call.dryRunApi.dryRunCall.mockResolvedValue({
        isOk: true,
        value: {
          executionResult: {
            isOk: true,
            value: { actual_weight: { refTime: 3n, proofSize: 4n } },
          },
          forwardedXcms: [],
          localXcm: { type: "V5", value: [] },
        },
      });

      await expect(
        dedotApi.getDryRunCall({
          tx: mockTx,
          address: "5Alice",
          chain: "Darwinia",
          destination: "Acala",
          version: Version.V5,
          asset: { ...asset, amount: 1n },
          feeAsset: asset,
        }),
      ).resolves.toEqual(
        expect.objectContaining({
          success: true,
          fee: 12n,
          weight: { refTime: 3n, proofSize: 4n },
        }),
      );
    });

    it("falls back to the native asset when a custom fee quote fails", async () => {
      const nativeAsset = { ...asset, symbol: "HDX" };
      const customAsset = { ...asset, symbol: "USDT" };
      mockApiRaw.query.multiTransactionPayment.accountCurrencyMap.mockResolvedValue(
        10,
      );
      vi.spyOn(dedotApi, "findAssetInfoOrThrow").mockReturnValue(customAsset);
      vi.spyOn(dedotApi, "findNativeAssetInfoOrThrow").mockReturnValue(
        nativeAsset,
      );
      const getXcmPaymentApiFee = vi
        .spyOn(dedotApi, "getXcmPaymentApiFee")
        .mockResolvedValue(undefined as never);
      mockApiRaw.call.dryRunApi.dryRunCall.mockResolvedValue({
        isOk: true,
        value: {
          executionResult: { isOk: true, value: {} },
          forwardedXcms: [],
        },
      });

      const result = await dedotApi.getDryRunCall({
        tx: mockTx,
        address: "5Alice",
        chain: "Hydration",
        destination: "Acala",
        version: Version.V5,
        asset: { ...asset, amount: 1n },
      });

      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          fee: 500n,
          asset: nativeAsset,
        }),
      );
      expect(getXcmPaymentApiFee).toHaveBeenCalledWith(
        "Hydration",
        undefined,
        [],
        customAsset,
        Version.V5,
        false,
        { refTime: 10n, proofSize: 20n },
      );
    });

    it.each([
      [{ error: { Other: "OtherFailure" } }, "OtherFailure"],
      [{ error: "StringFailure" }, "StringFailure"],
      [{ error: { custom: true } }, '{"custom":true}'],
    ])("extracts execution error shape %#", async (executionError, reason) => {
      vi.spyOn(dedotApi, "findNativeAssetInfoOrThrow").mockReturnValue(asset);
      mockApiRaw.call.dryRunApi.dryRunCall.mockResolvedValue({
        isOk: true,
        value: {
          executionResult: { isOk: false, value: executionError },
          forwardedXcms: [],
        },
      });

      const result = await dedotApi.getDryRunCall({
        tx: mockTx,
        address: "5Alice",
        chain: "Darwinia",
        destination: "Acala",
        version: Version.V5,
        asset: { ...asset, amount: 1n },
      });

      expect(result).toEqual(
        expect.objectContaining({
          success: false,
          dryRunError: expect.objectContaining({ reason }),
        }),
      );
    });

    it.each([
      [{ type: "Module", value: { type: "BadModule" } }, "BadModule"],
      [{ type: "EventFailure" }, "EventFailure"],
    ])("extracts a dispatched-as error %#", async (eventError, reason) => {
      vi.spyOn(dedotApi, "findNativeAssetInfoOrThrow").mockReturnValue(asset);
      mockApiRaw.call.dryRunApi.dryRunCall.mockResolvedValue({
        isOk: true,
        value: {
          executionResult: { isOk: true, value: {} },
          emittedEvents: [
            {
              pallet: "Utility",
              palletEvent: {
                name: "DispatchedAs",
                data: { result: { isErr: true, err: eventError } },
              },
            },
          ],
          forwardedXcms: [],
        },
      });

      const result = await dedotApi.getDryRunCall({
        tx: mockTx,
        address: "5Alice",
        chain: "Darwinia",
        destination: "Acala",
        version: Version.V5,
        asset: { ...asset, amount: 1n },
      });

      expect(result).toEqual(
        expect.objectContaining({
          success: false,
          dryRunError: expect.objectContaining({ reason }),
        }),
      );
    });

    it("keeps the first failure when the versioned retry throws", async () => {
      vi.spyOn(dedotApi, "findNativeAssetInfoOrThrow").mockReturnValue(asset);
      mockApiRaw.call.dryRunApi.dryRunCall
        .mockResolvedValueOnce({
          isOk: true,
          value: {
            executionResult: {
              isOk: false,
              value: {
                error: { value: { type: "VersionedConversionFailed" } },
              },
            },
            forwardedXcms: [],
          },
        })
        .mockRejectedValueOnce(new Error("retry failed"));

      const result = await dedotApi.getDryRunCall({
        tx: mockTx,
        address: "5Alice",
        chain: "Darwinia",
        destination: "Acala",
        version: Version.V5,
        asset: { ...asset, amount: 1n },
      });

      expect(result).toEqual(
        expect.objectContaining({
          success: false,
          dryRunError: expect.objectContaining({
            reason: "VersionedConversionFailed",
          }),
        }),
      );
    });

    it("extracts a directly encoded destination parachain", () => {
      expect(
        dedotApi.extractDestParaId([
          { value: { interior: { type: "X1", value: { value: 3000 } } } },
        ]),
      ).toBe(3000);
    });
  });

  describe("additional XCM dry-run failures", () => {
    const originLocation = {
      parents: 0,
      interior: { Here: null },
    } as TLocation;
    const asset = { symbol: "DOT" } as TAssetInfo;

    beforeEach(() => {
      vi.spyOn(dedotApi, "hasDryRunSupport").mockReturnValue(true);
    });

    it.each([
      [{ value: { error: { type: "NestedFailure" } } }, "NestedFailure"],
      [{ value: { value: { type: "DeepFailure" } } }, "DeepFailure"],
      [{ value: { type: "ValueFailure" } }, "ValueFailure"],
      [{}, "Incomplete"],
    ])("extracts incomplete XCM error shape %#", async (error, reason) => {
      mockApiRaw.call.dryRunApi.dryRunXcm.mockResolvedValue({
        isOk: true,
        value: {
          executionResult: { type: "Incomplete", value: { error } },
          forwardedXcms: [],
        },
      });

      const result = await dedotApi.getDryRunXcm({
        originLocation,
        xcm: {},
        chain: "AssetHubPolkadot",
        asset,
        version: Version.V5,
      } as TDryRunXcmBaseOptions<TDedotExtrinsic>);

      expect(result).toEqual(
        expect.objectContaining({
          success: false,
          dryRunError: expect.objectContaining({ reason }),
        }),
      );
    });

    it("serializes an unknown XCM error structure", async () => {
      mockApiRaw.call.dryRunApi.dryRunXcm.mockResolvedValue({
        isOk: false,
        value: { unexpected: 1n },
      });

      const result = await dedotApi.getDryRunXcm({
        originLocation,
        xcm: {},
        chain: "AssetHubPolkadot",
        asset,
        version: Version.V5,
      } as TDryRunXcmBaseOptions<TDedotExtrinsic>);

      expect(result).toEqual(
        expect.objectContaining({
          success: false,
          dryRunError: expect.objectContaining({
            reason: '{"unexpected":"1"}',
          }),
        }),
      );
    });

    it("fails when XcmPaymentApi does not return a bigint fee", async () => {
      vi.spyOn(dedotApi, "hasXcmPaymentApiSupport").mockReturnValue(true);
      vi.spyOn(dedotApi, "getXcmPaymentApiFee").mockResolvedValue(
        undefined as never,
      );
      mockApiRaw.call.dryRunApi.dryRunXcm.mockResolvedValue({
        isOk: true,
        value: {
          executionResult: { type: "Complete", value: {} },
          forwardedXcms: [],
        },
      });

      const result = await dedotApi.getDryRunXcm({
        originLocation,
        xcm: {},
        chain: "AssetHubPolkadot",
        asset,
        version: Version.V5,
      } as TDryRunXcmBaseOptions<TDedotExtrinsic>);

      expect(result).toEqual({
        success: false,
        dryRunError: { reason: "Failed to retrieve fee from XcmPaymentApi" },
        asset,
      });
    });
  });

  describe("disconnect", () => {
    it("does nothing when not initialized", async () => {
      const freshApi = new DedotApi();
      await freshApi.disconnect();
      // No error thrown
    });

    it("does nothing when disconnectAllowed is false and force is false", async () => {
      dedotApi.disconnectAllowed = false;
      await dedotApi.disconnect(false);
      expect(mockApiRaw.disconnect).not.toHaveBeenCalled();
    });

    it("disconnects an automatically created client when forced", async () => {
      await dedotApi.disconnect(true);
      expect(mockApiRaw.disconnect).toHaveBeenCalled();
    });

    it("disconnects a provided client only when forced", async () => {
      const ownApi = new DedotApi(mockApi);
      await ownApi.init("Acala");

      await ownApi.disconnect(false);
      expect(mockApiRaw.disconnect).not.toHaveBeenCalled();

      await ownApi.disconnect(true);
      expect(mockApiRaw.disconnect).toHaveBeenCalled();
    });
  });

  describe("signAndSubmit", () => {
    it("signs with a keyring pair created from a path", async () => {
      vi.mocked(isSenderSigner).mockReturnValue(false);
      const signAndSend = vi.spyOn(mockTx, "signAndSend");

      await expect(dedotApi.signAndSubmit(mockTx, "//Alice")).resolves.toBe(
        "0xtxhash",
      );
      expect(signAndSend).toHaveBeenCalledWith(
        expect.objectContaining({ address: "5MockAddress" }),
      );
    });

    it("signs directly with a provided signer", async () => {
      const signer = { address: "5Signer" } as TDedotSigner;
      vi.mocked(isSenderSigner).mockReturnValue(true);
      const signAndSend = vi.spyOn(mockTx, "signAndSend");

      await dedotApi.signAndSubmit(mockTx, signer);

      expect(signAndSend).toHaveBeenCalledWith(signer);
    });
  });

  describe("signAndSubmitFinalized", () => {
    it("should resolve with txHash on finalized", async () => {
      const mockTxHash = "0xfinalized";
      const mockTx = {
        signAndSend: vi.fn().mockReturnValue({
          untilFinalized: vi.fn().mockResolvedValue({ txHash: mockTxHash }),
        }),
      } as unknown as TDedotExtrinsic;

      const signAndSendSpy = vi.spyOn(mockTx, "signAndSend");
      const result = await dedotApi.signAndSubmitFinalized(mockTx, "//Alice");

      expect(signAndSendSpy).toHaveBeenCalled();
      expect(result).toBe(mockTxHash);
    });

    it("should propagate errors from untilFinalized", async () => {
      const mockTx = {
        signAndSend: vi.fn().mockReturnValue({
          untilFinalized: vi
            .fn()
            .mockRejectedValue(new Error("finalization failed")),
        }),
      } as unknown as TDedotExtrinsic;

      await expect(
        dedotApi.signAndSubmitFinalized(mockTx, "//Alice"),
      ).rejects.toThrow("finalization failed");
    });

    it("should reject with SubmitTransactionError on dispatchError", async () => {
      const mockTx = {
        signAndSend: vi.fn().mockReturnValue({
          untilFinalized: vi.fn().mockResolvedValue({
            txHash: "0xfinalized",
            dispatchError: {
              type: "Module",
              value: { index: 5, error: 2 },
            },
          }),
        }),
      } as unknown as TDedotExtrinsic;

      await expect(
        dedotApi.signAndSubmitFinalized(mockTx, "//Alice"),
      ).rejects.toThrow(SubmitTransactionError);
    });
  });
});
