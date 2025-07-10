import {
  findAssetForNodeOrThrow,
  getExistentialDepositOrThrow,
  getRelayChainSymbol,
  isAssetEqual,
  isNodeEvm
} from '@paraspell/assets'
import type { TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'
import { replaceBigInt } from '@paraspell/sdk-common'

import { InvalidParameterError } from '../../../errors'
import { getXcmFee } from '../../../transfer'
import { resolveFeeAsset } from '../../../transfer/utils/resolveFeeAsset'
import type { TGetTransferInfoOptions, TTransferInfo } from '../../../types/TTransferInfo'
import { getRelayChainOf } from '../../../utils'
import { getAssetBalanceInternal, getBalanceNativeInternal } from '../balance'
import { buildDestInfo } from './buildDestInfo'
import { buildHopInfo } from './buildHopInfo'

export const getTransferInfo = async <TApi, TRes>({
  api,
  tx,
  origin,
  destination,
  senderAddress,
  ahAddress,
  address,
  currency,
  feeAsset
}: TGetTransferInfoOptions<TApi, TRes>): Promise<TTransferInfo> => {
  if (isNodeEvm(origin) && !ahAddress) {
    throw new InvalidParameterError(`ahAddress is required for EVM origin ${origin}.`)
  }

  const resolvedFeeAsset = feeAsset
    ? resolveFeeAsset(feeAsset, origin, destination, currency)
    : undefined

  await api.init(origin)
  api.setDisconnectAllowed(false)

  try {
    const originAsset = findAssetForNodeOrThrow(origin, currency, destination)

    const originBalanceFee =
      feeAsset && resolvedFeeAsset
        ? await getAssetBalanceInternal({
            api,
            address: senderAddress,
            node: origin,
            currency: feeAsset
          })
        : await getBalanceNativeInternal({
            api,
            address: senderAddress,
            node: origin
          })

    const originBalance = await getAssetBalanceInternal({
      api,
      address: senderAddress,
      node: origin,
      currency
    })

    const edOrigin = getExistentialDepositOrThrow(origin, currency)

    const {
      origin: { fee: originFee, currency: originFeeCurrency },
      assetHub: assetHubFeeResult,
      bridgeHub: bridgeHubFeeResult,
      destination: destFeeDetail,
      hops
    } = await getXcmFee({
      api,
      tx,
      origin,
      destination,
      senderAddress,
      address,
      currency,
      feeAsset,
      disableFallback: false
    })

    if (originFee === undefined) {
      throw new InvalidParameterError(
        `Cannot get origin xcm fee for currency ${JSON.stringify(currency, replaceBigInt)} on node ${origin}.`
      )
    }

    const isFeeAssetAh =
      origin === 'AssetHubPolkadot' &&
      resolvedFeeAsset &&
      isAssetEqual(resolvedFeeAsset, originAsset)

    const originBalanceAfter = originBalance - BigInt(currency.amount)

    const originBalanceFeeAfter = isFeeAssetAh
      ? originBalanceFee - BigInt(currency.amount)
      : originBalanceFee - originFee

    const originBalanceNativeSufficient = originBalanceFee >= originFee

    const originBalanceSufficient = originBalanceAfter >= edOrigin

    let assetHub
    if (assetHubFeeResult) {
      assetHub = await buildHopInfo({
        api,
        node: `AssetHub${getRelayChainOf(origin)}` as TNodeDotKsmWithRelayChains,
        feeData: assetHubFeeResult as { fee: bigint; currency: string },
        originNode: origin,
        currency,
        senderAddress,
        ahAddress
      })
    }

    let bridgeHub
    if (bridgeHubFeeResult) {
      const bridgeHubNode = `BridgeHub${getRelayChainOf(origin)}` as TNodeDotKsmWithRelayChains
      bridgeHub = await buildHopInfo({
        api,
        node: bridgeHubNode,
        feeData: bridgeHubFeeResult as { fee: bigint; currency: string },
        originNode: origin,
        currency,
        senderAddress,
        ahAddress
      })
    }

    let builtHops: TTransferInfo['hops'] = []

    if (hops && hops.length > 0) {
      builtHops = (await Promise.all(
        hops.map(async hop => {
          const result = await buildHopInfo({
            api,
            node: hop.chain as TNodeDotKsmWithRelayChains,
            feeData: hop.result as { fee: bigint; currency: string },
            originNode: origin,
            currency,
            senderAddress,
            ahAddress
          })
          return {
            chain: hop.chain,
            result
          }
        })
      )) as TTransferInfo['hops']
    }

    const destinationInfo = await buildDestInfo({
      api,
      origin,
      destination,
      address,
      currency,
      originFee,
      isFeeAssetAh: !!isFeeAssetAh,
      destFeeDetail,
      assetHubFee: assetHubFeeResult?.fee,
      bridgeFee: bridgeHubFeeResult?.fee
    })

    return {
      chain: {
        origin,
        destination,
        ecosystem: getRelayChainSymbol(origin)
      },
      origin: {
        selectedCurrency: {
          sufficient: originBalanceSufficient,
          balance: originBalance,
          balanceAfter: originBalanceAfter,
          currencySymbol: originAsset.symbol,
          existentialDeposit: edOrigin
        },
        xcmFee: {
          sufficient: originBalanceNativeSufficient,
          fee: originFee,
          balance: originBalanceFee,
          balanceAfter: originBalanceFeeAfter,
          currencySymbol: originFeeCurrency
        }
      },
      assetHub,
      bridgeHub,
      hops: builtHops,
      destination: destinationInfo
    }
  } finally {
    api.setDisconnectAllowed(true)
    await api.disconnect()
  }
}
