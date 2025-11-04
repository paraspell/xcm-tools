// Contains detailed structure of XCM call construction for Hydration Parachain

import {
  findAssetInfoOrThrow,
  getNativeAssetSymbol,
  InvalidCurrencyError,
  isSymbolMatch
} from '@paraspell/assets'
import type { TParachain, TRelaychain } from '@paraspell/sdk-common'
import { hasJunction, Parents, Version } from '@paraspell/sdk-common'

import { DOT_LOCATION } from '../../constants'
import { ScenarioNotSupportedError } from '../../errors'
import { createVersionedDestination } from '../../pallets/xcmPallet/utils'
import { transferXTokens } from '../../pallets/xTokens'
import type {
  IPolkadotXCMTransfer,
  TPolkadotXCMTransferOptions,
  TSendInternalOptions,
  TSerializedApiCall,
  TTransferLocalOptions
} from '../../types'
import { type IXTokensTransfer, type TXTokensTransferOptions } from '../../types'
import { assertHasId, assertHasLocation, createAsset, createBeneficiaryLocation } from '../../utils'
import { handleExecuteTransfer } from '../../utils/transfer'
import { getParaId } from '../config'
import Parachain from '../Parachain'

const createCustomXcmAh = <TApi, TRes>(
  { api, address }: TPolkadotXCMTransferOptions<TApi, TRes>,
  version: Version
) => ({
  [version]: [
    {
      DepositAsset: {
        assets: { Wild: { AllCounted: 2 } },
        beneficiary: createBeneficiaryLocation({
          api,
          address: address,
          version
        })
      }
    }
  ]
})

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

  transferToAssetHub<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): TRes {
    const { api, assetInfo: asset, version, destination } = input

    const call: TSerializedApiCall = {
      module: 'PolkadotXcm',
      method: 'transfer_assets_using_type_and_then',
      parameters: {
        dest: createVersionedDestination(
          version,
          this.chain,
          destination,
          getParaId('AssetHubPolkadot')
        ),
        assets: {
          [version]: [createAsset(version, asset.amount, DOT_LOCATION)]
        },
        assets_transfer_type: 'DestinationReserve',
        remote_fees_id: {
          [version]: {
            parents: Parents.ONE,
            interior: 'Here'
          }
        },
        fees_transfer_type: 'DestinationReserve',
        custom_xcm_on_dest: createCustomXcmAh(input, version),
        weight_limit: 'Unlimited'
      }
    }

    return api.callTxMethod(call)
  }

  async transferPolkadotXCM<TApi, TRes>(
    input: TPolkadotXCMTransferOptions<TApi, TRes>
  ): Promise<TRes> {
    const {
      api,
      destination,
      scenario,
      feeAssetInfo: feeAsset,
      assetInfo: asset,
      overriddenAsset
    } = input

    if (destination === 'Ethereum') {
      //Temporarily disabled
      //return this.transferToEthereum(input)
      throw new ScenarioNotSupportedError(
        this.chain,
        scenario,
        'Snowbridge is temporarily disabled.'
      )
    }

    if (feeAsset) {
      if (overriddenAsset) {
        throw new InvalidCurrencyError('Cannot use overridden assets with XCM execute')
      }

      const isNativeAsset = isSymbolMatch(asset.symbol, this.getNativeAssetSymbol())
      const isNativeFeeAsset = isSymbolMatch(feeAsset.symbol, this.getNativeAssetSymbol())

      if (!isNativeAsset || !isNativeFeeAsset) {
        return api.callTxMethod(await handleExecuteTransfer(this.chain, input))
      }
    }

    return this.transferToAssetHub(input)
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

    return (
      destination !== 'Ethereum' &&
      !(destination === 'AssetHubPolkadot' && assetInfo.symbol === 'DOT') &&
      baseCanUseXTokens &&
      !feeAsset
    )
  }

  transferLocalNativeAsset(options: TTransferLocalOptions<TApi, TRes>): Promise<TRes> {
    const { api, assetInfo: asset, address, isAmountAll } = options

    if (isAmountAll) {
      return Promise.resolve(
        api.callTxMethod({
          module: 'Balances',
          method: 'transfer_all',
          parameters: {
            dest: address,
            keep_alive: false
          }
        })
      )
    }

    return Promise.resolve(
      api.callTxMethod({
        module: 'Balances',
        method: 'transfer_keep_alive',
        parameters: {
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
      return api.callTxMethod({
        module: 'Tokens',
        method: 'transfer_all',
        parameters: {
          dest: address,
          currency_id: currencyId,
          keep_alive: false
        }
      })
    }

    return api.callTxMethod({
      module: 'Tokens',
      method: 'transfer',
      parameters: {
        dest: address,
        currency_id: currencyId,
        amount: asset.amount
      }
    })
  }
}

export default Hydration
