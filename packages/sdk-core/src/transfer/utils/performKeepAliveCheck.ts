import type { TAsset, TSendOptions, WithAmount } from '../../types'
import { checkKeepAlive } from '../keepAlive'

export const performKeepAliveCheck = async <TApi, TRes>(
  options: TSendOptions<TApi, TRes>,
  asset: WithAmount<TAsset> | null
) => {
  const { api, origin, destination, currency, address, destApiForKeepAlive } = options
  if ('multilocation' in currency || 'multiasset' in currency) {
    console.warn(
      'Keep alive check is not supported when using MultiLocation / MultiAsset as currency.'
    )
  } else if (typeof address === 'object') {
    console.warn('Keep alive check is not supported when using MultiLocation as address.')
  } else if (typeof destination === 'object') {
    console.warn('Keep alive check is not supported when using MultiLocation as destination.')
  } else if (destination === 'Ethereum') {
    console.warn('Keep alive check is not supported when using Ethereum as origin or destination.')
  } else if (!asset) {
    console.warn('Keep alive check is not supported when asset check is disabled.')
  } else {
    const destApi = destApiForKeepAlive ?? api.clone()
    await checkKeepAlive<TApi, TRes>({
      api,
      origin,
      destination,
      address,
      destApi,
      asset
    })
  }
}
