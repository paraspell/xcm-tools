import type { TAssetInfo, TCurrencyCore } from '@paraspell/assets'
import {
  findAssetInfo,
  findAssetInfoOrThrow,
  getNativeAssetSymbol,
  isForeignAsset,
  isSymbolMatch,
  Native
} from '@paraspell/assets'
import type { TAssetsPallet } from '@paraspell/pallets'
import { getNativeAssetsPallet, getOtherAssetsPallets } from '@paraspell/pallets'
import type { TSubstrateChain } from '@paraspell/sdk-common'
import { Parents } from '@paraspell/sdk-common'
import { parseUnits } from 'viem'

import type { IPolkadotApi } from '../../api'
import { getPalletInstance } from '../../pallets'
import { BatchMode } from '../../types'
import type { TSetBalanceRes } from '../../types/TAssets'

const MINT_AMOUNT = 1000n // Mint 1000 units of asset

const pickOtherPallet = (asset: TAssetInfo, pallets: TAssetsPallet[]) => {
  if (isForeignAsset(asset) && asset.assetId === undefined) {
    // No assetId means it's probably a ForeignAssets pallet asset
    return pallets.find(pallet => pallet.startsWith('Foreign')) ?? pallets[0]
  }
  return pallets[0]
}

const createMintTxs = (
  chain: TSubstrateChain,
  asset: TAssetInfo,
  address: string
): TSetBalanceRes => {
  const nativePallet = getNativeAssetsPallet(chain)
  const otherPallets = getOtherAssetsPallets(chain)
  const isMainNativeAsset = isSymbolMatch(asset.symbol, getNativeAssetSymbol(chain))
  const pallet =
    isForeignAsset(asset) || !isMainNativeAsset
      ? pickOtherPallet(asset, otherPallets)
      : nativePallet

  const palletInstance = getPalletInstance(pallet)
  return palletInstance.setBalance(
    address,
    {
      ...asset,
      amount: parseUnits(MINT_AMOUNT.toString(), asset.decimals)
    },
    chain
  )
}

const createRequiredMintTxs = (
  chain: TSubstrateChain,
  currency: TCurrencyCore,
  address: string
) => {
  const asset = findAssetInfoOrThrow(chain, currency, null)
  return createMintTxs(chain, asset, address)
}

const createOptionalMintTxs = (
  chain: TSubstrateChain,
  currency: TCurrencyCore,
  address: string
) => {
  const asset = findAssetInfo(chain, currency, null)
  if (!asset) return null
  return createMintTxs(chain, asset, address)
}

const resultToExtrinsics = <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>,
  address: string,
  { assetStatusTx, balanceTx }: TSetBalanceRes
): TRes[] => {
  return [
    ...(assetStatusTx ? [api.callTxMethod(assetStatusTx)] : []),
    ...(assetStatusTx
      ? [api.callDispatchAsMethod(api.callTxMethod(balanceTx), address)]
      : [api.callTxMethod(balanceTx)])
  ]
}

export const wrapTxBypass = <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>,
  chain: TSubstrateChain,
  asset: TAssetInfo,
  feeAsset: TAssetInfo | undefined,
  address: string,
  tx: TRes
) => {
  const mintNativeAssetRes = createRequiredMintTxs(
    chain,
    { symbol: Native(getNativeAssetSymbol(chain)) },
    address
  )

  const mintRelayAssetRes = createOptionalMintTxs(
    chain,
    { location: { parents: Parents.ONE, interior: { Here: null } } },
    address
  )

  // mint fee asset if exists
  let mintFeeAssetRes: TSetBalanceRes | undefined
  if (feeAsset) {
    mintFeeAssetRes = createMintTxs(chain, feeAsset, address)
  }

  // mint asset that is being sent
  const mintAssetRes = createMintTxs(chain, asset, address)

  return api.callBatchMethod(
    [
      ...[mintNativeAssetRes, mintRelayAssetRes, mintFeeAssetRes, mintAssetRes].flatMap(tx =>
        tx ? resultToExtrinsics(api, address, tx) : []
      ),
      api.callDispatchAsMethod(tx, address)
    ],
    BatchMode.BATCH_ALL
  )
}
