// Contains detailed structure of XCM call construction for Unique Parachain

import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'
import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { numberToBytes } from 'viem'

import type { PolkadotApi } from '../../api'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type {
  IPolkadotXCMTransfer,
  TPolkadotXCMTransferOptions,
  TTransferLocalOptions
} from '../../types'
import type { TSetBalanceRes } from '../../types/TAssets'
import { assertHasId, blake2128Concat } from '../../utils'
import { getLocalTransferAmount } from '../../utils/transfer'
import SubstrateChain from '../SubstrateChain'

const FUNGIBLE_ITEM_ID = 0

const FUNGIBLE_BALANCE_PREFIX = 'b6f8df5e96e2c932e9bd00274d53a26f4ea8ea0c01faa42b6eb344a85c47b387'
const FUNGIBLE_TOTAL_SUPPLY_PREFIX =
  'b6f8df5e96e2c932e9bd00274d53a26f5994cfda14cd67e1586647d40008abaa'
const SUBSTRATE_CROSS_ACCOUNT_PREFIX = '00'

const toLeHex = (value: number | bigint, size: number) =>
  bytesToHex(numberToBytes(value, { size }).reverse())

class Unique<TApi, TRes, TSigner, TCustomChain extends string = never>
  extends SubstrateChain<TApi, TRes, TSigner, TCustomChain>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner, TCustomChain>
{
  constructor() {
    super('Unique', 'unique', 'Polkadot', Version.V5)
  }

  transferPolkadotXCM(
    input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner, TCustomChain>
  ): Promise<TRes> {
    return transferPolkadotXcm(input)
  }

  transferLocalNonNativeAsset(
    options: TTransferLocalOptions<TApi, TRes, TSigner, TCustomChain>
  ): TRes {
    const { api, assetInfo: asset, recipient } = options

    assertHasId(asset)

    const amount = getLocalTransferAmount(options)

    return api.deserializeExtrinsics({
      module: 'Unique',
      method: 'transfer',
      params: {
        recipient: { Substrate: recipient },
        collection_id: Number(asset.assetId),
        item_id: FUNGIBLE_ITEM_ID,
        value: amount
      }
    })
  }

  async getBalanceForeign(
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    address: string,
    asset: TAssetInfo
  ): Promise<bigint> {
    assertHasId(asset)

    const balance = await api.queryRuntimeApi<{ success: boolean; value: bigint; ok: bigint }>({
      module: 'UniqueApi',
      method: 'balance',
      params: [Number(asset.assetId), { Substrate: address }, FUNGIBLE_ITEM_ID]
    })

    return balance?.value ?? (balance?.ok != undefined ? BigInt(balance.ok) : undefined) ?? 0n
  }

  mint(
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    address: string,
    assetInfo: WithAmount<TAssetInfo>,
    balance: bigint
  ): Promise<TSetBalanceRes> {
    if (assetInfo.isNative) return super.mint(api, address, assetInfo, balance)

    assertHasId(assetInfo)

    const collectionId = toLeHex(Number(assetInfo.assetId), 4)
    const collectionKey = api.xxhashAsHex(hexToBytes(collectionId)).slice(2) + collectionId
    const accountKey = blake2128Concat(
      SUBSTRATE_CROSS_ACCOUNT_PREFIX + bytesToHex(api.accountToUint8a(address))
    )
    const value = '0x' + toLeHex(balance + assetInfo.amount, 16)

    return Promise.resolve({
      balanceTx: {
        module: 'System',
        method: 'set_storage',
        params: {
          items: [
            ['0x' + FUNGIBLE_BALANCE_PREFIX + collectionKey + accountKey, value],
            ['0x' + FUNGIBLE_TOTAL_SUPPLY_PREFIX + collectionKey, value]
          ]
        }
      }
    })
  }
}

export default Unique
