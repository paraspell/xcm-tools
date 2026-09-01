import type { TAssetInfo } from '@paraspell/assets'
import { InvalidCurrencyError } from '@paraspell/assets'
import { describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { buildErc20StorageMint } from './hydrationErc20Mint'

const SUBSTRATE_ACCOUNT = new Uint8Array(32).fill(0x11)
// "ETH\0" ++ evm address ++ 8 zero bytes
const EVM_DERIVED_ACCOUNT = new Uint8Array([
  0x45,
  0x54,
  0x48,
  0x00,
  ...new Array<number>(20).fill(0x22),
  ...new Array<number>(8).fill(0)
])

const accountToUint8a = vi.fn()
const mockApi = { accountToUint8a } as unknown as PolkadotApi<unknown, unknown, unknown>

const GDOT = {
  symbol: 'GDOT',
  location: {
    parents: 1,
    interior: {
      X2: [
        { Parachain: 2034 },
        { AccountKey20: { network: null, key: '0x34d5ffb83d14d82f87aaf2f13be895a3c814c2ad' } }
      ]
    }
  }
} as TAssetInfo

const HOLLAR = {
  symbol: 'HOLLAR',
  location: { parents: 1, interior: { X2: [{ Parachain: 2034 }, { GeneralIndex: 222 }] } }
} as TAssetInfo

describe('buildErc20StorageMint', () => {
  it('resolves the contract from the location and overrides the slot of the truncated account id', () => {
    accountToUint8a.mockReturnValue(SUBSTRATE_ACCOUNT)

    const res = buildErc20StorageMint(mockApi, '7Addr', GDOT, { balanceSlot: 52 }, 1000n)

    expect(accountToUint8a).toHaveBeenCalledWith('7Addr')
    expect(res).toEqual({
      balanceTx: {
        module: 'System',
        method: 'set_storage',
        params: {
          items: [
            [
              '0x1da53b775b270400e7e61ed5cbc5a146ab1160471b1418779239ba8e2b847e427c7c480ad02bf44a37222acad13feca334d5ffb83d14d82f87aaf2f13be895a3c814c2adf47b2cf0c65c3d6991898b45680ae7028ee5c6d0f09ed4a56827e2ee3d800c2ec73b9f453182c978c1056d4bc2bf89e9',
              '0x00000000000000000000000000000000000000000000000000000000000003e8'
            ]
          ]
        }
      }
    })
  })

  it('uses the explicit contract and the embedded EVM address of EVM derived account ids', () => {
    accountToUint8a.mockReturnValue(EVM_DERIVED_ACCOUNT)

    const res = buildErc20StorageMint(
      mockApi,
      '7Addr',
      HOLLAR,
      { balanceSlot: 3, contract: '0x531a654d1696ed52e7275a8cede955e82620f99a' },
      0n
    )

    expect(res.balanceTx.params).toEqual({
      items: [
        [
          '0x1da53b775b270400e7e61ed5cbc5a146ab1160471b1418779239ba8e2b847e42cd8ff52365cba4a7b11f43a927e00642531a654d1696ed52e7275a8cede955e82620f99af723325a2597a93637e884836fbb318453af42d0a8bf5903ecbc159ba2f6e0fa2dc0165bfe911ace311677c562114276',
          '0x0000000000000000000000000000000000000000000000000000000000000000'
        ]
      ]
    })
  })

  it('throws when the contract cannot be resolved', () => {
    expect(() => buildErc20StorageMint(mockApi, '7Addr', HOLLAR, { balanceSlot: 3 }, 0n)).toThrow(
      InvalidCurrencyError
    )
  })
})
