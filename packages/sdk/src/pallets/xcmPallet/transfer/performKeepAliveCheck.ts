import type { TAsset, TSendOptions } from '../../../types'
import { checkKeepAlive } from '../keepAlive'

export const performKeepAliveCheck = async <TApi, TRes>(
  {
    api,
    origin,
    destApiForKeepAlive,
    amount,
    currency,
    address,
    destination
  }: TSendOptions<TApi, TRes>,
  asset: TAsset | null
) => {
  const amountStr = amount?.toString()

  if ('multilocation' in currency || 'multiasset' in currency) {
    console.warn('Keep alive check is not supported when using MultiLocation as currency.')
  } else if (typeof address === 'object') {
    console.warn('Keep alive check is not supported when using MultiLocation as address.')
  } else if (typeof destination === 'object') {
    console.warn('Keep alive check is not supported when using MultiLocation as destination.')
  } else if (destination === 'Ethereum') {
    console.warn('Keep alive check is not supported when using Ethereum as origin or destination.')
  } else if (!asset) {
    console.warn('Keep alive check is not supported when asset check is disabled.')
  } else {
    await checkKeepAlive({
      originApi: api,
      address,
      amount: amountStr ?? '',
      originNode: origin,
      destApi: destApiForKeepAlive,
      asset,
      destNode: destination
    })
  }
}
