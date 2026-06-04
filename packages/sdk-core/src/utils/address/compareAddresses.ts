import type { PolkadotApi } from '../../api'

export const compareAddresses = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  addr1: string,
  addr2: string
): boolean => {
  const hex1 = api.accountToHex(addr1)
  const hex2 = api.accountToHex(addr2)
  return hex1 === hex2
}
