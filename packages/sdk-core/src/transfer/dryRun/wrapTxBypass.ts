import type { TAssetInfo, TCurrencyCore, WithAmount } from '@paraspell/assets'
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

const createMintTxs = <TApi, TRes>(
  chain: TSubstrateChain,
  asset: WithAmount<TAssetInfo>,
  address: string,
  api: IPolkadotApi<TApi, TRes>
): Promise<TSetBalanceRes> => {
  const nativePallet = getNativeAssetsPallet(chain)
  const otherPallets = getOtherAssetsPallets(chain)
  const isMainNativeAsset = isSymbolMatch(asset.symbol, getNativeAssetSymbol(chain))
  const pallet =
    isForeignAsset(asset) || !isMainNativeAsset
      ? pickOtherPallet(asset, otherPallets)
      : nativePallet

  const palletInstance = getPalletInstance(pallet)
  return palletInstance.setBalance(address, asset, chain, api)
}

const createRequiredMintTxs = <TApi, TRes>(
  chain: TSubstrateChain,
  currency: TCurrencyCore,
  amountHuman: bigint,
  address: string,
  api: IPolkadotApi<TApi, TRes>
) => {
  const asset = findAssetInfoOrThrow(chain, currency, null)
  const amount = parseUnits(amountHuman.toString(), asset.decimals)
  return createMintTxs(chain, { ...asset, amount }, address, api)
}

const createOptionalMintTxs = <TApi, TRes>(
  chain: TSubstrateChain,
  currency: TCurrencyCore,
  amountHuman: bigint,
  address: string,
  api: IPolkadotApi<TApi, TRes>
) => {
  const asset = findAssetInfo(chain, currency, null)
  if (!asset) return null
  const amount = parseUnits(amountHuman.toString(), asset.decimals)
  return createMintTxs(chain, { ...asset, amount }, address, api)
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

export const wrapTxBypass = async <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>,
  chain: TSubstrateChain,
  asset: WithAmount<TAssetInfo>,
  feeAsset: TAssetInfo | undefined,
  address: string,
  tx: TRes
) => {
  const mintNativeAssetRes = await createRequiredMintTxs(
    chain,
    { symbol: Native(getNativeAssetSymbol(chain)) },
    MINT_AMOUNT,
    address,
    api
  )

  const mintRelayAssetRes = await createOptionalMintTxs(
    chain,
    { location: { parents: Parents.ONE, interior: { Here: null } } },
    MINT_AMOUNT,
    address,
    api
  )

  // mint fee asset if exists
  let mintFeeAssetRes: TSetBalanceRes | undefined
  if (feeAsset) {
    const amount = parseUnits(MINT_AMOUNT.toString(), feeAsset.decimals)
    mintFeeAssetRes = await createMintTxs(chain, { ...feeAsset, amount }, address, api)
  }

  // mint asset that is being sent
  const mintAmount = parseUnits(MINT_AMOUNT.toString(), asset.decimals)
  const mintAssetRes = await createMintTxs(
    chain,
    { ...asset, amount: asset.amount + mintAmount },
    address,
    api
  )

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
