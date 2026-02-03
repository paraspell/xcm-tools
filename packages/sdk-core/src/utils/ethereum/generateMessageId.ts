import type { TAmount } from '@paraspell/assets'

import type { IPolkadotApi } from '../../api'

export const generateMessageId = async <TApi, TRes, TSigner>(
  api: IPolkadotApi<TApi, TRes, TSigner>,
  senderAddress: string,
  sourceParaId: number,
  tokenAddress: string,
  recipientAddress: string,
  amount: TAmount
) => {
  const accountNextId = await api.getFromRpc('system', 'accountNextIndex', senderAddress)

  const sourceAccountHex = api.accountToHex(senderAddress)

  const entropy = new Uint8Array([
    ...api.stringToUint8a(sourceParaId.toString()),
    ...api.hexToUint8a(sourceAccountHex),
    ...api.stringToUint8a(accountNextId),
    ...api.hexToUint8a(tokenAddress),
    ...api.stringToUint8a(recipientAddress),
    ...api.stringToUint8a(amount.toString())
  ])

  return api.blake2AsHex(entropy)
}
