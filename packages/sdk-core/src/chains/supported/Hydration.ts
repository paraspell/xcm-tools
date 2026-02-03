// Contains detailed structure of XCM call construction for Hydration Parachain

import {
  findAssetInfoOrThrow,
  getNativeAssetSymbol,
  InvalidCurrencyError,
  isSymbolMatch
} from '@paraspell/assets'
import type { TParachain, TRelaychain } from '@paraspell/sdk-common'
import { hasJunction, Version } from '@paraspell/sdk-common'

import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type {
  IPolkadotXCMTransfer,
  TPolkadotXCMTransferOptions,
  TTransferLocalOptions
} from '../../types'
import { assertHasId, assertHasLocation, createAsset } from '../../utils'
import { handleExecuteTransfer } from '../../utils/transfer'
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
    const { api, destination, feeAssetInfo: feeAsset, assetInfo: asset, overriddenAsset } = input

    if (destination === 'Ethereum') {
      return this.transferToEthereum(input)
    }

    const isMoonbeamWhAsset =
      asset.location &&
      hasJunction(asset.location, 'Parachain', getParaId('Moonbeam')) &&
      hasJunction(asset.location, 'PalletInstance', 110)

    if (isMoonbeamWhAsset && destination === 'Moonbeam') {
      return this.transferMoonbeamWhAsset(input)
    }

    if (feeAsset) {
      if (overriddenAsset) {
        throw new InvalidCurrencyError('Cannot use overridden assets with XCM execute')
      }

      const isNativeAsset = isSymbolMatch(asset.symbol, this.getNativeAssetSymbol())
      const isNativeFeeAsset = isSymbolMatch(feeAsset.symbol, this.getNativeAssetSymbol())

      if (!isNativeAsset || !isNativeFeeAsset) {
        return api.deserializeExtrinsics(await handleExecuteTransfer(input))
      }
    }

    return transferPolkadotXcm(input)
  }

  transferMoonbeamWhAsset<TApi, TRes, TSigner>(
    input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>
  ): Promise<TRes> {
    const { assetInfo, version } = input

    assertHasLocation(assetInfo)

    const glmr = findAssetInfoOrThrow(
      this.chain,
      { symbol: getNativeAssetSymbol('Moonbeam') },
      null
    )
    const FEE_AMOUNT = 80000000000000000n // 0.08 GLMR

    assertHasLocation(glmr)

    return transferPolkadotXcm({
      ...input,
      overriddenAsset: [
        { ...createAsset(version, FEE_AMOUNT, glmr.location), isFeeAsset: true },
        createAsset(version, assetInfo.amount, assetInfo.location)
      ]
    })
  }

  transferLocalNativeAsset(options: TTransferLocalOptions<TApi, TRes, TSigner>): Promise<TRes> {
    const { api, assetInfo: asset, address, isAmountAll } = options

    if (isAmountAll) {
      return Promise.resolve(
        api.deserializeExtrinsics({
          module: 'Balances',
          method: 'transfer_all',
          params: {
            dest: address,
            keep_alive: false
          }
        })
      )
    }

    return Promise.resolve(
      api.deserializeExtrinsics({
        module: 'Balances',
        method: 'transfer_keep_alive',
        params: {
          dest: address,
          value: asset.amount
        }
      })
    )
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes, TSigner>): TRes {
    const { api, assetInfo: asset, address, isAmountAll } = options

    assertHasId(asset)

    const currencyId = Number(asset.assetId)

    if (isAmountAll) {
      return api.deserializeExtrinsics({
        module: 'Tokens',
        method: 'transfer_all',
        params: {
          dest: address,
          currency_id: currencyId,
          keep_alive: false
        }
      })
    }

    return api.deserializeExtrinsics({
      module: 'Tokens',
      method: 'transfer',
      params: {
        dest: address,
        currency_id: currencyId,
        amount: asset.amount
      }
    })
  }
}

export default Hydration
