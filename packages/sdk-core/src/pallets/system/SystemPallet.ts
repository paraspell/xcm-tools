import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import { concat, getAddress, keccak256, pad, toHex } from 'viem'

import type { PolkadotApi } from '../../api'
import { BaseAssetsPallet, type TSetBalanceRes } from '../../types/TAssets'
import { assertHasId, formatAssetIdToERC20 } from '../../utils'

const SIZE = 32
const BALANCE_SLOT = 0
const BALANCE_SLOT_WORMHOLE = 5

const calculateMappingSlot = (key: string, assetId: string | undefined) => {
  const normalizedKey = getAddress(key)
  const keyPadded = pad(normalizedKey, { size: SIZE })
  const resolvedSlot = assetId?.startsWith('0x') ? BALANCE_SLOT_WORMHOLE : BALANCE_SLOT
  const slotHex = pad(toHex(resolvedSlot), { size: SIZE })
  const encoded = concat([keyPadded, slotHex])
  return keccak256(encoded)
}

export class SystemPallet extends BaseAssetsPallet {
  async mint<TApi, TRes, TSigner, TCustomChain extends string = never>(
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    address: string,
    assetInfo: WithAmount<TAssetInfo>,
    balance: bigint
  ): Promise<TSetBalanceRes> {
    assertHasId(assetInfo)
    const contractAddr = formatAssetIdToERC20(assetInfo.assetId)
    const slot = calculateMappingSlot(address, assetInfo.assetId)
    const amountEncoded = pad(toHex(assetInfo.amount + balance), { size: SIZE })

    const storageKey = await api.getEvmStorage(contractAddr, slot)

    return {
      balanceTx: {
        module: this.palletName,
        method: 'set_storage',
        params: {
          items: [[storageKey, amountEncoded]]
        }
      }
    }
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
