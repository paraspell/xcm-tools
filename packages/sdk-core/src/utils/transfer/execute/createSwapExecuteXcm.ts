import {
  findAssetInfoOrThrow,
  findNativeAssetInfoOrThrow,
  getNativeAssetSymbol,
  isAssetEqual,
  Native,
  type TAsset
} from '@paraspell/assets'
import { isExternalChain, type TSubstrateChain } from '@paraspell/sdk-common'

import { getParaId } from '../../../chains/config'
import { getParaEthTransferFees } from '../../../transfer'
import type { TCreateSwapXcmInternalOptions } from '../../../types'
import { createAsset } from '../../asset'
import { getRelayChainOf } from '../../chain'
import { createEthereumBridgeInstructions } from '../../ethereum/createCustomXcmOnDest'
import { generateMessageId } from '../../ethereum/generateMessageId'
import { localizeLocation } from '../../location'
import { addXcmVersionHeader } from '../../xcm-version'
import { createAssetsFilter } from './createAssetsFilter'
import { createBaseExecuteXcm } from './createBaseExecuteXcm'
import { isMultiHopSwap } from './isMultiHopSwap'
import { prepareCommonExecuteXcm } from './prepareCommonExecuteXcm'

export const createExchangeInstructions = async <TApi, TRes, TSigner>(
  options: TCreateSwapXcmInternalOptions<TApi, TRes, TSigner>,
  assetFrom: TAsset,
  assetTo: TAsset,
  hasSeparateFeeAsset: boolean
) => {
  const {
    chain,
    exchangeChain,
    assetInfoFrom,
    assetInfoTo,
    version,
    calculateMinAmountOut,
    fees: { originReserveFee, exchangeFee }
  } = options

  const nativeSymbol = getNativeAssetSymbol(exchangeChain)
  const needsMultiHop = isMultiHopSwap(exchangeChain, assetInfoFrom, assetInfoTo)

  const nativeAsset = findAssetInfoOrThrow(exchangeChain, { symbol: Native(nativeSymbol) }, null)

  if (!needsMultiHop) {
    return [
      {
        ExchangeAsset: {
          give: createAssetsFilter(assetFrom, version),
          want: [assetTo],
          maximal: hasSeparateFeeAsset
        }
      }
    ]
  }

  // Multi-hop through native asset

  const nativeAmountOut = await calculateMinAmountOut(
    BigInt(assetInfoFrom.amount) - (chain ? originReserveFee + exchangeFee : 0n),
    nativeAsset
  )

  const assetNative = createAsset(
    version,
    exchangeFee === 0n ? (nativeAmountOut + 1n) / 2n : nativeAmountOut,
    localizeLocation(exchangeChain, nativeAsset.location)
  )

  return [
    {
      ExchangeAsset: {
        give: createAssetsFilter(assetFrom, version),
        want: [assetNative],
        maximal: false
      }
    },
    {
      ExchangeAsset: {
        give: createAssetsFilter(assetNative, version),
        want: [assetTo],
        maximal: true
      }
    }
  ]
}

export const createSwapExecuteXcm = async <TApi, TRes, TSigner>(
  options: TCreateSwapXcmInternalOptions<TApi, TRes, TSigner>
) => {
  const {
    api,
    chain,
    exchangeChain,
    destChain,
    assetInfoFrom,
    assetInfoTo,
    fees: { originReserveFee, destReserveFee },
    senderAddress,
    recipientAddress,
    version,
    paraIdTo
  } = options

  const isEthereumDest = destChain !== undefined && isExternalChain(destChain)

  // For Ethereum destination, the actual hop target is AssetHub (bridge hub)
  const resolvedDestChain: TSubstrateChain | undefined = isEthereumDest
    ? (`AssetHub${getRelayChainOf(chain ?? exchangeChain)}` as TSubstrateChain)
    : undefined

  const assetFrom = createAsset(
    version,
    assetInfoFrom.amount,
    localizeLocation(exchangeChain, assetInfoFrom.location)
  )

  const amountOut = assetInfoTo.amount

  const assetTo = createAsset(
    version,
    amountOut,
    localizeLocation(exchangeChain, assetInfoTo.location)
  )

  // For Ethereum, localize to AssetHub since that's where instructions execute
  const assetToLocalizedToDest = createAsset(
    version,
    amountOut,
    localizeLocation(resolvedDestChain ?? destChain ?? exchangeChain, assetInfoTo.location)
  )

  // For Ethereum destination, use DOT as feeAsset for bridge fees
  let ethFeeAssetInfo
  let ethBridgeFee = 0n
  // Whether main asset IS DOT — no separate fee asset needed
  let isMainAssetDot = false
  if (isEthereumDest) {
    const nativeFeeAssetInfo = findNativeAssetInfoOrThrow(getRelayChainOf(chain ?? exchangeChain))
    const ahApi = await api.createApiForChain('AssetHubPolkadot')
    const [bridgeFee, executionFee] = await getParaEthTransferFees(ahApi)
    ethBridgeFee = bridgeFee + executionFee

    isMainAssetDot = isAssetEqual(assetInfoFrom, nativeFeeAssetInfo)
    if (!isMainAssetDot) {
      ethFeeAssetInfo = nativeFeeAssetInfo
    }
  }

  const hasSeparateFeeAsset = isEthereumDest && !isMainAssetDot

  const { prefix, depositInstruction } = prepareCommonExecuteXcm(
    {
      api,
      chain: chain ?? exchangeChain,
      destChain: resolvedDestChain ?? destChain ?? exchangeChain,
      assetInfo: assetInfoFrom,
      feeAssetInfo: ethFeeAssetInfo,
      useJitWithdraw: isEthereumDest,
      recipientAddress,
      fees: { originFee: hasSeparateFeeAsset ? ethBridgeFee : 0n, reserveFee: originReserveFee },
      version
    },
    assetToLocalizedToDest
  )

  const exchangeInstructions = await createExchangeInstructions(
    options,
    assetFrom,
    assetTo,
    hasSeparateFeeAsset
  )

  let exchangeToDestXcm: unknown[]

  if (isEthereumDest) {
    const ethAsset = findAssetInfoOrThrow('Ethereum', { symbol: assetInfoTo.symbol }, null)

    const messageId = await generateMessageId(
      api,
      senderAddress,
      getParaId(chain ?? exchangeChain),
      ethAsset.assetId!,
      recipientAddress,
      amountOut
    )

    const snowbridgeInstructions = createEthereumBridgeInstructions(
      {
        api,
        address: recipientAddress,
        assetInfo: assetInfoTo,
        senderAddress,
        version
      },
      chain ?? exchangeChain,
      messageId,
      ethAsset
    )

    // If exchange chain is already AssetHub, instructions run directly there
    // Otherwise, route from exchange chain to AssetHub with bridge instructions as suffix
    exchangeToDestXcm =
      exchangeChain === resolvedDestChain
        ? snowbridgeInstructions
        : createBaseExecuteXcm({
            chain: exchangeChain,
            destChain: resolvedDestChain!,
            assetInfo: assetInfoTo,
            feeAssetInfo: ethFeeAssetInfo,
            useFeeAssetOnHops: hasSeparateFeeAsset,
            paraIdTo: getParaId(resolvedDestChain!),
            version,
            recipientAddress,
            fees: {
              originFee: hasSeparateFeeAsset ? ethBridgeFee : 0n,
              reserveFee: destReserveFee
            },
            suffixXcm: snowbridgeInstructions
          })
  } else if (destChain) {
    exchangeToDestXcm = createBaseExecuteXcm({
      chain: exchangeChain,
      destChain,
      assetInfo: assetInfoTo,
      paraIdTo,
      version,
      recipientAddress,
      // Deal with this after feeAsset is supported
      fees: { originFee: 0n, reserveFee: destReserveFee },
      suffixXcm: [depositInstruction]
    })
  } else {
    exchangeToDestXcm = [depositInstruction]
  }

  const finalXcm = chain
    ? createBaseExecuteXcm({
        chain,
        destChain: exchangeChain,
        assetInfo: assetInfoFrom,
        feeAssetInfo: ethFeeAssetInfo,
        useFeeAssetOnHops: hasSeparateFeeAsset,
        paraIdTo: getParaId(exchangeChain),
        version,
        recipientAddress,
        fees: { originFee: hasSeparateFeeAsset ? ethBridgeFee : 0n, reserveFee: originReserveFee },
        suffixXcm: [...exchangeInstructions, ...exchangeToDestXcm]
      })
    : [...exchangeInstructions, ...exchangeToDestXcm]

  const fullXcm = [...prefix, ...finalXcm]
  return addXcmVersionHeader(fullXcm, version)
}
