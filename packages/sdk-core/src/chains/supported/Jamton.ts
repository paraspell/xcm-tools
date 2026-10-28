// Contains detailed structure of XCM call construction for Jamton Parachain

import { bytesToHex } from '@noble/hashes/utils.js'
import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import { isAssetEqual } from '@paraspell/assets'
import { replaceBigInt, Version } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type {
  IPolkadotXCMTransfer,
  TMintConfig,
  TPolkadotXCMTransferOptions,
  TSetBalanceRes,
  TTransferLocalOptions
} from '../../types'
import { blake2128Concat, toLeHex } from '../../utils'
import { getLocalTransferAmount } from '../../utils/transfer'
import SubstrateChain from '../SubstrateChain'

const HERCULIS_GOLD_BALANCES_PREFIX =
  'b5288313a908b05b8e6dc4c999b69de9c2261276cc9d1f8598ea4b6a74b15c2f'

class Jamton<TApi, TRes, TSigner, TCustomChain extends string = never>
  extends SubstrateChain<TApi, TRes, TSigner, TCustomChain>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner, TCustomChain>
{
  constructor() {
    super('Jamton', 'jamton', 'Polkadot', Version.V4)
  }

  getCustomCurrencyId(_api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>, asset: TAssetInfo) {
    const assetId = Number(asset.assetId)
    return asset.isNative ? { Native: assetId } : { ForeignAsset: assetId }
  }

  protected getLocalCurrencyId(
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    asset: TAssetInfo
  ) {
    return this.getCustomCurrencyId(api, asset)
  }

  protected getMintConfig(): TMintConfig {
    return { useCustomCurrencyId: true }
  }

  transferPolkadotXCM(
    input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner, TCustomChain>
  ): Promise<TRes> {
    const { assetInfo, scenario, destination } = input

    if (assetInfo.isNative) return transferPolkadotXcm(input)

    if (scenario === 'ParaToPara' && destination !== 'AssetHubPolkadot') {
      throw new ScenarioNotSupportedError(
        `Transfer from ${this.chain} to ${JSON.stringify(destination, replaceBigInt)} is not yet supported`
      )
    }

    return transferPolkadotXcm(input)
  }

  transferLocalNonNativeAsset(
    options: TTransferLocalOptions<TApi, TRes, TSigner, TCustomChain>
  ): TRes {
    const { api, assetInfo: asset, recipient } = options

    if (!this.isHerculisGoldAsset(api, asset)) return super.transferLocalNonNativeAsset(options)

    return api.deserializeExtrinsics({
      module: 'Currencies',
      method: 'transfer',
      params: {
        dest: { Id: recipient },
        currency_id: this.getCustomCurrencyId(api, asset),
        amount: getLocalTransferAmount(options)
      }
    })
  }

  async getBalanceForeign(
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    address: string,
    asset: TAssetInfo
  ): Promise<bigint> {
    if (!this.isHerculisGoldAsset(api, asset)) return super.getBalanceForeign(api, address, asset)

    const balance = await api.queryRuntimeApi<bigint>({
      module: 'Currencies',
      method: 'free_balance',
      params: [this.getCustomCurrencyId(api, asset), address]
    })

    return BigInt(balance)
  }

  mint(
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    address: string,
    assetInfo: WithAmount<TAssetInfo>,
    balance: bigint
  ): Promise<TSetBalanceRes> {
    if (!this.isHerculisGoldAsset(api, assetInfo))
      return super.mint(api, address, assetInfo, balance)

    const accountKey = blake2128Concat(bytesToHex(api.accountToUint8a(address)))

    return Promise.resolve({
      balanceTx: {
        module: 'System',
        method: 'set_storage',
        params: {
          items: [
            [
              '0x' + HERCULIS_GOLD_BALANCES_PREFIX + accountKey,
              '0x' + toLeHex(balance + assetInfo.amount, 16)
            ]
          ]
        }
      }
    })
  }

  private isHerculisGoldAsset(
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    asset: TAssetInfo
  ) {
    return asset.isNative && !isAssetEqual(asset, api.findNativeAssetInfoOrThrow(this.chain))
  }
}

export default Jamton
