import type { TAssetInfo } from '@paraspell/assets'
import type { TPallet } from '@paraspell/pallets'
import type { TChain, TLocation, TSubstrateChain, Version } from '@paraspell/sdk-common'

import type {
  BatchMode,
  TApiOrUrl,
  TBridgeStatus,
  TBuilderOptions,
  TDryRunCallBaseOptions,
  TDryRunChainResult,
  TDryRunXcmBaseOptions,
  TSerializedExtrinsics,
  TSerializedRuntimeApiQuery,
  TSerializedStateQuery,
  TUrl,
  TWeight
} from '../types'

export interface IPolkadotApi<TApi, TRes> {
  getConfig(): TBuilderOptions<TApiOrUrl<TApi>> | undefined
  getApi(): TApi
  init(chain: TChain, clientTtlMs?: number): Promise<void>
  createApiInstance: (wsUrl: TUrl, chain: TSubstrateChain) => Promise<TApi>
  accountToHex(address: string, isPrefixed?: boolean): string
  accountToUint8a(address: string): Uint8Array
  deserializeExtrinsics(serialized: TSerializedExtrinsics): TRes
  txFromHex(hex: string): Promise<TRes>
  queryState<T>(serialized: TSerializedStateQuery): Promise<T>
  queryRuntimeApi<T>(serialized: TSerializedRuntimeApiQuery): Promise<T>
  callBatchMethod(calls: TRes[], mode: BatchMode): TRes
  callDispatchAsMethod(call: TRes, address: string): TRes
  objectToHex(obj: unknown, typeName: string, version: Version): Promise<string>
  hexToUint8a(hex: string): Uint8Array
  stringToUint8a(str: string): Uint8Array
  getMethod(tx: TRes): string
  getTypeThenAssetCount(tx: TRes): number | undefined
  hasMethod(pallet: TPallet, method: string): Promise<boolean>
  getPaymentInfo(tx: TRes, address: string): Promise<{ partialFee: bigint; weight: TWeight }>
  quoteAhPrice(
    fromMl: TLocation,
    toMl: TLocation,
    amountIn: bigint,
    includeFee?: boolean
  ): Promise<bigint | undefined>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getXcmWeight(xcm: any): Promise<TWeight>
  getXcmPaymentApiFee(
    chain: TSubstrateChain,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    localXcm: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    forwardedXcm: any,
    asset: TAssetInfo,
    version: Version,
    transformXcm: boolean
  ): Promise<bigint>
  getEvmStorage(contract: string, slot: string): Promise<string>
  getFromRpc(module: string, method: string, key: string): Promise<string>
  blake2AsHex(data: Uint8Array): string
  clone(): IPolkadotApi<TApi, TRes>
  createApiForChain(chain: TSubstrateChain): Promise<IPolkadotApi<TApi, TRes>>
  getDryRunCall(options: TDryRunCallBaseOptions<TRes>): Promise<TDryRunChainResult>
  getDryRunXcm(options: TDryRunXcmBaseOptions<TRes>): Promise<TDryRunChainResult>
  getBridgeStatus(): Promise<TBridgeStatus>
  setDisconnectAllowed(allowed: boolean): void
  getDisconnectAllowed(): boolean
  disconnect(force?: boolean): Promise<void>
  validateSubstrateAddress(address: string): boolean
  deriveAddress(path: string): string
  signAndSubmit(tx: TRes, path: string): Promise<string>
}
