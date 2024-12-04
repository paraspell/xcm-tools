import { Builder } from '../../../builder'
import { KeepAliveError } from '../../../errors/KeepAliveError'
import type { TCheckKeepAliveOptions } from '../../../types'
import { getAssetsObject, getExistentialDeposit } from '../../assets'

export const checkKeepAlive = async <TApi, TRes>({
  api,
  address,
  origin,
  destApi,
  asset,
  destination
}: TCheckKeepAliveOptions<TApi, TRes>): Promise<void> => {
  if (destApi.getApi() === undefined) {
    return
  }

  const { symbol, amount } = asset

  if (symbol !== getAssetsObject(destination).nativeAssetSymbol) {
    throw new KeepAliveError(
      'Keep alive check is only supported when sending native asset of destination parachain.'
    )
  }

  const balance = await destApi.getBalanceNative(address)

  const balanceOrigin = await api.getBalanceNative(address)

  const amountBN = BigInt(amount)

  const ed = getExistentialDeposit(destination)
  const edOrigin = getExistentialDeposit(origin)

  const oldDisconnectAllowed = api.getDisconnectAllowed()
  api.setDisconnectAllowed(false)

  const tx = await Builder<TApi, TRes>(api)
    .from(origin)
    .to(destination)
    .currency({
      symbol,
      amount
    })
    .address(address)
    .build()

  api.setDisconnectAllowed(oldDisconnectAllowed)

  if (tx === null) {
    throw new KeepAliveError('Transaction for XCM fee calculation could not be created.')
  }

  const xcmFee = await api.calculateTransactionFee(tx, address)

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
      `Keep alive check failed: Sending ${amount} ${symbol} to ${destination} would result in an account balance below the required existential deposit.
         Please increase the amount to meet the minimum balance requirement of the destination chain.`
    )
  }

  const amountOriginBNWithoutFee = amountBN - (xcmFee + xcmFee / BigInt(2))

  if (
    (symbol === 'DOT' || symbol === 'KSM') &&
    balanceOrigin - amountOriginBNWithoutFee > BigInt(edOrigin)
  ) {
    throw new KeepAliveError(
      `Keep alive check failed: Sending ${amount} ${symbol} to ${destination} would result in an account balance below the required existential deposit on origin.
         Please decrease the amount to meet the minimum balance requirement of the origin chain.`
    )
  }
}
