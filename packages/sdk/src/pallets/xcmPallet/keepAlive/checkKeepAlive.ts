import { KeepAliveError } from '../../../errors/KeepAliveError'
import type { TCheckKeepAliveOptions, TNodePolkadotKusama } from '../../../types'
import { getAssetsObject, getExistentialDeposit } from '../../assets'
import { determineRelayChain } from '../../../utils'
import { createTx } from './createTx'

export const checkKeepAlive = async <TApi, TRes>({
  originApi,
  address,
  amount,
  originNode,
  destApi,
  asset,
  destNode
}: TCheckKeepAliveOptions<TApi, TRes>): Promise<void> => {
  if (destApi.getApi() === undefined) {
    return
  }

  if (
    originNode !== undefined &&
    destNode !== undefined &&
    asset.symbol !== getAssetsObject(destNode).nativeAssetSymbol
  ) {
    throw new KeepAliveError(
      'Keep alive check is only supported when sending native asset of destination parachain.'
    )
  }

  const balance = await destApi.getBalanceNative(address)

  const balanceOrigin = await originApi.getBalanceNative(address)

  const amountBN = BigInt(amount)

  const ed = getExistentialDeposit(
    destNode ?? determineRelayChain(originNode as TNodePolkadotKusama)
  )
  const edOrigin = getExistentialDeposit(
    originNode ?? determineRelayChain(destNode as TNodePolkadotKusama)
  )

  const oldDisconnectAllowed = originApi.getDisconnectAllowed()
  originApi.setDisconnectAllowed(false)

  const tx = await createTx<TApi, TRes>(
    originApi,
    destApi,
    address,
    amount,
    asset.symbol,
    originNode,
    destNode
  )

  originApi.setDisconnectAllowed(oldDisconnectAllowed)

  if (tx === null) {
    throw new KeepAliveError('Transaction for XCM fee calculation could not be created.')
  }

  const xcmFee = await originApi.calculateTransactionFee(tx, address)

  if (ed === null) {
    throw new KeepAliveError('Existential deposit not found for destination parachain.')
  }

  if (edOrigin === null) {
    throw new KeepAliveError('Existential deposit not found for origin parachain.')
  }

  const increasedFee = xcmFee + xcmFee / BigInt(2)

  const amountBNWithoutFee = amountBN - increasedFee

  if (balance + amountBNWithoutFee < BigInt(ed)) {
    throw new KeepAliveError(
      `Keep alive check failed: Sending ${amount} ${asset.symbol} to ${destNode} would result in an account balance below the required existential deposit.
         Please increase the amount to meet the minimum balance requirement of the destination chain.`
    )
  }

  const amountOriginBNWithoutFee = amountBN - (xcmFee + xcmFee / BigInt(2))

  if (
    (asset.symbol === 'DOT' || asset.symbol === 'KSM') &&
    balanceOrigin - amountOriginBNWithoutFee > BigInt(edOrigin)
  ) {
    throw new KeepAliveError(
      `Keep alive check failed: Sending ${amount} ${asset.symbol} to ${destNode} would result in an account balance below the required existential deposit on origin.
         Please decrease the amount to meet the minimum balance requirement of the origin chain.`
    )
  }
}
