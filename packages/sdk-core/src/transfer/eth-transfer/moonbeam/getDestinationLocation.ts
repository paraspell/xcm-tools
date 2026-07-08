import { getAssetsObject } from '@paraspell/assets'
import type { TChain } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../../api'

// Partially inspired by Moonbeam XCM-SDK
// https://github.com/moonbeam-foundation/xcm-sdk/blob/ab835c15bf41612604b1c858d956a9f07705ed65/packages/builder/src/contract/contracts/Xtokens/Xtokens.ts#L126
export const getDestinationLocation = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  address: string,
  destination: TChain
) => {
  const { isEVM } = getAssetsObject(destination)
  const accountType = isEVM ? '03' : '01'

  const addressHex = api.accountToHex(address, false)

  const acc = `0x${accountType}${addressHex}00`

  const paraId = api.getParaId(destination)

  return [1, paraId ? [`0x0000000${paraId.toString(16)}`, acc] : [acc]]
}
