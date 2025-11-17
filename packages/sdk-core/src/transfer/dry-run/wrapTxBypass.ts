import type { TAssetInfo, TCurrencyCore, WithAmount } from '@paraspell/assets'
import {
  findAssetInfo,
  findNativeAssetInfo,
  findNativeAssetInfoOrThrow,
  getNativeAssetSymbol,
  isAssetXcEqual,
  isForeignAsset,
  isSymbolMatch
} from '@paraspell/assets'
import type { TAssetsPallet } from '@paraspell/pallets'
import { getNativeAssetsPallet, getOtherAssetsPallets } from '@paraspell/pallets'
import type { TSubstrateChain } from '@paraspell/sdk-common'
import { Parents } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../../api'
import { getAssetBalanceInternal } from '../../balance'
import { BYPASS_MINT_AMOUNT } from '../../constants'
import { getPalletInstance } from '../../pallets'
import type { TBypassOptions, TDryRunBypassOptions } from '../../types'
import { BatchMode } from '../../types'
import type { TSetBalanceRes } from '../../types/TAssets'
import { parseUnits } from '../../utils/unit'

const pickOtherPallet = (asset: TAssetInfo, pallets: TAssetsPallet[]) => {
  if (isForeignAsset(asset) && (!asset.assetId || asset.assetId.startsWith('0x'))) {
    // No assetId means it's probably a ForeignAssets pallet asset
    return pallets.find(pallet => pallet.startsWith('Foreign')) ?? pallets[0]
  }
  return pallets[0]
}

const createMintTxs = <TApi, TRes>(
  chain: TSubstrateChain,
  asset: WithAmount<TAssetInfo>,
  balance: bigint,
  address: string,
  api: IPolkadotApi<TApi, TRes>
): Promise<TSetBalanceRes> => {
  const nativePallet = getNativeAssetsPallet(chain)
  const otherPallets = getOtherAssetsPallets(chain)
  const isMainNativeAsset = isSymbolMatch(asset.symbol, getNativeAssetSymbol(chain))
  const pallet =
    (isForeignAsset(asset) && chain !== 'Mythos') || !isMainNativeAsset
      ? pickOtherPallet(asset, otherPallets)
      : nativePallet

  const palletInstance = getPalletInstance(pallet)
  return palletInstance.mint(address, asset, balance, chain, api)
}

const createRequiredMintTxs = <TApi, TRes>(
  chain: TSubstrateChain,
  asset: TAssetInfo,
  amountHuman: string,
  balance: bigint,
  address: string,
  api: IPolkadotApi<TApi, TRes>
) => {
  const amount = parseUnits(amountHuman, asset.decimals)
  return createMintTxs(chain, { ...asset, amount }, balance, address, api)
}

const createOptionalMintTxs = <TApi, TRes>(
  chain: TSubstrateChain,
  currency: TCurrencyCore,
  amountHuman: string,
  balance: bigint,
  address: string,
  api: IPolkadotApi<TApi, TRes>
) => {
  const asset = findAssetInfo(chain, currency, null)
  if (!asset) return null
  const amount = parseUnits(amountHuman, asset.decimals)
  return createMintTxs(chain, { ...asset, amount }, balance, address, api)
}

const resultToExtrinsics = <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>,
  address: string,
  { assetStatusTx, balanceTx }: TSetBalanceRes
): TRes[] => {
  return [
    ...(assetStatusTx ? [api.deserializeExtrinsics(assetStatusTx)] : []),
    ...(assetStatusTx
      ? [api.callDispatchAsMethod(api.deserializeExtrinsics(balanceTx), address)]
      : [api.deserializeExtrinsics(balanceTx)])
  ]
}

export const calcPreviewMintAmount = (balance: bigint, desired: bigint): bigint | null => {
  // Ensure mint amount is at least 2 to avoid Rust panic
  if (desired <= 0n) return null
  const missing = desired - balance
  return missing > 0n ? missing : null
}

const assetKey = (a: TAssetInfo) =>
  a.location
    ? JSON.stringify(a.location)
    : isForeignAsset(a) && a.assetId != null
      ? `id:${a.assetId}`
      : `sym:${a.symbol}`

const mintBonusForSent = (
  chain: TSubstrateChain,
  sent: TAssetInfo,
  feeAsset: TAssetInfo | undefined,
  mintFeeAssets: boolean
): bigint => {
  if (!mintFeeAssets) return 0n

  const native = findNativeAssetInfo(chain)
  const relay = findAssetInfo(
    chain,
    { location: { parents: Parents.ONE, interior: { Here: null } } },
    null
  )

  const seen = new Set<string>()
  const preminted = [native, relay, feeAsset]
    .filter((a): a is TAssetInfo => !!a)
    .filter(a => {
      const k = assetKey(a)
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })

  return preminted.some(a => isAssetXcEqual(a, sent))
    ? parseUnits(BYPASS_MINT_AMOUNT, sent.decimals)
    : 0n
}

export const wrapTxBypass = async <TApi, TRes>(
  dryRunOptions: TDryRunBypassOptions<TApi, TRes>,
  options: TBypassOptions = {
    mintFeeAssets: true,
    sentAssetMintMode: 'bypass'
  }
) => {
  const { api, chain, address, asset, feeAsset, tx } = dryRunOptions
  const { mintFeeAssets } = options

  const relayCurrency: TCurrencyCore = {
    location: { parents: Parents.ONE, interior: { Here: null } }
  }

  const nativeInfo = mintFeeAssets ? findNativeAssetInfo(chain) : null
  const relayInfo = mintFeeAssets ? findAssetInfo(chain, relayCurrency, null) : null
  const sameNativeRelay = !!(nativeInfo && relayInfo && isAssetXcEqual(nativeInfo, relayInfo))

  const mintNativeAssetRes = mintFeeAssets
    ? await createRequiredMintTxs(
        chain,
        findNativeAssetInfoOrThrow(chain),
        BYPASS_MINT_AMOUNT,
        0n,
        address,
        api
      )
    : null

  const mintRelayAssetRes =
    mintFeeAssets && !sameNativeRelay
      ? await createOptionalMintTxs(chain, relayCurrency, BYPASS_MINT_AMOUNT, 0n, address, api)
      : null

  // mint fee asset if exists
  let mintFeeAssetRes: TSetBalanceRes | undefined
  if (feeAsset && mintFeeAssets) {
    const amount = parseUnits(BYPASS_MINT_AMOUNT, feeAsset.decimals)
    mintFeeAssetRes = await createMintTxs(chain, { ...feeAsset, amount }, 0n, address, api)
  }

  const balance = await getAssetBalanceInternal({
    api,
    chain,
    address,
    asset
  })

  const bonus = mintBonusForSent(chain, asset, feeAsset, !!mintFeeAssets)

  let mintAmount: bigint | null
  if (options?.sentAssetMintMode === 'bypass') {
    mintAmount = parseUnits(BYPASS_MINT_AMOUNT, asset.decimals) + asset.amount
  } else {
    const missing = calcPreviewMintAmount(balance, asset.amount) ?? 0n
    const total = missing + bonus
    mintAmount = total > 0n ? total : null
  }

  // mint asset that is being sent
  const mintAssetRes =
    mintAmount !== null
      ? await createMintTxs(chain, { ...asset, amount: mintAmount }, balance, address, api)
      : null

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
