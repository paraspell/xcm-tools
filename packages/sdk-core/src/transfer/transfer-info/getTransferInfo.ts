import {
  findAssetInfoOrThrow,
  getRelayChainSymbol,
  isAssetEqual,
  isChainEvm
} from '@paraspell/assets'

import { MissingParameterError } from '../../errors'
import type { TGetTransferInfoOptions, TTransferInfo } from '../../types'
import { abstractDecimals } from '../../utils'
import { getXcmFee as getXcmFeeInternal } from '../fees'
import { resolveFeeAsset } from '../utils'
import { aggregateHopFees } from './aggregateHopFees'
import { buildDestInfo } from './buildDestInfo'
import { buildHopInfo } from './buildHopInfo'
import { buildOriginInfo } from './buildOriginInfo'

export const getTransferInfo = async <TApi, TRes, TSigner>({
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
}: TGetTransferInfoOptions<TApi, TRes, TSigner>): Promise<TTransferInfo> => {
  if (isChainEvm(origin) && !ahAddress) {
    throw new MissingParameterError('ahAddress', `ahAddress is required for EVM origin ${origin}.`)
  }

  const resolvedFeeAsset = feeAsset
    ? resolveFeeAsset(feeAsset, origin, destination, currency)
    : undefined

  await api.init(origin)
  api.disconnectAllowed = false

  try {
    const originAsset = findAssetInfoOrThrow(origin, currency, destination)

    const amount = abstractDecimals(currency.amount, originAsset.decimals, api)

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

    const originInfo = await buildOriginInfo({
      api,
      origin,
      sender,
      currency,
      originAsset,
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
            currency,
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

    const destinationInfo = await buildDestInfo({
      api,
      origin,
      destination,
      recipient,
      currency: {
        ...currency,
        amount
      },
      originFee,
      isFeeAssetAh,
      destFeeDetail,
      totalHopFee,
      bridgeFee
    })

    return {
      chain: {
        origin,
        destination,
        ecosystem: getRelayChainSymbol(origin)
      },
      origin: originInfo,
      hops: builtHops,
      destination: destinationInfo
    }
  } finally {
    api.disconnectAllowed = true
    await api.disconnect()
  }
}
