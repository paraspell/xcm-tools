import type { TAmount } from '@paraspell/assets'

import type { PolkadotApi } from '../../api'

export const generateMessageId = async <TApi, TRes, TSigner, TCustomChain extends string = never>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  senderAddress: string,
  sourceParaId: number,
  tokenAddress: string,
  recipient: string,
  amount: TAmount
) => {
  const accountNextId = await api.getFromRpc('system', 'accountNextIndex', senderAddress)

  const sourceAccountHex = api.accountToHex(senderAddress)

  const entropy = new Uint8Array([
    ...api.stringToUint8a(sourceParaId.toString()),
    ...api.hexToUint8a(sourceAccountHex),
    ...api.stringToUint8a(accountNextId),
    ...api.hexToUint8a(tokenAddress),
    ...api.stringToUint8a(recipient),
    ...api.stringToUint8a(amount.toString())
  ])

  return api.blake2AsHex(entropy)
}
