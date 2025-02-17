import type { IPolkadotApi } from '../../api'
import type { TAmount } from '../../types'

export const generateMessageId = async <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>,
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
