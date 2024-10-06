import type { UInt } from '@polkadot/types'
import { BN } from '@polkadot/util'
import type { AccountInfo } from '@polkadot/types/interfaces'
import { KeepAliveError } from '../../../errors/KeepAliveError'
import type { CheckKeepAliveOptions, TNodePolkadotKusama } from '../../../types'
import { getAssetsObject } from '../../assets'
import { determineRelayChain } from '../../../utils'
import { calculateTransactionFee } from '../calculateTransactionFee'
import { getExistentialDeposit } from '../../assets/eds'
import { createTx } from './createTx'

export const checkKeepAlive = async ({
  originApi,
  address,
  amount,
  originNode,
  destApi,
  currencySymbol,
  destNode
}: CheckKeepAliveOptions): Promise<void> => {
  if (destApi === undefined) {
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

  const { data } = (await destApi.query.system.account(address)) as AccountInfo
  const balance: BN = (data.free as UInt).toBn()

  const { data: originData } = (await originApi.query.system.account(address)) as AccountInfo
  const balanceOrigin: BN = (originData.free as UInt).toBn()

  const amountBN = new BN(amount)

  const ed = getExistentialDeposit(
    destNode ?? determineRelayChain(originNode as TNodePolkadotKusama)
  )
  const edOrigin = getExistentialDeposit(
    originNode ?? determineRelayChain(destNode as TNodePolkadotKusama)
  )

  const tx = await createTx(
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

  const xcmFee = await calculateTransactionFee(tx, address)

  if (ed === null) {
    throw new KeepAliveError('Existential deposit not found for destination parachain.')
  }

  if (edOrigin === null) {
    throw new KeepAliveError('Existential deposit not found for origin parachain.')
  }

  console.log('XCM FEE: ', xcmFee.toString())
  console.log('EXISTENTIAL DEPOSIT: ', ed.toString())
  console.log('EXISTENTIAL DEPOSIT ORIGIN: ', edOrigin.toString())
  console.log('BALANCE: ', balance.toString())
  console.log('ORIGIN BALANCE: ', balanceOrigin.toString())
  console.log('AMOUNT: ', amountBN.toString())
  console.log('AMOUNT WITHOUT FEE: ', amountBN.sub(xcmFee.mul(new BN(1.5))).toString())
  console.log(
    'BALANCE + AMOUNT WITHOUT FEE: ',
    balance.add(amountBN.sub(xcmFee.mul(new BN(1.5)))).toString()
  )
  console.log(
    'ORIGIN BALANCE - AMOUNT WITH FEE: ',
    balanceOrigin.sub(amountBN.sub(xcmFee.mul(new BN(1.5)))).toString()
  )

  const amountBNWithoutFee = amountBN.sub(xcmFee.mul(new BN(1.5)))

  if (balance.add(amountBNWithoutFee).lt(new BN(ed))) {
    throw new KeepAliveError(
      `Keep alive check failed: Sending ${amount} ${currencySymbol} to ${destNode} would result in an account balance below the required existential deposit.
         Please increase the amount to meet the minimum balance requirement of the destination chain.`
    )
  }

  const amountOriginBNWithoutFee = amountBN.sub(xcmFee.mul(new BN(1.5)))

  if (
    (currencySymbol === 'DOT' || currencySymbol === 'KSM') &&
    balanceOrigin.sub(amountOriginBNWithoutFee).lt(new BN(edOrigin))
  ) {
    throw new KeepAliveError(
      `Keep alive check failed: Sending ${amount} ${currencySymbol} to ${destNode} would result in an account balance below the required existential deposit on origin.
         Please decrease the amount to meet the minimum balance requirement of the origin chain.`
    )
  }
}
