import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import type { TAssetsPallet } from '@paraspell/pallets'

import type { PolkadotApi } from '../api'
import type Chain from '../chains/Chain'
import type { TSerializedExtrinsics } from './TTransfer'

export type TSetBalanceRes = {
  assetStatusTx?: TSerializedExtrinsics
  balanceTx: TSerializedExtrinsics
}

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
}
