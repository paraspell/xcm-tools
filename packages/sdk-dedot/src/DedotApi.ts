/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import type {
  TAssetInfo,
  TBridgeStatus,
  TDryRunCallBaseOptions,
  TDryRunChainResult,
  TDryRunError,
  TDryRunXcmBaseOptions,
  TLocation,
  TModuleError,
  TPallet,
  TPaymentInfo,
  TSender,
  TSerializedExtrinsics,
  TSerializedRuntimeApiQuery,
  TSerializedStateQuery,
  TSubstrateChain,
  TUrl,
  TWeight,
  Version,
} from "@paraspell/sdk-core";
import {
  addXcmVersionHeader,
  BatchMode,
  createAssetId,
  createClientCache,
  createClientPoolHelpers,
  EXTENSION_MS,
  findAssetInfoOrThrow,
  findNativeAssetInfoOrThrow,
  getChainProviders,
  getRelayChainOf,
  hasXcmPaymentApiSupport,
  isAssetXcEqual,
  isConfig,
  isSenderSigner,
  localizeLocation,
  MAX_CLIENTS,
  PolkadotApi,
  RELAY_LOCATION,
  replaceBigInt,
  RuntimeApiUnavailableError,
  UnsupportedOperationError,
  wrapTxBypass,
} from "@paraspell/sdk-core";
import { getAssetsObject, resolveModuleError } from "@paraspell/sdk-core";
import { DedotClient, WsProvider } from "dedot";
import {
  blake2AsHex,
  decodeAddress,
  hexToU8a,
  isHex,
  stringToU8a,
  u8aToHex,
} from "dedot/utils";

import type { TDedotApi, TDedotExtrinsic, TDedotSigner } from "./types";
import { findCodecByType } from "./utils";
import { computeOriginFee } from "./utils/computeOriginFee";
import { createKeyringPair } from "./utils/signer";
import { lowercaseFirstLetter, snakeToCamel } from "./utils/string";
import { transform } from "./XcmTransformer";

const clientPool = createClientCache<TDedotApi>(
  MAX_CLIENTS,
  async (client) => {
    await client.rpc.system_chain();
  },
  (_key, entry) => {
    void entry.client.disconnect();
  },
  EXTENSION_MS,
);

const createDedotClient = async (ws: TUrl): Promise<TDedotApi> =>
  DedotClient.new(new WsProvider(ws));

const { leaseClient, releaseClient } = createClientPoolHelpers(
  clientPool,
  createDedotClient,
);

const extractDryRunXcmFailureReason = (result: any): string => {
  const executionResult = result?.value?.executionResult;

  const error = executionResult?.value?.error;

  const failureType =
    error?.error?.type ??
    error?.value?.error?.type ??
    error?.value?.value?.type ??
    error?.value?.type ??
    error?.type;

  if (typeof failureType === "string") {
    return failureType;
  }

  if (typeof executionResult?.type === "string") {
    return executionResult.type;
  }

  return JSON.stringify(
    result?.value ?? result ?? "Unknown error structure",
    replaceBigInt,
  );
};

class DedotApi extends PolkadotApi<TDedotApi, TDedotExtrinsic, TDedotSigner> {
  readonly type = "DEDOT";

  leaseClient(wsUrl: TUrl, ttlMs: number): Promise<TDedotApi> {
    return leaseClient(wsUrl, ttlMs);
  }

  accountToHex(address: string, isPrefixed = true) {
    if (isHex(address)) return address;
    const uint8Array = decodeAddress(address);
    const hex = u8aToHex(uint8Array);
    return isPrefixed ? hex : hex.slice(2);
  }

  accountToUint8a(address: string): Uint8Array {
    return decodeAddress(address);
  }

  private convertToDedotCall<
    T extends
      | TSerializedExtrinsics
      | TSerializedStateQuery
      | TSerializedRuntimeApiQuery,
  >({ module, method }: T) {
    return {
      module: lowercaseFirstLetter(module),
      method: snakeToCamel(method),
    };
  }

  deserializeExtrinsics(serialized: TSerializedExtrinsics) {
    const { params } = serialized;
    const transformedParams = transform(params);
    const values = Object.values(transformedParams);
    const { module, method } = this.convertToDedotCall(serialized);
    return this.api.tx[module][method](...values);
  }

  txFromHex(hex: string): Promise<TDedotExtrinsic> {
    return Promise.resolve(this.api.toTx(hex as `0x${string}`));
  }

  txToHex(tx: TDedotExtrinsic): Promise<string> {
    return Promise.resolve(tx.callHex);
  }

  encodeTx(hex: string) {
    return { encoded: hex };
  }

  queryState<T>(serialized: TSerializedStateQuery): Promise<T> {
    const { params } = serialized;
    const { module, method } = this.convertToDedotCall(serialized);
    return this.api.query[module][method](
      params.length > 1 ? params.map(transform) : params[0],
    );
  }

  queryRuntimeApi<T>(serialized: TSerializedRuntimeApiQuery): Promise<T> {
    const { params } = serialized;
    const { module, method } = this.convertToDedotCall(serialized);
    return this.api.call[module][method](...params.map(transform));
  }

  callBatchMethod(calls: TDedotExtrinsic[], mode: BatchMode) {
    const method = mode === BatchMode.BATCH_ALL ? "batchAll" : "batch";
    return this.api.tx.utility[method](calls.map(({ call }) => call));
  }

  callDispatchAsMethod(
    { call }: TDedotExtrinsic,
    address: string,
  ): TDedotExtrinsic {
    return this.api.tx.utility.dispatchAs(
      {
        type: "System",
        value: {
          type: "Signed",
          value: address,
        },
      },
      call,
    );
  }

  objectToHex(obj: unknown, typeName: string) {
    const $XcmVersionedXcm = findCodecByType(this.api.registry, typeName);
    const transformedXcm = transform(obj);
    const hex = u8aToHex($XcmVersionedXcm.tryEncode(transformedXcm));
    return Promise.resolve(hex.toString());
  }

  hexToUint8a(hex: string) {
    return hexToU8a(hex);
  }

  stringToUint8a(str: string) {
    return stringToU8a(str);
  }

  async getPaymentInfo(
    tx: TDedotExtrinsic,
    address: string,
  ): Promise<TPaymentInfo> {
    return tx.paymentInfo(address);
  }

  getEvmStorage(contract: string, slot: string): Promise<string> {
    return this.api.query.evm.accountStorages(contract, slot);
  }

  getMethod(tx: TDedotExtrinsic): string {
    return lowercaseFirstLetter(tx.call.palletCall.name);
  }

  getTypeThenAssetCount(tx: TDedotExtrinsic): number | undefined {
    const method = this.getMethod(tx);
    if (method !== "transferAssetsUsingTypeAndThen") return undefined;
    const assets = tx.call?.palletCall?.params?.assets;
    if (assets && Array.isArray(assets.value)) {
      return assets.value.length;
    }
    return undefined;
  }

  hasMethod(pallet: TPallet, method: string): Promise<boolean> {
    const palletFormatted = lowercaseFirstLetter(pallet);
    const methodFormatted = snakeToCamel(method);
    return Promise.resolve(
      this.api.tx[palletFormatted]?.[methodFormatted] !== undefined,
    );
  }

  async getFromRpc(module: string, method: string, key: string) {
    const rpcModule = (this.api.rpc as any)[`${module}_${method}`];
    if (!rpcModule || !rpcModule(key)) {
      throw new UnsupportedOperationError(
        `RPC method ${module}.${method} not available`,
      );
    }
    return await rpcModule(key);
  }

  blake2AsHex(data: Uint8Array) {
    return blake2AsHex(data);
  }

  clone() {
    return new DedotApi(isConfig(this._config) ? this._config : undefined);
  }

  async createApiForChain(chain: TSubstrateChain) {
    const api = new DedotApi(isConfig(this._config) ? this._config : undefined);
    await api.init(chain);
    return api;
  }

  resolveDefaultFeeAsset({
    chain,
    feeAsset,
  }: TDryRunCallBaseOptions<TDedotExtrinsic>) {
    return feeAsset ?? findNativeAssetInfoOrThrow(chain);
  }

  async resolveFeeAsset(options: TDryRunCallBaseOptions<TDedotExtrinsic>) {
    const { chain, address } = options;

    if (!chain.startsWith("Hydration")) {
      return {
        isCustomAsset: false,
        asset: this.resolveDefaultFeeAsset(options),
      };
    }

    const assetId =
      await this.api.query.multiTransactionPayment.accountCurrencyMap(address);

    if (assetId === null || assetId === undefined) {
      return {
        isCustomAsset: false,
        asset: this.resolveDefaultFeeAsset(options),
      };
    }

    return {
      isCustomAsset: true,
      asset: findAssetInfoOrThrow(chain, { id: assetId }),
    };
  }

  async getDryRunCall(
    options: TDryRunCallBaseOptions<TDedotExtrinsic>,
  ): Promise<TDryRunChainResult> {
    const {
      tx,
      address,
      feeAsset,
      chain,
      destination,
      version,
      useRootOrigin = false,
      bypassOptions,
    } = options;

    const { supportsDryRunApi } = getAssetsObject(chain);

    if (!supportsDryRunApi) {
      throw new RuntimeApiUnavailableError(chain, "DryRunApi");
    }

    const basePayload = {
      type: "System",
      value: useRootOrigin
        ? { type: "Root" }
        : { type: "Signed", value: address },
    };

    const resolvedTx = useRootOrigin
      ? await wrapTxBypass<TDedotApi, TDedotExtrinsic, TDedotSigner>(
          {
            ...options,
            api: this,
          },
          bypassOptions,
        )
      : tx;

    let resolvedFeeAsset = await this.resolveFeeAsset(options);

    const performDryRunCall = (includeVersion: boolean) => {
      const versionNum = Number(version.charAt(1));
      return this.api.call.dryRunApi.dryRunCall(
        basePayload,
        resolvedTx.call,
        ...(includeVersion ? [versionNum] : []),
      );
    };

    const findFailingEventInResult = (res: any) =>
      res?.value?.emittedEvents?.find(
        (event: any) =>
          event.pallet === "Utility" &&
          event.palletEvent?.name === "DispatchedAs" &&
          event.palletEvent?.data?.result?.isErr === true,
      );

    const getExecutionSuccessFromResult = (result: any): boolean => {
      const errorInEvents = findFailingEventInResult(result);
      if (result?.isOk) {
        const execResult = result?.value?.executionResult;
        if (execResult?.isOk) return !errorInEvents;
      }
      return (
        Boolean(result?.isOk && result.value.executionResult?.isOk) &&
        !errorInEvents
      );
    };

    const extractFailureReasonFromResult = (result: any): TDryRunError => {
      const execResult = result?.value?.executionResult;
      const execErr = execResult?.value ?? execResult?.err;

      if (execErr?.error) {
        const modErr = execErr.error?.value;
        if (modErr) {
          return resolveModuleError(chain, modErr as TModuleError);
        }
        const otherErr = execErr.error?.Other ?? execErr.error?.other;
        if (otherErr) {
          return { failureReason: String(otherErr) };
        }
        if (typeof execErr.error === "string") {
          return { failureReason: execErr.error };
        }
        return { failureReason: JSON.stringify(execErr.error) };
      }

      const erroredEvent = findFailingEventInResult(result);
      if (erroredEvent) {
        const eventResult = erroredEvent.palletEvent.data.result;
        const err = eventResult?.err ?? eventResult?.value;
        if (err?.type) {
          const subErr = err.value;
          if (subErr) {
            return resolveModuleError(chain, subErr as TModuleError);
          }
          return { failureReason: err.type };
        }
      }

      return { failureReason: JSON.stringify(result ?? "Unknown error") };
    };

    // Attempt 1: WITHOUT version
    let result: any;
    let isSuccess = false;
    let failureErr: TDryRunError = { failureReason: "" };
    let shouldRetryWithVersion = false;

    try {
      result = await performDryRunCall(false);
      isSuccess = getExecutionSuccessFromResult(result);

      if (!isSuccess) {
        failureErr = extractFailureReasonFromResult(result);
        if (failureErr.failureReason === "VersionedConversionFailed") {
          shouldRetryWithVersion = true;
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("Expected 3 parameters")) {
        shouldRetryWithVersion = true;
      } else {
        return {
          success: false,
          failureReason: msg,
          asset: resolvedFeeAsset.asset,
        };
      }
    }

    // Attempt 2: WITH version (only if needed)
    if (shouldRetryWithVersion) {
      try {
        result = await performDryRunCall(true);
        isSuccess = getExecutionSuccessFromResult(result);
        if (!isSuccess) {
          failureErr = extractFailureReasonFromResult(result);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        failureErr = failureErr || { failureReason: msg };
        return {
          success: false,
          failureReason: failureErr.failureReason,
          failureSubReason: failureErr.failureSubReason,
          asset: resolvedFeeAsset.asset,
        };
      }
    }

    if (!isSuccess) {
      return {
        success: false,
        failureReason: failureErr.failureReason || "Unknown error",
        failureSubReason: failureErr.failureSubReason,
        asset: resolvedFeeAsset.asset,
      };
    }

    const resValue = result?.value;
    const execRes = resValue?.executionResult?.value;

    const forwardedXcms =
      result.value.forwardedXcms.length > 0
        ? result.value.forwardedXcms[0]
        : [];

    const actualWeight = execRes?.actualWeight ?? execRes?.actual_weight;

    const weight: TWeight | undefined = actualWeight ? actualWeight : undefined;

    const destParaId = this.extractDestParaId(forwardedXcms);

    const localXcm = resValue?.localXcm;

    const USE_XCM_PAYMENT_API_CHAINS: TSubstrateChain[] = ["Astar"];

    if (
      (hasXcmPaymentApiSupport(chain) &&
        localXcm &&
        (feeAsset ||
          USE_XCM_PAYMENT_API_CHAINS.includes(chain) ||
          (chain.startsWith("AssetHub") && destination === "Ethereum"))) ||
      resolvedFeeAsset.isCustomAsset
    ) {
      const overriddenWeight = !localXcm
        ? (await this.getPaymentInfo(tx, address)).weight
        : undefined;

      const xcmFee = await this.getXcmPaymentApiFee(
        chain,
        localXcm,
        forwardedXcms,
        resolvedFeeAsset.asset,
        version,
        false,
        overriddenWeight,
      );

      if (typeof xcmFee === "bigint") {
        return {
          success: true,
          fee: xcmFee,
          asset: resolvedFeeAsset.asset,
          weight,
          forwardedXcms,
          destParaId,
        };
      } else {
        resolvedFeeAsset = {
          isCustomAsset: false,
          asset: this.resolveDefaultFeeAsset(options),
        };
      }
    }

    const { partialFee: executionFee } = await this.getPaymentInfo(tx, address);

    const fee = computeOriginFee(result, chain, executionFee);

    return {
      success: true,
      fee,
      asset: resolvedFeeAsset.asset,
      weight,
      forwardedXcms,
      destParaId,
    };
  }

  async getXcmPaymentApiFee(
    chain: TSubstrateChain,
    localXcm: any,
    forwardedXcm: any,
    asset: TAssetInfo,
    version: Version,
    transformXcm = false,
    overridenWeight?: TWeight,
  ): Promise<bigint> {
    const transformedXcm = transformXcm ? transform(localXcm) : localXcm;

    const queryWeight = async () => {
      const weightRes =
        await this.api.call.xcmPaymentApi.queryXcmWeight(transformedXcm);
      return weightRes.value;
    };

    const weight = overridenWeight ? overridenWeight : await queryWeight();

    const assetLocalizedLoc = localizeLocation(chain, asset.location);

    const assetId = createAssetId(version, assetLocalizedLoc);
    const transformedAssetId = transform(addXcmVersionHeader(assetId, version));

    const execFeeRes = await this.api.call.xcmPaymentApi.queryWeightToAssetFee(
      weight,
      transformedAssetId,
    );

    let execFee = typeof execFeeRes?.value === "bigint" ? execFeeRes.value : 0n;

    if (
      chain.startsWith("BridgeHub") &&
      execFeeRes?.success === false &&
      execFeeRes?.value?.type === "AssetNotFound"
    ) {
      const bridgeHubExecFee = await this.getBridgeHubFallbackExecFee(
        chain,
        weight,
        asset,
        version,
      );

      if (typeof bridgeHubExecFee === "bigint") {
        execFee = bridgeHubExecFee;
      }
    }

    const deliveryFee = await this.getDeliveryFee(
      chain,
      forwardedXcm,
      asset,
      assetLocalizedLoc,
      version,
    );

    return execFee + deliveryFee;
  }

  async getDeliveryFee(
    chain: TSubstrateChain,
    forwardedXcm: any[],
    asset: TAssetInfo,
    assetLocalizedLoc: TLocation,
    version: Version,
  ): Promise<bigint> {
    let usedThirdParam = false;
    let deliveryFeeRes: any;

    if (forwardedXcm.length > 0) {
      const baseArgs = [forwardedXcm[0], forwardedXcm[1][0]];

      try {
        deliveryFeeRes = await this.api.call.xcmPaymentApi.queryDeliveryFees(
          ...baseArgs,
        );
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);

        if (message.includes("Expected 3 parameters")) {
          usedThirdParam = true;
          const assetId = createAssetId(version, assetLocalizedLoc);
          const versionedAssetLoc = transform(
            addXcmVersionHeader(assetId, version),
          );
          deliveryFeeRes = await this.api.call.xcmPaymentApi.queryDeliveryFees(
            ...baseArgs,
            versionedAssetLoc,
          );
        } else {
          throw e;
        }
      }
    }

    const assets = deliveryFeeRes?.value?.value;
    const deliveryFeeResolved =
      deliveryFeeRes && assets?.length > 0 ? (assets[0]?.fun?.value ?? 0n) : 0n;

    const nativeAsset = findNativeAssetInfoOrThrow(chain);

    if (isAssetXcEqual(asset, nativeAsset) || usedThirdParam) {
      return deliveryFeeResolved;
    }

    try {
      const res = await this.queryRuntimeApi<bigint | undefined>({
        module: "AssetConversionApi",
        method: "quote_price_exact_tokens_for_tokens",
        params: [
          localizeLocation(chain, nativeAsset.location),
          assetLocalizedLoc,
          deliveryFeeResolved,
          false,
        ],
      });

      return res ?? 0n;
    } catch (_e) {
      return 0n;
    }
  }

  async getBridgeHubFallbackExecFee(
    chain: TSubstrateChain,
    weightValue: any,
    asset: TAssetInfo,
    version: Version,
  ): Promise<bigint | undefined> {
    const fallbackExecFeeRes =
      await this.api.call.xcmPaymentApi.queryWeightToAssetFee(
        weightValue,
        addXcmVersionHeader(RELAY_LOCATION, version),
      );

    const fallbackOk = fallbackExecFeeRes?.value;

    const fallbackExecFee =
      typeof fallbackOk === "bigint"
        ? fallbackOk
        : typeof fallbackOk === "string" || typeof fallbackOk === "number"
          ? BigInt(fallbackOk)
          : undefined;

    if (fallbackExecFee === undefined) {
      return undefined;
    }

    const ahApi = this.clone();
    const assetHubChain =
      `AssetHub${getRelayChainOf(chain)}` as TSubstrateChain;

    await ahApi.init(assetHubChain);

    const ahLocalizedLoc = localizeLocation(assetHubChain, asset.location);

    const convertedExecFee = await ahApi.queryRuntimeApi<bigint | undefined>({
      module: "AssetConversionApi",
      method: "quote_price_exact_tokens_for_tokens",
      params: [RELAY_LOCATION, ahLocalizedLoc, fallbackExecFee, false],
    });

    if (typeof convertedExecFee === "bigint") {
      return convertedExecFee;
    }

    return undefined;
  }

  async getXcmWeight(xcm: any): Promise<TWeight> {
    const result = await this.api.call.xcmPaymentApi.queryXcmWeight(
      !xcm.type ? transform(xcm) : xcm,
    );
    const okValue = result?.value;
    return {
      refTime: BigInt(okValue?.refTime ?? 0),
      proofSize: BigInt(okValue?.proofSize ?? 0),
    };
  }

  extractDestParaId(forwardedXcms: any[]): number | undefined {
    const first = forwardedXcms[0];
    const interior = first?.value?.interior;

    return forwardedXcms.length === 0
      ? undefined
      : interior?.type === "Here"
        ? 0
        : (interior?.value?.[0]?.value ?? interior?.value?.value);
  }

  async getDryRunXcm({
    originLocation,
    xcm,
    asset,
    chain,
    version,
  }: TDryRunXcmBaseOptions<TDedotExtrinsic>): Promise<TDryRunChainResult> {
    const { supportsDryRunApi } = getAssetsObject(chain);

    if (!supportsDryRunApi) {
      throw new RuntimeApiUnavailableError(chain, "DryRunApi");
    }

    const transformedOriginLocation = transform(originLocation);

    const result = await this.api.call.dryRunApi.dryRunXcm(
      transformedOriginLocation,
      xcm,
    );

    const executionResult = result?.value?.executionResult;

    const isSuccess = result.isOk && executionResult.type === "Complete";
    if (!isSuccess) {
      return {
        success: false,
        failureReason: extractDryRunXcmFailureReason(result),
        asset,
      };
    }

    const actualWeight = executionResult.value.used;

    const weight: TWeight | undefined = actualWeight ? actualWeight : undefined;

    const forwardedXcms =
      result.value.forwardedXcms.length > 0
        ? result.value.forwardedXcms[0]
        : [];

    const destParaId = this.extractDestParaId(forwardedXcms);

    if (hasXcmPaymentApiSupport(chain)) {
      const fee = await this.getXcmPaymentApiFee(
        chain,
        xcm,
        forwardedXcms,
        asset,
        version,
      );

      if (typeof fee !== "bigint") {
        return {
          success: false,
          failureReason: "Failed to retrieve fee from XcmPaymentApi",
          asset,
        };
      }

      return {
        success: true,
        fee,
        asset,
        weight,
        forwardedXcms,
        destParaId,
      };
    }

    return {
      success: false,
      failureReason:
        "Cannot determine destination fee. XcmPaymentApi is not supported by this chain",
      asset,
    };
  }

  async getBridgeStatus() {
    const outboundOperatingMode =
      await this.api.query.ethereumOutboundQueue.operatingMode();
    return outboundOperatingMode as TBridgeStatus;
  }

  disconnect(force = false) {
    if (!this._chain) return Promise.resolve();
    if (!force && !this.disconnectAllowed) return Promise.resolve();

    const api = isConfig(this._config)
      ? this._config.apiOverrides?.[this._chain]
      : this._config;

    // Own client provided, destroy only if force true
    if (force && typeof api === "object") {
      void this.api.disconnect();
    }

    // Client created automatically
    if (typeof api === "string" || Array.isArray(api) || api === undefined) {
      if (force) {
        void this.api.disconnect();
      } else {
        const key = api === undefined ? getChainProviders(this._chain) : api;
        releaseClient(key);
      }
    }

    return Promise.resolve();
  }

  validateSubstrateAddress(address: string): boolean {
    try {
      decodeAddress(address);
      return true;
    } catch {
      return false;
    }
  }

  deriveAddress(sender: TSender<TDedotSigner>): string {
    if (isSenderSigner(sender)) return sender.address;
    const { address } = createKeyringPair(sender);
    return address;
  }

  async signAndSubmit(
    tx: TDedotExtrinsic,
    sender: TSender<TDedotSigner>,
  ): Promise<string> {
    const account = isSenderSigner(sender) ? sender : createKeyringPair(sender);
    return await tx.signAndSend(account);
  }

  async signAndSubmitFinalized(
    tx: TDedotExtrinsic,
    sender: TSender<TDedotSigner>,
  ): Promise<string> {
    const account = isSenderSigner(sender) ? sender : createKeyringPair(sender);
    const result = await tx.signAndSend(account).untilFinalized();
    return result.txHash;
  }
}

export default DedotApi;
