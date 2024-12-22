import type { IPolkadotApi } from '../../../../api'
import { getNodeConfig } from '../../../../nodes/config'
import type { TNodePolkadotKusama } from '../../../../types'
import { getAssetsObject } from '../../../assets'

// Partially inspired by Moonbeam XCM-SDK
// https://github.com/moonbeam-foundation/xcm-sdk/blob/ab835c15bf41612604b1c858d956a9f07705ed65/packages/builder/src/contract/contracts/Xtokens/Xtokens.ts#L126
export const getDestinationMultilocation = <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>,
  address: string,
  destination: TNodePolkadotKusama
) => {
  const { isEVM } = getAssetsObject(destination)
  const accountType = isEVM ? '03' : '01'

  const addressHex = api.accountToHex(address, false)

  const acc = `0x${accountType}${addressHex}00`

  const { paraId } = getNodeConfig(destination)

  return [1, [`0x0000000${paraId.toString(16)}`, acc]]
}
