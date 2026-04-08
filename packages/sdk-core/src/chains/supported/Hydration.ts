// Contains detailed structure of XCM call construction for Hydration Parachain

import {
  findAssetInfoOrThrow,
  getNativeAssetSymbol,
  InvalidCurrencyError,
  isSymbolMatch
} from '@paraspell/assets'
import type { TParachain, TRelaychain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import { isMoonbeamWhAsset } from '../../transfer/utils/inferFeeAsset'
import type {
  IPolkadotXCMTransfer,
  TPolkadotXCMTransferOptions,
  TTransferLocalOptions
} from '../../types'
import { assertHasId, createAsset, handleExecuteTransfer } from '../../utils'
import Chain from '../Chain'

class Hydration<TApi, TRes, TSigner>
  extends Chain<TApi, TRes, TSigner>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner>
{
  constructor(
    chain: TParachain = 'Hydration',
    info: string = 'hydradx',
    ecosystem: TRelaychain = 'Polkadot',
    version: Version = Version.V5
  ) {
    super(chain, info, ecosystem, version)
  }

  async transferPolkadotXCM(
    input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>
  ): Promise<TRes> {
    const { destination, assetInfo: asset, feeAssetInfo: feeAsset, overriddenAsset, api } = input

    if (destination === 'Ethereum') {
      return this.transferToEthereum(input)
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

    if (isMoonbeamWhAsset(asset.location) && destination === 'Moonbeam') {
      return this.transferMoonbeamWhAsset(input)
    }

    return transferPolkadotXcm(input)
  }

  transferMoonbeamWhAsset<TApi, TRes, TSigner>(
    input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>
  ): Promise<TRes> {
    const { assetInfo, version } = input

    const glmr = findAssetInfoOrThrow(this.chain, { symbol: getNativeAssetSymbol('Moonbeam') })
    const FEE_AMOUNT = 150000000000000000n // 0.15 GLMR

    return transferPolkadotXcm({
      ...input,
      overriddenAsset: [
        { ...createAsset(version, FEE_AMOUNT, glmr.location), isFeeAsset: true },
        createAsset(version, assetInfo.amount, assetInfo.location)
      ]
    })
  }

  transferLocalNativeAsset(options: TTransferLocalOptions<TApi, TRes, TSigner>): Promise<TRes> {
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

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes, TSigner>): TRes {
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
