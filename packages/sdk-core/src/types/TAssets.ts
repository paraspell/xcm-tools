import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import type { TAssetsPallet } from '@paraspell/pallets'
import type { TSubstrateChain } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../api'
import type { TSerializedExtrinsics } from './TTransfer'

export type TSetBalanceRes = {
  assetStatusTx?: TSerializedExtrinsics
  balanceTx: TSerializedExtrinsics
}

export abstract class BaseAssetsPallet {
  constructor(protected palletName: TAssetsPallet) {}

  abstract mint<TApi, TRes>(
    address: string,
    assetInfo: WithAmount<TAssetInfo>,
    balance: bigint,
    chain: TSubstrateChain,
    api: IPolkadotApi<TApi, TRes>
  ): Promise<TSetBalanceRes>

  abstract getBalance<TApi, TRes>(
    api: IPolkadotApi<TApi, TRes>,
    address: string,
    asset: TAssetInfo,
    customCurrencyId?: unknown
  ): Promise<bigint>
}
