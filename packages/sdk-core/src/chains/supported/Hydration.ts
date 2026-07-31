// Contains detailed structure of XCM call construction for Hydration Parachain

import { isAssetEqual } from '@paraspell/assets'
import type { TParachain, TRelaychain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type {
  IPolkadotXCMTransfer,
  TMintConfig,
  TPolkadotXCMTransferOptions,
  TTransferLocalOptions
} from '../../types'
import { assertHasId, handleExecuteTransfer } from '../../utils'
import SubstrateChain from '../SubstrateChain'

class Hydration<TApi, TRes, TSigner, TCustomChain extends string = never>
  extends SubstrateChain<TApi, TRes, TSigner, TCustomChain>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner, TCustomChain>
{
  constructor(
    chain: TParachain = 'Hydration',
    info: string = 'hydradx',
    ecosystem: TRelaychain = 'Polkadot',
    version: Version = Version.V5
  ) {
    super(chain, info, ecosystem, version)
  }

  protected getMintConfig(): TMintConfig {
    return { useIdPrefix: false }
  }

  shouldUseExecuteTransfer(
    input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner, TCustomChain>
  ): boolean {
    const { assetInfo: asset, feeAssetInfo: feeAsset, overriddenAsset, api } = input

    if (!feeAsset || overriddenAsset) return false

    const nativeAsset = api.findNativeAssetInfoOrThrow(this.chain)
    const isNativeAsset = isAssetEqual(nativeAsset, asset)
    const isNativeFeeAsset = isAssetEqual(nativeAsset, feeAsset)

    return !isNativeAsset || !isNativeFeeAsset
  }

  async transferPolkadotXCM(
    input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner, TCustomChain>
  ): Promise<TRes> {
    if (this.shouldUseExecuteTransfer(input)) {
      return input.api.deserializeExtrinsics(await handleExecuteTransfer(input))
    }

    return transferPolkadotXcm(input)
  }

  transferLocalNativeAsset(
    options: TTransferLocalOptions<TApi, TRes, TSigner, TCustomChain>
  ): Promise<TRes> {
    const { api, assetInfo: asset, recipient, isAmountAll, keepAlive } = options

    if (isAmountAll) {
      return Promise.resolve(
        api.deserializeExtrinsics({
          module: 'Balances',
          method: 'transfer_all',
          params: {
            dest: recipient,
            keep_alive: keepAlive
          }
        })
      )
    }

    return Promise.resolve(
      api.deserializeExtrinsics({
        module: 'Balances',
        method: keepAlive ? 'transfer_keep_alive' : 'transfer_allow_death',
        params: {
          dest: recipient,
          value: asset.amount
        }
      })
    )
  }

  transferLocalNonNativeAsset(
    options: TTransferLocalOptions<TApi, TRes, TSigner, TCustomChain>
  ): TRes {
    const { api, assetInfo: asset, recipient, isAmountAll, keepAlive } = options

    assertHasId(asset)

    const currencyId = Number(asset.assetId)

    if (isAmountAll) {
      return api.deserializeExtrinsics({
        module: 'Tokens',
        method: 'transfer_all',
        params: {
          dest: recipient,
          currency_id: currencyId,
          keep_alive: keepAlive
        }
      })
    }

    return api.deserializeExtrinsics({
      module: 'Tokens',
      method: keepAlive ? 'transfer_keep_alive' : 'transfer',
      params: {
        dest: recipient,
        currency_id: currencyId,
        amount: asset.amount
      }
    })
  }
}

export default Hydration
