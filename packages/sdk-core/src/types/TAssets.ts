import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'

import type { TSerializedApiCall } from './TTransfer'

export type TSetBalanceRes = {
  assetStatusTx?: TSerializedApiCall
  balanceTx: TSerializedApiCall
}

export interface IAssetsPallet {
  setBalance(
    address: string,
    assetInfo: WithAmount<TAssetInfo>,
    chain: TSubstrateChain
  ): TSetBalanceRes
}
