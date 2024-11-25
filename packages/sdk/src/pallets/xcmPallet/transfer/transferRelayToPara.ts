import type { TNode, TRelayToParaOptions } from '../../../types'
import { determineRelayChain, getNode } from '../../../utils'
import { isPjsClient } from '../../../utils/isPjsClient'
import { getRelayChainSymbol } from '../../assets'
import { checkKeepAlive } from '../keepAlive'
import { resolveTNodeFromMultiLocation } from '../utils'

export const transferRelayToPara = async <TApi, TRes>(
  options: TRelayToParaOptions<TApi, TRes>
): Promise<TRes> => {
  const { api, destination, amount, address, paraIdTo, destApiForKeepAlive, version } = options
  const isMultiLocationDestination = typeof destination === 'object'
  const isAddressMultiLocation = typeof address === 'object'

  if (api.getApiOrUrl() === undefined && isMultiLocationDestination) {
    throw new Error('API is required when using MultiLocation as destination.')
  }

  await api.init(determineRelayChain(destination as TNode))

  try {
    const amountStr = amount.toString()

    if (isMultiLocationDestination) {
      console.warn('Keep alive check is not supported when using MultiLocation as destination.')
    } else if (isAddressMultiLocation) {
      console.warn('Keep alive check is not supported when using MultiLocation as address.')
    } else {
      await checkKeepAlive({
        originApi: api,
        address,
        amount: amountStr,
        destApi: destApiForKeepAlive,
        asset: { symbol: getRelayChainSymbol(destination) },
        destNode: destination
      })
    }

    const serializedApiCall = getNode(
      isMultiLocationDestination ? resolveTNodeFromMultiLocation(destination) : destination
    ).transferRelayToPara({
      api,
      destination,
      address,
      amount: amountStr,
      paraIdTo,
      destApiForKeepAlive,
      version
    })

    return api.callTxMethod(serializedApiCall)
  } finally {
    if (isPjsClient(api)) {
      await api.disconnect()
    }
  }
}
