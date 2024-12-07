import type { TNodePolkadotKusama } from '../../../types'
import { Builder } from '../../../builder'
import type { IPolkadotApi } from '../../../api/IPolkadotApi'

export const createTx = async <TApi, TRes>(
  originApi: IPolkadotApi<TApi, TRes>,
  destApi: IPolkadotApi<TApi, TRes>,
  address: string,
  amount: string,
  currencySymbol: string,
  originNode?: TNodePolkadotKusama,
  destNode?: TNodePolkadotKusama
): Promise<TRes | null> => {
  if (originNode !== undefined && destNode !== undefined) {
    return Builder<TApi, TRes>(destApi)
      .from(destNode)
      .to(originNode)
      .currency({ symbol: currencySymbol })
      .amount(amount)
      .address(address)
      .build()
  }
  if (originNode === undefined && destNode !== undefined) {
    return Builder<TApi, TRes>(originApi).to(destNode).amount(amount).address(address).build()
  } else if (originNode !== undefined && destNode === undefined) {
    return Builder<TApi, TRes>(destApi).to(originNode).amount(amount).address(address).build()
  } else {
    return null
  }
}
