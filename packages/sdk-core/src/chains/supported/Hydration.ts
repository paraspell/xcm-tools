// Contains detailed structure of XCM call construction for Hydration Parachain

import { findAssetInfoOrThrow, getNativeAssetSymbol } from '@paraspell/assets'
import type { TParachain, TRelaychain } from '@paraspell/sdk-common'
import { hasJunction, Version } from '@paraspell/sdk-common'

import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type {
  IPolkadotXCMTransfer,
  TPolkadotXCMTransferOptions,
  TTransferLocalOptions
} from '../../types'
import { assertHasId, createAsset } from '../../utils'
import Chain from '../Chain'
import { getParaId } from '../config'

class Hydration<TApi, TRes, TSigner>
  extends Chain<TApi, TRes, TSigner>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner>
{
  constructor(
    chain: TParachain = 'Hydration',
    info: string = 'hydradx',
    ecosystem: TRelaychain = 'Polkadot',
    version: Version = Version.V4
  ) {
    super(chain, info, ecosystem, version)
  }

  async transferPolkadotXCM(
    input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>
  ): Promise<TRes> {
    const { destination, assetInfo: asset } = input

    if (destination === 'Ethereum') {
      return this.transferToEthereum(input)
    }

    const isMoonbeamWhAsset =
      hasJunction(asset.location, 'Parachain', getParaId('Moonbeam')) &&
      hasJunction(asset.location, 'PalletInstance', 110)

    if (isMoonbeamWhAsset && destination === 'Moonbeam') {
      return this.transferMoonbeamWhAsset(input)
    }

    return transferPolkadotXcm(input)
  }

  transferMoonbeamWhAsset<TApi, TRes, TSigner>(
    input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>
  ): Promise<TRes> {
    const { assetInfo, version } = input

    const glmr = findAssetInfoOrThrow(
      this.chain,
      { symbol: getNativeAssetSymbol('Moonbeam') },
      null
    )
    const FEE_AMOUNT = 80000000000000000n // 0.08 GLMR

    return transferPolkadotXcm({
      ...input,
      overriddenAsset: [
        { ...createAsset(version, FEE_AMOUNT, glmr.location), isFeeAsset: true },
        createAsset(version, assetInfo.amount, assetInfo.location)
      ]
    })
  }

  transferLocalNativeAsset(options: TTransferLocalOptions<TApi, TRes, TSigner>): Promise<TRes> {
    const { api, assetInfo: asset, address, isAmountAll, keepAlive } = options

    if (isAmountAll) {
      return Promise.resolve(
        api.deserializeExtrinsics({
          module: 'Balances',
          method: 'transfer_all',
          params: {
            dest: address,
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
          dest: address,
          value: asset.amount
        }
      })
    )
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes, TSigner>): TRes {
    const { api, assetInfo: asset, address, isAmountAll, keepAlive } = options

    assertHasId(asset)

    const currencyId = Number(asset.assetId)

    if (isAmountAll) {
      return api.deserializeExtrinsics({
        module: 'Tokens',
        method: 'transfer_all',
        params: {
          dest: address,
          currency_id: currencyId,
          keep_alive: keepAlive
        }
      })
    }

    return api.deserializeExtrinsics({
      module: 'Tokens',
      method: keepAlive ? 'transfer_keep_alive' : 'transfer',
      params: {
        dest: address,
        currency_id: currencyId,
        amount: asset.amount
      }
    })
  }
}

export default Hydration
