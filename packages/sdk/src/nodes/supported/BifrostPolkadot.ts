// Contains detailed structure of XCM call construction for Bifrost Parachain on Polkadot

import { createCurrencySpec } from '../../pallets/xcmPallet/utils'
import { getAssetId } from '../../pallets/assets'
import type {
  IPolkadotXCMTransfer,
  PolkadotXCMTransferInput,
  TSendInternalOptions,
  TTransferReturn
} from '../../types'
import { type IXTokensTransfer, Parents, Version, type XTokensTransferInput } from '../../types'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../polkadotXcm'
import XTokensTransferImpl from '../xTokens'
import { ETHEREUM_JUNCTION } from '../../const'

export class BifrostPolkadot<TApi, TRes>
  extends ParachainNode<TApi, TRes>
  implements IXTokensTransfer, IPolkadotXCMTransfer
{
  constructor() {
    super('BifrostPolkadot', 'bifrost', 'polkadot', Version.V3)
  }

  private getCurrencySelection(currency: string, currencyId: string | undefined) {
    const nativeAssetSymbol = this.getNativeAssetSymbol()

    if (currency === nativeAssetSymbol) {
      return { Native: nativeAssetSymbol }
    }

    const isVToken = currency.startsWith('v')
    const isVSToken = currency.startsWith('vs')

    if (!currencyId) {
      return isVToken ? { VToken: currency.substring(1) } : { Token: currency }
    }

    const id = Number(currencyId)
    if (isVSToken) {
      return { VSToken2: id }
    }

    return isVToken ? { VToken2: id } : { Token2: id }
  }

  transferXTokens<TApi, TRes>(input: XTokensTransferInput<TApi, TRes>) {
    const { currency, currencyID } = input

    if (!currency) {
      throw new Error('Currency symbol is undefined')
    }

    const currencySelection = this.getCurrencySelection(currency, currencyID)
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }

  // Handles DOT, WETH transfers to AssetHubPolkadot
  transferPolkadotXCM<TApi, TRes>(
    input: PolkadotXCMTransferInput<TApi, TRes>
  ): Promise<TTransferReturn<TRes>> {
    const { amount, overridedCurrency, currencySymbol } = input

    return Promise.resolve(
      PolkadotXCMTransferImpl.transferPolkadotXCM(
        {
          ...input,
          currencySelection: createCurrencySpec(
            amount,
            this.version,
            currencySymbol === 'DOT' ? Parents.ONE : Parents.TWO,
            overridedCurrency,
            currencySymbol === 'WETH'
              ? {
                  X2: [
                    ETHEREUM_JUNCTION,
                    {
                      AccountKey20: { key: getAssetId('Ethereum', 'WETH') ?? '' }
                    }
                  ]
                }
              : undefined
          )
        },
        'transfer_assets',
        'Unlimited'
      )
    )
  }

  protected canUseXTokens({
    currencySymbol,
    destination
  }: TSendInternalOptions<TApi, TRes>): boolean {
    return (
      (currencySymbol !== 'WETH' && currencySymbol !== 'DOT') || destination !== 'AssetHubPolkadot'
    )
  }
}
