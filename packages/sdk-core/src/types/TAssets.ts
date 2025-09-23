import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import type { TPallet } from '@paraspell/pallets'
import type { TSubstrateChain } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../api'
import type { TSerializedApiCall } from './TTransfer'

export type TSetBalanceRes = {
  assetStatusTx?: TSerializedApiCall
  balanceTx: TSerializedApiCall
}

export abstract class BaseAssetsPallet {
  constructor(protected palletName: TPallet) {}
  abstract mint<TApi, TRes>(
    address: string,
    assetInfo: WithAmount<TAssetInfo>,
    balance: bigint,
    chain: TSubstrateChain,
    api: IPolkadotApi<TApi, TRes>
  ): Promise<TSetBalanceRes>
}
