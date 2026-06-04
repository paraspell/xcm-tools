import type { TAssetInfo, TChainAssetsInfo, TCurrencyInput } from '@paraspell/assets'
import {
  findAssetInfoImpl,
  findAssetInfoOnDestImpl,
  findAssetInfoOrThrowImpl,
  findAssetOnDestOrThrowImpl,
  findNativeAssetInfoImpl,
  findNativeAssetInfoOrThrowImpl,
  getAssetsImpl,
  getAssetsObjectImpl,
  getNativeAssetsImpl,
  getNativeAssetSymbolImpl,
  getOtherAssetsImpl,
  getRelayChainSymbolImpl,
  hasDryRunSupportImpl,
  hasXcmPaymentApiSupportImpl,
  isChainEvmImpl,
  isSymbolMatch,
  normalizeCustomAssets
} from '@paraspell/assets'
import type { TPallet, TPalletEntry } from '@paraspell/pallets'
import type { TChain, TSubstrateChain, Version } from '@paraspell/sdk-common'
import { isCustomChain, isExternalChain } from '@paraspell/sdk-common'

import {
  buildCustomChainAssetsInfo,
  normalizeCustomChains,
  resolveCustomChainAssetPallets
} from '../chains/customChains'
import { DEFAULT_TTL_MS } from '../constants'
import {
  ApiNotInitializedError,
  CustomChainInvalidError,
  UnsupportedOperationError
} from '../errors'
import type {
  BatchMode,
  TApiOrUrl,
  TApiType,
  TBridgeStatus,
  TBuilderOptions,
  TCustomChainEntryHydrated,
  TDestination,
  TDryRunCallBaseOptions,
  TDryRunChainResult,
  TDryRunXcmBaseOptions,
  TFullCustomCtx,
  TRuntimeApi,
  TSender,
  TSerializedExtrinsics,
  TSerializedRuntimeApiQuery,
  TSerializedStateQuery,
  TSystemProperties,
  TUrl,
  TWeight
} from '../types'
import { isConfig } from '../utils'
import { resolveChainApi } from './resolveChainApi'

export abstract class PolkadotApi<TApi, TRes, TSigner, TCustomChain extends string = never> {
  _api?: TApi
  _chain?: TSubstrateChain | TCustomChain
  readonly _config?: TBuilderOptions<TApiOrUrl<TApi>>
  _customCtx: TFullCustomCtx
  _ttlMs = DEFAULT_TTL_MS
  _disconnectAllowed = true
  abstract readonly type: TApiType

  constructor(config?: TBuilderOptions<TApiOrUrl<TApi>>) {
    this._config = config
    if (!isConfig(config)) {
      this._customCtx = {}
      return
    }
    this._customCtx = {
      customAssets: normalizeCustomAssets(config.customAssets),
      customChainAssets: {},
      customChains: normalizeCustomChains(config.customChains),
      customChainPallets: {}
    }
  }

  get api(): TApi {
    if (!this._api) {
      throw new ApiNotInitializedError()
    }
    return this._api
  }

  set disconnectAllowed(allowed: boolean) {
    this._disconnectAllowed = allowed
  }

  get disconnectAllowed() {
    return this._disconnectAllowed
  }

  get config() {
    return this._config
  }

  getAssetsObject(chain: TChain): TChainAssetsInfo {
    return getAssetsObjectImpl(chain, this._customCtx)
  }

  getAssets(chain: TChain): TAssetInfo[] {
    return getAssetsImpl(chain, this._customCtx)
  }

  getNativeAssets(chain: TChain): TAssetInfo[] {
    return getNativeAssetsImpl(chain, this._customCtx)
  }

  getOtherAssets(chain: TChain): TAssetInfo[] {
    return getOtherAssetsImpl(chain, this._customCtx)
  }

  findAssetInfo(
    chain: TChain | TCustomChain,
    currency: TCurrencyInput,
    destination?: TChain | null
  ): TAssetInfo | null {
    return findAssetInfoImpl(chain, currency, destination, this._customCtx)
  }

  findAssetInfoOrThrow(
    chain: TChain | TCustomChain,
    currency: TCurrencyInput,
    destination?: TChain | null
  ): TAssetInfo {
    return findAssetInfoOrThrowImpl(chain, currency, destination, this._customCtx)
  }

  findAssetInfoOnDest(
    origin: TChain | TCustomChain,
    destination: TChain,
    currency: TCurrencyInput,
    originAsset?: TAssetInfo | null
  ): TAssetInfo | null {
    return findAssetInfoOnDestImpl(origin, destination, currency, originAsset, this._customCtx)
  }

  findAssetOnDestOrThrow(
    origin: TChain,
    destination: TChain,
    currency: TCurrencyInput
  ): TAssetInfo {
    return findAssetOnDestOrThrowImpl(origin, destination, currency, this._customCtx)
  }

  findNativeAssetInfo(chain: TChain | TCustomChain): TAssetInfo | null {
    return findNativeAssetInfoImpl(chain, this._customCtx)
  }

  findNativeAssetInfoOrThrow(chain: TChain | TCustomChain): TAssetInfo {
    return findNativeAssetInfoOrThrowImpl(chain, this._customCtx)
  }

  isChainEvm(chain: TChain | TCustomChain): boolean {
    return isChainEvmImpl(chain, this._customCtx)
  }

  getNativeAssetSymbol(chain: TChain | TCustomChain): string {
    return getNativeAssetSymbolImpl(chain, this._customCtx)
  }

  getRelayChainSymbol(chain: TChain | TCustomChain): string {
    return getRelayChainSymbolImpl(chain, this._customCtx)
  }

  hasDryRunSupport(chain: TChain | TCustomChain): boolean {
    return hasDryRunSupportImpl(chain, this._customCtx)
  }

  hasXcmPaymentApiSupport(chain: TChain | TCustomChain): boolean {
    return hasXcmPaymentApiSupportImpl(chain, this._customCtx)
  }

  async init(
    chain: TChain | TCustomChain,
    clientTtlMs: number = DEFAULT_TTL_MS,
    destination?: TDestination
  ): Promise<void> {
    if (this._chain !== undefined || isExternalChain(chain)) {
      return
    }

    this._ttlMs = clientTtlMs
    this._chain = chain

    this._api = await resolveChainApi(
      this._config,
      chain,
      wsUrl => this.leaseClient(wsUrl, this._ttlMs),
      this._customCtx
    )

    await this.maybeHydrateCustomChain(chain)

    if (typeof destination === 'string' && isCustomChain(destination)) {
      await this.hydrateCustomChain(destination)
    }
  }

  setCustomCtx(ctx: TFullCustomCtx): void {
    this._customCtx = ctx
  }

  private async hydrateCustomChain(chain: TChain | TCustomChain): Promise<void> {
    if (!this._customCtx.customChains?.[chain] || this._customCtx.customChainAssets?.[chain]) {
      return
    }

    const childApi = this.clone()
    childApi.setCustomCtx(this._customCtx)
    await childApi.init(chain, this._ttlMs)
    this.setCustomCtx(childApi._customCtx)
  }

  abstract leaseClient(wsUrl: TUrl, ttlMs: number): Promise<TApi>
  abstract accountToHex(address: string, isPrefixed?: boolean): string
  abstract accountToUint8a(address: string): Uint8Array
  abstract deserializeExtrinsics(serialized: TSerializedExtrinsics): TRes
  abstract txFromHex(hex: string): Promise<TRes>
  abstract txToHex(tx: TRes): Promise<string>
  abstract encodeTx(hex: string): unknown
  abstract queryState<T>(serialized: TSerializedStateQuery): Promise<T>
  abstract queryRuntimeApi<T>(serialized: TSerializedRuntimeApiQuery): Promise<T>
  abstract callBatchMethod(calls: TRes[], mode: BatchMode): TRes
  abstract callDispatchAsMethod(call: TRes, address: string): TRes
  abstract objectToHex(obj: unknown, typeName: string, version: Version): Promise<string>
  abstract hexToUint8a(hex: string): Uint8Array
  abstract stringToUint8a(str: string): Uint8Array
  abstract getMethod(tx: TRes): string
  abstract getTypeThenAssetCount(tx: TRes): number | undefined
  abstract hasMethod(pallet: TPallet, method: string): Promise<boolean>
  abstract hasRuntimeApi(runtimeApi: TRuntimeApi): Promise<boolean>
  abstract fetchPalletList(): Promise<TPalletEntry[]>
  abstract isEvmChain(): Promise<boolean>
  abstract getPaymentInfo(
    tx: TRes,
    address: string
  ): Promise<{ partialFee: bigint; weight: TWeight }>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract getXcmWeight(xcm: any): Promise<TWeight>
  abstract getXcmPaymentApiFee(
    chain: TSubstrateChain,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    localXcm: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    forwardedXcm: any,
    asset: TAssetInfo,
    version: Version,
    transformXcm: boolean
  ): Promise<bigint>
  abstract getEvmStorage(contract: string, slot: string): Promise<string>
  abstract getFromRpc(module: string, method: string, key: string): Promise<string>
  abstract blake2AsHex(data: Uint8Array): string
  abstract clone(): PolkadotApi<TApi, TRes, TSigner, TCustomChain>
  abstract createApiForChain(
    chain: TSubstrateChain
  ): Promise<PolkadotApi<TApi, TRes, TSigner, TCustomChain>>
  abstract getDryRunCall(
    options: TDryRunCallBaseOptions<TRes, TCustomChain>
  ): Promise<TDryRunChainResult>
  abstract getDryRunXcm(
    options: TDryRunXcmBaseOptions<TRes, TCustomChain>
  ): Promise<TDryRunChainResult>
  abstract getBridgeStatus(): Promise<TBridgeStatus>
  abstract disconnect(force?: boolean): Promise<void>
  abstract validateSubstrateAddress(address: string): boolean
  abstract deriveAddress(path: string): string
  abstract deriveAddress(sender: TSender<TSigner>): string
  abstract signAndSubmit(tx: TRes, sender: TSender<TSigner>): Promise<string>
  abstract signAndSubmitFinalized(tx: TRes, sender: TSender<TSigner>): Promise<string>
  abstract getSystemProperties(): Promise<TSystemProperties>
  abstract getConstant<T = unknown>(pallet: string, name: string): Promise<T | undefined>

  private async getNativeExistentialDeposit(): Promise<bigint | undefined> {
    const ed = await this.getConstant<bigint>('Balances', 'ExistentialDeposit')
    return ed !== undefined ? BigInt(ed) : undefined
  }

  private async maybeHydrateCustomChain(chain: TChain | TCustomChain): Promise<void> {
    const entry = this._customCtx.customChains?.[chain]
    if (!entry) return

    const needsProps =
      entry.ss58Prefix === undefined ||
      entry.nativeAssetSymbol === undefined ||
      entry.nativeAssetDecimals === undefined
    if (needsProps) {
      const props = await this.getSystemProperties()
      if (entry.ss58Prefix === undefined && typeof props.ss58Format === 'number') {
        entry.ss58Prefix = props.ss58Format
      }
      if (entry.nativeAssetSymbol === undefined && props.tokenSymbol) {
        entry.nativeAssetSymbol = props.tokenSymbol
      }
      if (entry.nativeAssetDecimals === undefined && typeof props.tokenDecimals === 'number') {
        entry.nativeAssetDecimals = props.tokenDecimals
      }

      const declaredNativeAsset = entry.assets.find(asset => asset.isNative)
      if (
        declaredNativeAsset &&
        props.tokenSymbol &&
        !isSymbolMatch(declaredNativeAsset.symbol, props.tokenSymbol)
      ) {
        throw new CustomChainInvalidError(
          `Custom chain '${entry.name}' declares '${declaredNativeAsset.symbol}' as its native asset, ` +
            `but the chain's native asset is '${props.tokenSymbol}'.`
        )
      }
    }
    const [
      supportsDryRunApi,
      supportsXcmPaymentApi,
      isEVM,
      hasPolkadotXcm,
      hasXcmPallet,
      palletList,
      nativeExistentialDeposit
    ] = await Promise.all([
      this.hasRuntimeApi('DryRunApi'),
      this.hasRuntimeApi('XcmPaymentApi'),
      this.isEvmChain(),
      this.hasMethod('PolkadotXcm', 'send'),
      this.hasMethod('XcmPallet', 'send'),
      this.fetchPalletList(),
      this.getNativeExistentialDeposit()
    ])
    if (!hasPolkadotXcm && !hasXcmPallet) {
      throw new UnsupportedOperationError(
        `Custom chain '${entry.name}' does not expose a 'PolkadotXcm' or 'XcmPallet' pallet.`
      )
    }
    const xcmPallet = hasPolkadotXcm ? 'PolkadotXcm' : 'XcmPallet'
    const pallets = resolveCustomChainAssetPallets(entry.name, palletList, entry.pallets)
    const hydrated: TCustomChainEntryHydrated = {
      ...entry,
      xcmPallet,
      isEVM,
      supportsDryRunApi,
      supportsXcmPaymentApi,
      nativeExistentialDeposit:
        nativeExistentialDeposit !== undefined ? nativeExistentialDeposit.toString() : undefined,
      pallets
    }
    if (this._customCtx.customChainAssets) {
      this._customCtx.customChainAssets[chain] = buildCustomChainAssetsInfo(hydrated)
    }
    if (this._customCtx.customChainPallets) {
      this._customCtx.customChainPallets[chain] = pallets
    }
  }
}
