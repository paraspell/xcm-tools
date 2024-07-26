/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ApiPromise } from '@polkadot/api'
import { KeepAliveError } from '../../errors/KeepAliveError'
import {
  type TEdJsonMap,
  type TNode,
  type Extrinsic,
  type CheckKeepAliveOptions,
  type TNodeDotKsmWithRelayChains,
  TNodePolkadotKusama
} from '../../types'
import { getAssetsObject } from '../assets'
import { BN } from '@polkadot/util'
import * as edMapJson from '../../maps/existential-deposits.json' assert { type: 'json' }
import { Builder } from '../../builder'
import { calculateTransactionFee } from './utils'
import { determineRelayChain } from '../../utils'

const edMap = edMapJson as TEdJsonMap

export const getExistentialDeposit = (node: TNodeDotKsmWithRelayChains): string | null =>
  edMap[node]

const createTx = async (
  originApi: ApiPromise,
  destApi: ApiPromise,
  address: string,
  amount: string,
  currencySymbol: string,
  originNode?: TNode,
  destNode?: TNode
): Promise<Extrinsic | null> => {
  if (originNode !== undefined && destNode !== undefined) {
    return await Builder(destApi)
      .from(destNode)
      .to(originNode)
      .currency(currencySymbol)
      .amount(amount)
      .address(address)
      .build()
  }
  if (originNode === undefined && destNode !== undefined) {
    return await Builder(originApi).to(destNode).amount(amount).address(address).build()
  } else if (originNode !== undefined && destNode === undefined) {
    return await Builder(destApi).to(originNode).amount(amount).address(address).build()
  } else {
    return null
  }
}

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

  const { data }: any = await destApi.query.system.account(address)
  const balance: BN = data.free.toBn()

  const { data: originData }: any = await originApi.query.system.account(address)
  const balanceOrigin: BN = originData.free.toBn()

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
