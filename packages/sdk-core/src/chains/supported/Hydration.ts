// Contains detailed structure of XCM call construction for Hydration Parachain

import {
  findAssetInfoOrThrow,
  getNativeAssetSymbol,
  InvalidCurrencyError,
  isSymbolMatch
} from '@paraspell/assets'
import type { TParachain, TRelaychain } from '@paraspell/sdk-common'
import { deepEqual, hasJunction, Version } from '@paraspell/sdk-common'

import { AH_REQUIRES_FEE_ASSET_LOCS } from '../../constants'
import { transferXTokens } from '../../pallets/xTokens'
import { createTypeAndThenCall } from '../../transfer'
import type {
  IPolkadotXCMTransfer,
  TPolkadotXCMTransferOptions,
  TSendInternalOptions,
  TTransferLocalOptions
} from '../../types'
import { type IXTokensTransfer, type TXTokensTransferOptions } from '../../types'
import { assertHasId, assertHasLocation, createAsset } from '../../utils'
import { handleExecuteTransfer } from '../../utils/transfer'
import { getParaId } from '../config'
import Parachain from '../Parachain'

class Hydration<TApi, TRes>
  extends Parachain<TApi, TRes>
  implements IXTokensTransfer, IPolkadotXCMTransfer
{
  private static NATIVE_ASSET_ID = 0

  constructor(
    chain: TParachain = 'Hydration',
    info: string = 'hydradx',
    ecosystem: TRelaychain = 'Polkadot',
    version: Version = Version.V4
  ) {
    super(chain, info, ecosystem, version)
  }

  async transferPolkadotXCM<TApi, TRes>(
    input: TPolkadotXCMTransferOptions<TApi, TRes>
  ): Promise<TRes> {
    const { api, destination, feeAssetInfo: feeAsset, assetInfo: asset, overriddenAsset } = input

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
        return api.deserializeExtrinsics(await handleExecuteTransfer(this.chain, input))
      }
    }

    return api.deserializeExtrinsics(await createTypeAndThenCall(this.chain, input))
  }

  transferMoonbeamWhAsset<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>): TRes {
    const { asset, version } = input

    assertHasLocation(asset)

    const glmr = findAssetInfoOrThrow(
      this.chain,
      { symbol: getNativeAssetSymbol('Moonbeam') },
      null
    )
    const FEE_AMOUNT = 80000000000000000n // 0.08 GLMR

    assertHasLocation(glmr)

    return transferXTokens(
      {
        ...input,
        overriddenAsset: [
          { ...createAsset(version, FEE_AMOUNT, glmr.location), isFeeAsset: true },
          createAsset(version, asset.amount, asset.location)
        ]
      },
      Number(asset.assetId)
    )
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset, destination } = input

    if (asset.symbol === this.getNativeAssetSymbol()) {
      return transferXTokens(input, Hydration.NATIVE_ASSET_ID)
    }

    const isMoonbeamWhAsset =
      asset.location &&
      hasJunction(asset.location, 'Parachain', getParaId('Moonbeam')) &&
      hasJunction(asset.location, 'PalletInstance', 110)

    if (isMoonbeamWhAsset && destination === 'Moonbeam') {
      return this.transferMoonbeamWhAsset(input)
    }

    assertHasId(asset)

    return transferXTokens(input, Number(asset.assetId))
  }

  canUseXTokens(options: TSendInternalOptions<TApi, TRes>): boolean {
    const { to: destination, assetInfo, feeAsset } = options

    const baseCanUseXTokens = super.canUseXTokens(options)

    const requiresTypeThen = AH_REQUIRES_FEE_ASSET_LOCS.some(loc =>
      deepEqual(loc, assetInfo.location)
    )

    return (
      destination !== 'Ethereum' &&
      !(destination === 'AssetHubPolkadot' && assetInfo.symbol === 'DOT') &&
      baseCanUseXTokens &&
      !feeAsset &&
      !requiresTypeThen
    )
  }

  transferLocalNativeAsset(options: TTransferLocalOptions<TApi, TRes>): Promise<TRes> {
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

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
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
