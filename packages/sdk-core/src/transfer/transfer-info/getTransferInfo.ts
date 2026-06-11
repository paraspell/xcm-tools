import type { TCurrencyInputWithAmount, TSingleCurrencyInput, WithAmount } from '@paraspell/assets'
import { isAssetEqual } from '@paraspell/assets'

import { MissingParameterError } from '../../errors'
import type { TGetTransferInfoOptions, TTransferInfo } from '../../types'
import { getXcmFee as getXcmFeeInternal } from '../fees'
import { resolveCurrency, resolveFeeAsset } from '../utils'
import { assertNotRawAssets } from '../utils/validationUtils'
import { aggregateHopFees } from './aggregateHopFees'
import { buildDestInfo } from './buildDestInfo'
import { buildHopInfo } from './buildHopInfo'
import { buildOriginInfo } from './buildOriginInfo'

export const getTransferInfo = async <
  TApi,
  TRes,
  TSigner,
  TCurrency extends TCurrencyInputWithAmount,
  TCustomChain extends string = never
>({
  api,
  buildTx,
  origin,
  destination,
  sender,
  ahAddress,
  recipient,
  currency,
  feeAsset,
  version
}: TGetTransferInfoOptions<TApi, TRes, TSigner, TCustomChain, TCurrency>): Promise<
  TTransferInfo<TCurrency>
> => {
  if (api.isChainEvm(origin) && !ahAddress) {
    throw new MissingParameterError('ahAddress', `ahAddress is required for EVM origin ${origin}.`)
  }

  assertNotRawAssets(currency)

  const resolvedFeeAsset = feeAsset
    ? resolveFeeAsset(api, feeAsset, origin, destination, currency)
    : undefined

  await api.init(origin)
  api.disconnectAllowed = false

  try {
    const { assets, asset: originAsset } = resolveCurrency(
      api,
      currency,
      resolvedFeeAsset,
      origin,
      destination
    )

    const { amount } = originAsset

    const {
      origin: { fee: originFee, asset: originFeeAsset },
      destination: destFeeDetail,
      hops
    } = await getXcmFeeInternal({
      api,
      buildTx,
      origin,
      destination,
      sender,
      recipient,
      currency,
      feeAsset,
      version,
      disableFallback: false
    })

    const isFeeAssetAh =
      origin === 'AssetHubPolkadot' &&
      !!resolvedFeeAsset &&
      isAssetEqual(resolvedFeeAsset, originAsset)

    const feeAssetIndex = assets.findIndex(asset => isAssetEqual(asset, originAsset))

    const feeCurrency: TSingleCurrencyInput = Array.isArray(currency)
      ? currency[feeAssetIndex]
      : currency

    const { selectedCurrency, xcmFee: originXcmFee } = await buildOriginInfo({
      api,
      origin,
      sender,
      assets,
      amount,
      originFee,
      originFeeAsset,
      isFeeAssetAh
    })

    let builtHops: TTransferInfo['hops'] = []

    if (hops && hops.length > 0) {
      builtHops = await Promise.all(
        hops.map(async hop => {
          const result = await buildHopInfo({
            api,
            chain: hop.chain,
            fee: hop.result.fee,
            originChain: origin,
            currency: feeCurrency,
            asset: hop.result.asset,
            sender,
            ahAddress
          })
          return {
            chain: hop.chain,
            result
          }
        })
      )
    }

    const { totalHopFee, bridgeFee } = aggregateHopFees(hops, originAsset)

    const buildDestInfoForAsset = (item: WithAmount<TSingleCurrencyInput>, isFeeElement: boolean) =>
      buildDestInfo({
        api,
        origin,
        destination,
        recipient,
        currency: item,
        originFee,
        isFeeAssetAh: isFeeAssetAh && isFeeElement,
        paysDestFee: isFeeElement,
        destFeeDetail,
        totalHopFee: isFeeElement ? totalHopFee : 0n,
        bridgeFee
      })

    const destResults = Array.isArray(currency)
      ? await Promise.all(
          currency.map((item, index) =>
            buildDestInfoForAsset(
              { ...item, amount: assets[index].amount },
              index === feeAssetIndex
            )
          )
        )
      : [await buildDestInfoForAsset({ ...currency, amount }, true)]

    const feeResult = destResults[Array.isArray(currency) ? feeAssetIndex : 0]

    const result: TTransferInfo<TCurrencyInputWithAmount> = {
      chain: {
        origin,
        destination,
        ecosystem: api.getRelayChainSymbol(origin)
      },
      origin: {
        selectedCurrency: Array.isArray(currency) ? selectedCurrency : selectedCurrency[0],
        xcmFee: originXcmFee
      },
      hops: builtHops,
      destination: {
        receivedCurrency: Array.isArray(currency)
          ? destResults.map(result => result.receivedCurrency)
          : destResults[0].receivedCurrency,
        xcmFee: feeResult.xcmFee
      }
    }

    return result
  } finally {
    api.disconnectAllowed = true
    await api.disconnect()
  }
}
