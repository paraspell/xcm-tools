import { type TNode, type TNodeWithRelayChains } from '../../types'
import { createApiInstanceForNode, determineRelayChainSymbol } from '../../utils'
import { getAssetsObject } from './assets'
import { getAssetBySymbolOrId } from './assetsUtils'
import { getBalanceForeign } from './getBalanceForeign'
import { getBalanceNative } from './getBalanceNative'
import {
  getExistentialDeposit,
  getMaxNativeTransferableAmount,
  getMinNativeTransferableAmount
} from './getExistentialDeposit'
import { getOriginFeeDetails } from './getOriginFeeDetails'

interface TTransferInfo {
  chain: { origin: TNodeWithRelayChains; destination: TNodeWithRelayChains; ecosystem: string }
  currencyBalanceOrigin: {
    balance: bigint
    currency: string
  }
  originFeeBalance: {
    balance: bigint // balance nativneho assetu pre origin chain
    expectedBalanceAfterXCMFee: bigint // balance - (xcmFee+10%),
    xcmFee: {
      sufficientForXCM: boolean
      xcmFee: bigint
    }
    existentialDeposit: bigint // existential deposit origin chain
    asset: string // origin chain native asset symbol
    minNativeTransferableAmount: bigint
    maxNativeTransferableAmount: bigint
  }
  destinationFeeBalance: {
    balance: bigint // balance nativneho asssetu na destination chaine,
    currency: string // nativnyAsset destination chainu,
    existentialDeposit: bigint // existential deposit destination chain,
  }
}

const getNativeAssetSymbol = (node: TNodeWithRelayChains): string => {
  if (node === 'Polkadot') {
    return 'DOT'
  } else if (node === 'Kusama') {
    return 'KSM'
  }
  return getAssetsObject(node).nativeAssetSymbol
}

const getAssetSymbol = (node: TNodeWithRelayChains, assetId: string): any => {
  if (node === 'Polkadot' || node === 'Kusama') {
    return getNativeAssetSymbol(node)
  }
  const asset = getAssetBySymbolOrId(node, assetId)
  return asset
}

const getAssetBalance = async (
  account: string,
  node: TNodeWithRelayChains,
  assetSymbolOrId: string
): Promise<bigint> => {
  const api = await createApiInstanceForNode(node)
  const isNativeSymbol = getNativeAssetSymbol(node) === assetSymbolOrId
  return isNativeSymbol
    ? await getBalanceNative(account, node, api)
    : (await getBalanceForeign(account, node as TNode, assetSymbolOrId, api)) ?? BigInt(0)
}

export const getTransferInfo = async (
  origin: TNodeWithRelayChains,
  destination: TNodeWithRelayChains,
  accountOrigin: string,
  accountDestination: string,
  assetSymbolOrId: string,
  amount: string
): Promise<TTransferInfo> => {
  const originApi = await createApiInstanceForNode(origin)
  const originBalance = await getBalanceNative(accountOrigin, origin, originApi)
  const { xcmFee: destXcmFee } = await getOriginFeeDetails(
    origin,
    destination,
    assetSymbolOrId,
    amount,
    accountOrigin,
    originApi
  )
  const expectedBalanceAfterXCMDelivery = originBalance - destXcmFee

  const asset = getAssetSymbol(origin, assetSymbolOrId)

  return {
    chain: {
      origin,
      destination,
      ecosystem: determineRelayChainSymbol(origin)
    },
    currencyBalanceOrigin: {
      balance: await getAssetBalance(accountOrigin, origin, assetSymbolOrId),
      currency: asset.symbol
    },
    originFeeBalance: {
      balance: await getBalanceNative(accountOrigin, origin, originApi),
      expectedBalanceAfterXCMFee: expectedBalanceAfterXCMDelivery,
      xcmFee: await getOriginFeeDetails(
        origin,
        destination,
        assetSymbolOrId,
        amount,
        accountOrigin,
        originApi
      ),
      existentialDeposit: BigInt(getExistentialDeposit(origin) ?? 0),
      asset: getNativeAssetSymbol(origin),
      minNativeTransferableAmount: getMinNativeTransferableAmount(origin),
      maxNativeTransferableAmount: await getMaxNativeTransferableAmount(accountOrigin, origin)
    },
    destinationFeeBalance: {
      balance: await getBalanceNative(accountDestination, destination), // balance nativneho asssetu na destination chaine,
      currency: getNativeAssetSymbol(destination), // nativnyAsset destination chainu,
      existentialDeposit: getExistentialDeposit(destination) // existential deposit destination chain,
    }
  }
}
