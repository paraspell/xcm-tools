import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import type { TAssetsPallet } from '@paraspell/pallets'
import type { TChain, TLocation } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../api'
import type Chain from '../chains/Chain'
import { UnsupportedOperationError } from '../errors'
import type { TSerializedExtrinsics } from './TTransfer'

export type TSetBalanceRes = {
  assetStatusTx?: TSerializedExtrinsics
  balanceTx: TSerializedExtrinsics
}

export type TChainAssetInfo<TCustomChain extends string = never> = {
  chain: TChain | TCustomChain
  asset: TAssetInfo
}

export type TAssetState = {
  isSufficient: boolean
}

export type TPalletAssetId = number | bigint | TLocation

export type TMintConfig = {
  useIdPrefix?: boolean
  useLocationId?: boolean
  useBigIntId?: boolean
  useCustomCurrencyId?: boolean
}

export abstract class BaseAssetsPallet {
  constructor(protected palletName: TAssetsPallet) {}

  abstract mint<TApi, TRes, TSigner, TCustomChain extends string = never>(
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    address: string,
    assetInfo: WithAmount<TAssetInfo>,
    balance: bigint,
    chain: Chain<TApi, TRes, TSigner, TCustomChain>
  ): Promise<TSetBalanceRes>

  abstract getBalance<TApi, TRes, TSigner, TCustomChain extends string = never>(
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    address: string,
    asset: TAssetInfo,
    customCurrencyId?: unknown
  ): Promise<bigint>

  getAssetState<TApi, TRes, TSigner, TCustomChain extends string = never>(
    _api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    _asset: TAssetInfo
  ): Promise<TAssetState | undefined> {
    throw new UnsupportedOperationError(
      `getAssetState is not implemented for ${this.palletName} pallet`
    )
  }
}
