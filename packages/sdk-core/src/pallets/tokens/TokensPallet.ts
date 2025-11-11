import {
  findAssetInfoOrThrow,
  isForeignAsset,
  type TAssetInfo,
  type WithAmount
} from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'

import { BaseAssetsPallet, type TSetBalanceRes } from '../../types/TAssets'
import { assertHasId, getChain } from '../../utils'

const resolveId = (asset: TAssetInfo, chain: TSubstrateChain) => {
  if (chain === 'BifrostPolkadot' || chain === 'BifrostKusama' || chain === 'BifrostPaseo') {
    const isEthAsset = isForeignAsset(asset) && asset.assetId?.startsWith('0x')

    const resolvedAsset =
      isEthAsset && asset.location
        ? findAssetInfoOrThrow(chain, { location: asset.location }, null)
        : asset

    return getChain(chain).getCurrencySelection(resolvedAsset)
  } else {
    assertHasId(asset)
    return asset.assetId
  }
}

export class TokensPallet extends BaseAssetsPallet {
  mint(
    address: string,
    asset: WithAmount<TAssetInfo>,
    balance: bigint,
    chain: TSubstrateChain
  ): Promise<TSetBalanceRes> {
    const isBifrost = chain.startsWith('Bifrost')

    if (!isBifrost) assertHasId(asset)

    const id = resolveId(asset, chain)

    const { amount } = asset

    return Promise.resolve({
      balanceTx: {
        module: this.palletName,
        method: 'set_balance',
        parameters: {
          who: { Id: address },
          currency_id: id,
          new_free: balance + amount,
          new_reserved: 0n
        }
      }
    })
  }
}
