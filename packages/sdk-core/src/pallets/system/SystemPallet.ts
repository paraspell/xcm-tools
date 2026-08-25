import type { TAssetInfo, WithAmount } from '@paraspell/assets'

import type { PolkadotApi } from '../../api'
import { UnsupportedOperationError } from '../../errors'
import { BaseAssetsPallet, type TSetBalanceRes } from '../../types/TAssets'

export class SystemPallet extends BaseAssetsPallet {
  mint<TApi, TRes, TSigner, TCustomChain extends string = never>(
    _api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    _address: string,
    _assetInfo: WithAmount<TAssetInfo>,
    _balance: bigint
  ): Promise<TSetBalanceRes> {
    throw new UnsupportedOperationError('System pallet does not support minting.')
  }

  async getBalance<TApi, TRes, TSigner, TCustomChain extends string = never>(
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    address: string,
    asset: TAssetInfo
  ): Promise<bigint> {
    const account = await api.queryState<{
      data: { free: bigint; reserved: bigint; frozen: bigint }
    }>({
      module: this.palletName,
      method: 'Account',
      params: [address]
    })

    if (account?.data === undefined) return 0n

    const free = BigInt(account.data.free)
    const reserved = BigInt(account.data.reserved)
    const frozen = BigInt(account.data.frozen)
    const ed = BigInt(asset.existentialDeposit ?? 0)

    const frozenUntouchable = frozen - reserved
    const untouchable = frozenUntouchable > ed ? frozenUntouchable : ed
    const spendable = free - untouchable

    return spendable > 0n ? spendable : 0n
  }
}
