import { isAssetEqual, type TAsset, type TAssetInfo } from '@paraspell/assets'
import { isExternalChain, type TSubstrateChain } from '@paraspell/sdk-common'

import { getParaId } from '../../../chains/config'
import { getParaEthTransferFees } from '../../../transfer'
import type { TCreateSwapXcmInternalOptions, TTransferFeeEstimates } from '../../../types'
import { createAsset } from '../../asset'
import { getRelayChainOf } from '../../chain'
import { createEthereumBridgeInstructions } from '../../ethereum/createCustomXcmOnDest'
import { generateMessageId } from '../../ethereum/generateMessageId'
import { localizeLocation } from '../../location'
import { addXcmVersionHeader } from '../../xcm-version'
import { getFeeAssetInfo } from '../getFeeAssetInfo'
import { createAssetsFilter } from './createAssetsFilter'
import { createBaseExecuteXcm } from './createBaseExecuteXcm'
import { isMultiHopSwap } from './isMultiHopSwap'
import { prepareCommonExecuteXcm } from './prepareCommonExecuteXcm'

const createExchangeAsset = (
  give: { Definite: TAsset[] } | ReturnType<typeof createAssetsFilter>,
  want: TAsset[]
) => ({ ExchangeAsset: { give, want, maximal: true } })

export const createExchangeInstructions = async <
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
>(
  options: TCreateSwapXcmInternalOptions<TApi, TRes, TSigner, TCustomChain>,
  separateFeeAssetInfo?: TAssetInfo
) => {
  const {
    api,
    chain,
    exchangeChain,
    assetInfoFrom,
    assetInfoTo,
    version,
    calculateMinAmountOut,
    fees: { originReserveFee, exchangeFee }
  } = options

  const hasSeparateFeeAsset = separateFeeAssetInfo !== undefined

  const needsMultiHop = isMultiHopSwap(exchangeChain, assetInfoFrom, assetInfoTo)

  const isDummyRun = exchangeFee === 0n

  const halveOnDummyFees = (amount: bigint) => (chain && isDummyRun ? (amount + 1n) / 2n : amount)

  const createWant = (asset: TAsset) => [isDummyRun ? { ...asset, fun: { Fungible: 1n } } : asset]

  const amountIn =
    assetInfoFrom.amount - (chain && !hasSeparateFeeAsset ? originReserveFee + exchangeFee : 0n)

  const give = {
    Definite: [
      createAsset(
        version,
        halveOnDummyFees(amountIn),
        localizeLocation(exchangeChain, assetInfoFrom.location)
      )
    ]
  }

  const assetTo = createAsset(
    version,
    assetInfoTo.amount,
    localizeLocation(exchangeChain, assetInfoTo.location)
  )

  if (!needsMultiHop) {
    return [createExchangeAsset(give, createWant(assetTo))]
  }

  // Multi-hop through native asset

  const nativeAsset = api.findNativeAssetInfoOrThrow(exchangeChain)

  const isNativeFeeAsset = hasSeparateFeeAsset && isAssetEqual(separateFeeAssetInfo, nativeAsset)

  const nativeAmountOut = await calculateMinAmountOut(
    amountIn,
    nativeAsset,
    isNativeFeeAsset ? '0' : undefined
  )

  const assetNative = createAsset(
    version,
    halveOnDummyFees(nativeAmountOut),
    localizeLocation(exchangeChain, nativeAsset.location)
  )

  return [
    createExchangeAsset(give, createWant(assetNative)),
    createExchangeAsset(
      isNativeFeeAsset ? { Definite: [assetNative] } : createAssetsFilter(assetNative, version),
      createWant(assetTo)
    )
  ]
}

export const createSwapExecuteXcm = async <
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
>(
  options: TCreateSwapXcmInternalOptions<TApi, TRes, TSigner, TCustomChain>
) => {
  const {
    api,
    chain,
    exchangeChain,
    destChain,
    assetInfoFrom,
    assetInfoTo,
    feeAssetInfo,
    fees: { originFee, originReserveFee, exchangeFee, destReserveFee, destFee },
    sender,
    recipient,
    version,
    paraIdTo
  } = options

  const isEthereumDest = destChain !== undefined && isExternalChain(destChain)

  // For Ethereum destination, the actual hop target is AssetHub (bridge hub)
  const resolvedDestChain: TSubstrateChain | undefined = isEthereumDest
    ? `AssetHub${getRelayChainOf(chain ?? exchangeChain)}`
    : undefined

  const amountOut = assetInfoTo.amount

  // For Ethereum, localize to AssetHub since that's where instructions execute
  const assetToLocalizedToDest = createAsset(
    version,
    amountOut,
    localizeLocation(resolvedDestChain ?? destChain ?? exchangeChain, assetInfoTo.location)
  )

  // For Ethereum destination, use DOT as feeAsset for bridge fees
  let ethFeeAssetInfo: TAssetInfo | undefined
  let ethBridgeFee = 0n
  if (isEthereumDest) {
    const nativeFeeAssetInfo = api.findNativeAssetInfoOrThrow(
      getRelayChainOf(chain ?? exchangeChain)
    )
    const ahApi = await api.createApiForChain('AssetHubPolkadot')
    const [bridgeFee, executionFee] = await getParaEthTransferFees(ahApi)
    ethBridgeFee = bridgeFee + executionFee

    if (!isAssetEqual(assetInfoFrom, nativeFeeAssetInfo)) {
      ethFeeAssetInfo = nativeFeeAssetInfo
    }
  }

  // Ethereum fee asset takes precedence over user-provided feeAssetInfo
  const resolvedFeeAssetInfo = isEthereumDest
    ? ethFeeAssetInfo
    : getFeeAssetInfo(assetInfoFrom, feeAssetInfo)

  const hasSeparateFeeAsset = resolvedFeeAssetInfo !== undefined

  const createLegFees = (reserveFee: bigint, destFee: bigint): TTransferFeeEstimates => ({
    originFee: hasSeparateFeeAsset ? ethBridgeFee : 0n,
    reserveFee: ethFeeAssetInfo ? ethBridgeFee : reserveFee,
    destFee: isEthereumDest ? ethBridgeFee : destFee
  })

  const feeAssetBudget = ethFeeAssetInfo
    ? ethBridgeFee
    : originFee + originReserveFee + exchangeFee + destReserveFee + destFee

  const isFeeLeftoverAboveEd = () => {
    if (
      isEthereumDest ||
      !resolvedFeeAssetInfo ||
      !getFeeAssetInfo(assetInfoTo, resolvedFeeAssetInfo)
    )
      return false
    const finalFeeAsset = api.findAssetInfo(destChain ?? exchangeChain, {
      location: resolvedFeeAssetInfo.location
    })
    return (
      finalFeeAsset !== null &&
      feeAssetBudget - (originReserveFee + exchangeFee + destReserveFee + destFee) >=
        BigInt(finalFeeAsset.existentialDeposit)
    )
  }

  const { prefix, depositInstruction } = prepareCommonExecuteXcm(
    {
      api,
      chain: chain ?? exchangeChain,
      destChain: resolvedDestChain ?? destChain ?? exchangeChain,
      assetInfo: assetInfoFrom,
      feeAssetInfo: resolvedFeeAssetInfo,
      useJitWithdraw: isEthereumDest,
      recipient,
      fees: {
        originFee: hasSeparateFeeAsset ? feeAssetBudget : originFee,
        reserveFee: 0n,
        destFee: 0n
      },
      version
    },
    assetToLocalizedToDest,
    isFeeLeftoverAboveEd()
  )

  const exchangeInstructions = await createExchangeInstructions(options, resolvedFeeAssetInfo)

  let exchangeToDestXcm: unknown[]

  if (isEthereumDest) {
    const ethAsset = api.findAssetInfoOrThrow('Ethereum', { symbol: assetInfoTo.symbol })

    const messageId = await generateMessageId(
      api,
      sender,
      getParaId(chain ?? exchangeChain),
      ethAsset.assetId!,
      recipient,
      amountOut
    )

    const snowbridgeInstructions = createEthereumBridgeInstructions(
      {
        api,
        sender,
        recipient,
        assetInfo: assetInfoTo,
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
            api,
            chain: exchangeChain,
            destChain: resolvedDestChain!,
            assetInfo: assetInfoTo,
            feeAssetInfo: ethFeeAssetInfo,
            paraIdTo: getParaId(resolvedDestChain!),
            version,
            recipient,
            fees: createLegFees(destReserveFee, destFee),
            suffixXcm: snowbridgeInstructions
          })
  } else if (destChain) {
    exchangeToDestXcm = createBaseExecuteXcm({
      api,
      chain: exchangeChain,
      destChain,
      assetInfo: assetInfoTo,
      feeAssetInfo: resolvedFeeAssetInfo,
      paraIdTo,
      version,
      recipient,
      fees: createLegFees(destReserveFee, destFee),
      suffixXcm: [depositInstruction]
    })
  } else {
    exchangeToDestXcm = [depositInstruction]
  }

  const finalXcm = chain
    ? createBaseExecuteXcm({
        api,
        chain,
        destChain: exchangeChain,
        assetInfo: assetInfoFrom,
        feeAssetInfo: resolvedFeeAssetInfo,
        paraIdTo: getParaId(exchangeChain),
        version,
        recipient,
        fees: createLegFees(originReserveFee, exchangeFee),
        suffixXcm: [...exchangeInstructions, ...exchangeToDestXcm]
      })
    : [...exchangeInstructions, ...exchangeToDestXcm]

  const fullXcm = [...prefix, ...finalXcm]
  return addXcmVersionHeader(fullXcm, version)
}
