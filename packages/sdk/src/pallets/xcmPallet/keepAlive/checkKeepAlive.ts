import { KeepAliveError } from '../../../errors/KeepAliveError'
import type { CheckKeepAliveOptions, TNodePolkadotKusama } from '../../../types'
import { getAssetsObject } from '../../assets'
import { determineRelayChain } from '../../../utils'
import { getExistentialDeposit } from '../../assets/eds'
import { createTx } from './createTx'

export const checkKeepAlive = async <TApi, TRes>({
  originApi,
  address,
  amount,
  originNode,
  destApi,
  currencySymbol,
  destNode
}: CheckKeepAliveOptions<TApi, TRes>): Promise<void> => {
  if (destApi.getApi() === undefined) {
    return
  }

  if (currencySymbol === undefined) {
    throw new KeepAliveError('Currency symbol not found for this asset. Cannot check keep alive.')
  }

  if (
    originNode !== undefined &&
    destNode !== undefined &&
    currencySymbol !== getAssetsObject(destNode).nativeAssetSymbol
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

  const tx = await createTx<TApi, TRes>(
    originApi,
    destApi,
    address,
    amount,
    currencySymbol,
    originNode,
    destNode
  )

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
      `Keep alive check failed: Sending ${amount} ${currencySymbol} to ${destNode} would result in an account balance below the required existential deposit.
         Please increase the amount to meet the minimum balance requirement of the destination chain.`
    )
  }

  const amountOriginBNWithoutFee = amountBN - (xcmFee + xcmFee / BigInt(2))

  if (
    (currencySymbol === 'DOT' || currencySymbol === 'KSM') &&
    balanceOrigin - amountOriginBNWithoutFee > BigInt(edOrigin)
  ) {
    throw new KeepAliveError(
      `Keep alive check failed: Sending ${amount} ${currencySymbol} to ${destNode} would result in an account balance below the required existential deposit on origin.
         Please decrease the amount to meet the minimum balance requirement of the origin chain.`
    )
  }
}
