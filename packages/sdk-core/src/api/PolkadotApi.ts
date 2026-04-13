import type { TAssetInfo } from '@paraspell/assets'
import type { TPallet } from '@paraspell/pallets'
import type { TChain, TLocation, TSubstrateChain, Version } from '@paraspell/sdk-common'

import { DEFAULT_TTL_MS } from '../constants'
import { ApiNotInitializedError } from '../errors'
import type {
  BatchMode,
  TApiOrUrl,
  TApiType,
  TBridgeStatus,
  TBuilderOptions,
  TDryRunCallBaseOptions,
  TDryRunChainResult,
  TDryRunXcmBaseOptions,
  TSender,
  TSerializedExtrinsics,
  TSerializedRuntimeApiQuery,
  TSerializedStateQuery,
  TUrl,
  TWeight
} from '../types'

export abstract class PolkadotApi<TApi, TRes, TSigner> {
  _api?: TApi
  _chain?: TSubstrateChain
  readonly _config?: TBuilderOptions<TApiOrUrl<TApi>>
  _ttlMs = DEFAULT_TTL_MS
  _disconnectAllowed = true
  public abstract readonly type: TApiType

  constructor(config?: TBuilderOptions<TApiOrUrl<TApi>>) {
    this._config = config
  }

  public get api(): TApi {
    if (!this._api) {
      throw new ApiNotInitializedError()
    }
    return this._api
  }

  public set disconnectAllowed(allowed: boolean) {
    this._disconnectAllowed = allowed
  }

  public get disconnectAllowed() {
    return this._disconnectAllowed
  }

  public get config() {
    return this._config
  }

  abstract init(chain: TChain, clientTtlMs?: number): Promise<void>
  // TODO: Remove after release
  abstract createApiInstance(wsUrl: TUrl, chain: TSubstrateChain): Promise<TApi>
  abstract accountToHex(address: string, isPrefixed?: boolean): string
  abstract accountToUint8a(address: string): Uint8Array
  abstract deserializeExtrinsics(serialized: TSerializedExtrinsics): TRes
  abstract txFromHex(hex: string): Promise<TRes>
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
  abstract getPaymentInfo(
    tx: TRes,
    address: string
  ): Promise<{ partialFee: bigint; weight: TWeight }>
  abstract quoteAhPrice(
    fromMl: TLocation,
    toMl: TLocation,
    amountIn: bigint,
    includeFee?: boolean
  ): Promise<bigint | undefined>
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
  abstract clone(): PolkadotApi<TApi, TRes, TSigner>
  abstract createApiForChain(chain: TSubstrateChain): Promise<PolkadotApi<TApi, TRes, TSigner>>
  abstract getDryRunCall(options: TDryRunCallBaseOptions<TRes>): Promise<TDryRunChainResult>
  abstract getDryRunXcm(options: TDryRunXcmBaseOptions<TRes>): Promise<TDryRunChainResult>
  abstract getBridgeStatus(): Promise<TBridgeStatus>
  abstract disconnect(force?: boolean): Promise<void>
  abstract validateSubstrateAddress(address: string): boolean
  abstract deriveAddress(path: string): string
  abstract deriveAddress(sender: TSender<TSigner>): string
  abstract signAndSubmit(tx: TRes, sender: TSender<TSigner>): Promise<string>
  abstract signAndSubmitFinalized(tx: TRes, sender: TSender<TSigner>): Promise<string>
}
