import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'
import { concat, getAddress, keccak256, pad, toHex } from 'viem'

import type { IPolkadotApi } from '../../api'
import { BaseAssetsPallet, type TSetBalanceRes } from '../../types/TAssets'
import { assertHasId, formatAssetIdToERC20 } from '../../utils'

const SIZE = 32
const BALANCE_SLOT = 0

const calculateMappingSlot = (key: string) => {
  const normalizedKey = getAddress(key)
  const keyPadded = pad(normalizedKey, { size: SIZE })
  const slotHex = pad(toHex(BALANCE_SLOT), { size: SIZE })
  const encoded = concat([keyPadded, slotHex])
  return keccak256(encoded)
}

export class SystemPallet extends BaseAssetsPallet {
  async mint<TApi, TRes>(
    address: string,
    assetInfo: WithAmount<TAssetInfo>,
    balance: bigint,
    _chain: TSubstrateChain,
    api: IPolkadotApi<TApi, TRes>
  ): Promise<TSetBalanceRes> {
    assertHasId(assetInfo)
    const contractAddr = formatAssetIdToERC20(assetInfo.assetId)
    const slot = calculateMappingSlot(address)
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

  async getBalance<TApi, TRes>(api: IPolkadotApi<TApi, TRes>, address: string): Promise<bigint> {
    const balance = await api.queryState<{ data: { free: bigint } }>({
      module: this.palletName,
      method: 'Account',
      params: [address]
    })
    const value = balance?.data?.free
    return value !== undefined ? BigInt(value) : 0n
  }
}
