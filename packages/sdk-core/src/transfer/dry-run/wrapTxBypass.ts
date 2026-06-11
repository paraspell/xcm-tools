import type { TAssetInfo, TCurrencyCore, WithAmount } from '@paraspell/assets'
import { getNativeAssetSymbolImpl, isAssetXcEqual, isSymbolMatch } from '@paraspell/assets'
import type { TAssetsPallet } from '@paraspell/pallets'
import { getNativeAssetsPallet, getOtherAssetsPallets } from '@paraspell/pallets'
import type { TSubstrateChain } from '@paraspell/sdk-common'
import { Parents } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { getAssetBalanceInternal } from '../../balance'
import {
  BYPASS_MINT_AMOUNT,
  HIGH_BYPASS_MINT_AMOUNT,
  HIGH_BYPASS_MINT_CHAINS
} from '../../constants'
import { getPalletInstance } from '../../pallets'
import type { TBypassOptions, TDryRunBypassOptions } from '../../types'
import { BatchMode } from '../../types'
import type { TSetBalanceRes } from '../../types/TAssets'
import { parseUnits } from '../../utils/unit'

const resolveBypassMintAmount = <TCustomChain extends string = never>(
  chain: TSubstrateChain | TCustomChain
): string =>
  HIGH_BYPASS_MINT_CHAINS.some(c => c === chain) ? HIGH_BYPASS_MINT_AMOUNT : BYPASS_MINT_AMOUNT

const pickOtherPallet = (asset: TAssetInfo, pallets: TAssetsPallet[]) => {
  if (!asset.isNative && (!asset.assetId || asset.assetId.startsWith('0x'))) {
    // No assetId means it's probably a ForeignAssets pallet asset
    return pallets.find(pallet => pallet.startsWith('Foreign')) ?? pallets[0]
  }
  return pallets[0]
}

const createMintTxs = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  chain: TSubstrateChain | TCustomChain,
  asset: WithAmount<TAssetInfo>,
  balance: bigint,
  address: string,
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>
): Promise<TSetBalanceRes> => {
  const nativePallet = getNativeAssetsPallet(chain, api._customCtx)
  const otherPallets = getOtherAssetsPallets(chain, api._customCtx)
  const isMainNativeAsset = isSymbolMatch(
    asset.symbol,
    getNativeAssetSymbolImpl(chain, api._customCtx)
  )
  const pallet =
    (!asset.isNative && chain !== 'Mythos') || !isMainNativeAsset
      ? pickOtherPallet(asset, otherPallets)
      : nativePallet

  const palletInstance = getPalletInstance(pallet)
  return palletInstance.mint(api, address, asset, balance, chain)
}

const createRequiredMintTxs = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  chain: TSubstrateChain | TCustomChain,
  asset: TAssetInfo,
  amountHuman: string,
  balance: bigint,
  address: string,
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>
) => {
  const amount = parseUnits(amountHuman, asset.decimals)
  return createMintTxs(chain, { ...asset, amount }, balance, address, api)
}

const createOptionalMintTxs = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  chain: TSubstrateChain | TCustomChain,
  currency: TCurrencyCore,
  amountHuman: string,
  balance: bigint,
  address: string,
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>
) => {
  const asset = api.findAssetInfo(chain, currency)
  if (!asset) return null
  const amount = parseUnits(amountHuman, asset.decimals)
  return createMintTxs(chain, { ...asset, amount }, balance, address, api)
}

const resultToExtrinsics = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
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

const mintBonusForSent = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  chain: TSubstrateChain | TCustomChain,
  sent: TAssetInfo,
  feeAsset: TAssetInfo | undefined,
  mintFeeAssets: boolean,
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>
): bigint => {
  if (!mintFeeAssets) return 0n

  const native = api.findNativeAssetInfo(chain)
  const relay = api.findAssetInfo(
    chain,
    { location: { parents: Parents.ONE, interior: { Here: null } } },
    null
  )

  const seen = new Set<string>()
  const preminted = [native, relay, feeAsset]
    .filter((a): a is TAssetInfo => !!a)
    .filter(a => {
      const k = JSON.stringify(a.location)
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })

  return preminted.some(a => isAssetXcEqual(a, sent))
    ? parseUnits(resolveBypassMintAmount(chain), sent.decimals)
    : 0n
}

export const wrapTxBypass = async <TApi, TRes, TSigner, TCustomChain extends string = never>(
  dryRunOptions: TDryRunBypassOptions<TApi, TRes, TSigner, TCustomChain>,
  options: TBypassOptions = {
    mintFeeAssets: true,
    sentAssetMintMode: 'bypass'
  }
) => {
  const { api, chain, address, asset, feeAsset, tx } = dryRunOptions
  const { mintFeeAssets } = options

  const bypassMintAmount = resolveBypassMintAmount(chain)

  const relayCurrency: TCurrencyCore = {
    location: { parents: Parents.ONE, interior: { Here: null } }
  }

  const nativeInfo = mintFeeAssets ? api.findNativeAssetInfo(chain) : null
  const relayInfo = mintFeeAssets ? api.findAssetInfo(chain, relayCurrency) : null
  const sameNativeRelay = !!(nativeInfo && relayInfo && isAssetXcEqual(nativeInfo, relayInfo))

  const mintNativeAssetRes = mintFeeAssets
    ? await createRequiredMintTxs(
        chain,
        api.findNativeAssetInfoOrThrow(chain),
        bypassMintAmount,
        0n,
        address,
        api
      )
    : null

  const mintRelayAssetRes =
    mintFeeAssets && !sameNativeRelay
      ? await createOptionalMintTxs(chain, relayCurrency, bypassMintAmount, 0n, address, api)
      : null

  // mint fee asset if exists
  let mintFeeAssetRes: TSetBalanceRes | undefined
  if (feeAsset && mintFeeAssets) {
    const amount = parseUnits(bypassMintAmount, feeAsset.decimals)
    mintFeeAssetRes = await createMintTxs(chain, { ...feeAsset, amount }, 0n, address, api)
  }

  const mintSentAsset = async (sentAsset: WithAmount<TAssetInfo>) => {
    const balance = await getAssetBalanceInternal({
      api,
      chain,
      address,
      asset: sentAsset
    })

    const bonus = mintBonusForSent(chain, sentAsset, feeAsset, !!mintFeeAssets, api)

    let mintAmount: bigint | null
    if (options?.sentAssetMintMode === 'bypass') {
      mintAmount = parseUnits(bypassMintAmount, sentAsset.decimals) + sentAsset.amount
    } else {
      const missing = calcPreviewMintAmount(balance, sentAsset.amount) ?? 0n
      const total = missing + bonus
      mintAmount = total > 0n ? total : null
    }

    return mintAmount !== null
      ? createMintTxs(chain, { ...sentAsset, amount: mintAmount }, balance, address, api)
      : null
  }

  // mint assets that are being sent
  const mintAssetResults = await Promise.all((dryRunOptions.assets ?? [asset]).map(mintSentAsset))

  return api.callBatchMethod(
    [
      ...[mintNativeAssetRes, mintRelayAssetRes, mintFeeAssetRes, ...mintAssetResults].flatMap(
        tx => (tx ? resultToExtrinsics(api, address, tx) : [])
      ),
      api.callDispatchAsMethod(tx, address)
    ],
    BatchMode.BATCH_ALL
  )
}
