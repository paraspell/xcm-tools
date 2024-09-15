import { ApiPromise } from '@polkadot/api'
import { Extrinsic, TNode } from '../../../types'
import { Builder } from '../../../builder'

export const createTx = async (
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
      .currency({ symbol: currencySymbol })
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
