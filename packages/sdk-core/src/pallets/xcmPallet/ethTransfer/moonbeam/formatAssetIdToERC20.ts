// Inspired by Moonbeam XCM-SDK
// https://github.com/moonbeam-foundation/xcm-sdk/blob/ab835c15bf41612604b1c858d956a9f07705ed65/packages/utils/src/format/asset.ts#L1
export const formatAssetIdToERC20 = (id: string) => {
  if (id.startsWith('0x')) {
    return id
  }

  if (!/^\d{38,39}$/.test(id)) {
    throw new Error(`Asset id: ${id} must be a string and have 38-39 digits`)
  }

  return `0xffffffff${BigInt(id).toString(16).padStart(32, '0')}`
}
