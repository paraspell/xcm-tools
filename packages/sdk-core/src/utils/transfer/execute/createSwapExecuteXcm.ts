import { findAssetInfoOrThrow, getNativeAssetSymbol, Native, type TAsset } from '@paraspell/assets'

import { getParaId } from '../../../chains/config'
import type { TCreateSwapXcmInternalOptions } from '../../../types'
import { addXcmVersionHeader } from '../../addXcmVersionHeader'
import { assertHasLocation } from '../../assertions'
import { createAsset } from '../../asset'
import { localizeLocation } from '../../location'
import { createAssetsFilter } from './createAssetsFilter'
import { createBaseExecuteXcm } from './createBaseExecuteXcm'
import { isMultiHopSwap } from './isMultiHopSwap'
import { prepareCommonExecuteXcm } from './prepareCommonExecuteXcm'

export const createExchangeInstructions = async <TApi, TRes>(
  options: TCreateSwapXcmInternalOptions<TApi, TRes>,
  assetFrom: TAsset,
  assetTo: TAsset
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

  assertHasLocation(nativeAsset)

  if (!needsMultiHop) {
    return [
      {
        ExchangeAsset: {
          give: createAssetsFilter(assetFrom),
          want: [assetTo],
          maximal: false
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
        give: createAssetsFilter(assetFrom),
        want: [assetNative],
        maximal: false
      }
    },
    {
      ExchangeAsset: {
        give: createAssetsFilter(assetNative),
        want: [assetTo],
        maximal: true
      }
    }
  ]
}

export const createSwapExecuteXcm = async <TApi, TRes>(
  options: TCreateSwapXcmInternalOptions<TApi, TRes>
) => {
  const {
    api,
    chain,
    exchangeChain,
    destChain,
    assetInfoFrom,
    assetInfoTo,
    fees: { originReserveFee, destReserveFee },
    recipientAddress,
    version,
    paraIdTo
  } = options

  assertHasLocation(assetInfoFrom)
  assertHasLocation(assetInfoTo)

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

  const assetToLocalizedToDest = createAsset(
    version,
    amountOut,
    localizeLocation(destChain ?? exchangeChain, assetInfoTo.location)
  )

  const { prefix, depositInstruction } = prepareCommonExecuteXcm(
    {
      api,
      chain: chain ?? exchangeChain,
      destChain: destChain ?? exchangeChain,
      assetInfo: assetInfoFrom,
      recipientAddress,
      // Deal with this after feeAsset for swaps is supported
      fees: { originFee: 0n, reserveFee: originReserveFee },
      version
    },
    assetToLocalizedToDest
  )

  const exchangeInstructions = await createExchangeInstructions(options, assetFrom, assetTo)

  const exchangeToDestXcm = destChain
    ? createBaseExecuteXcm({
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
    : [depositInstruction]

  const finalXcm = chain
    ? createBaseExecuteXcm({
        chain,
        destChain: exchangeChain,
        assetInfo: assetInfoFrom,
        paraIdTo: getParaId(exchangeChain),
        version,
        recipientAddress,
        // Deal with this after feeAsset is supported
        fees: { originFee: 0n, reserveFee: originReserveFee },
        suffixXcm: [...exchangeInstructions, ...exchangeToDestXcm]
      })
    : [...exchangeInstructions, ...exchangeToDestXcm]

  const fullXcm = [...prefix, ...finalXcm]
  return addXcmVersionHeader(fullXcm, version)
}
