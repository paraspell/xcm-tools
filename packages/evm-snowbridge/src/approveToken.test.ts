import {
  assertHasId,
  findAssetInfoOrThrow,
  InvalidAddressError,
  MissingParameterError,
  type TAssetInfo
} from '@paraspell/sdk-core'
import type { BridgeInfo } from '@snowbridge/base-types'
import { bridgeInfoFor } from '@snowbridge/registry'
import { type WalletClient } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { approveToken } from './approveToken'

vi.mock('@paraspell/sdk-core', async importOriginal => ({
  ...(await importOriginal()),
  assertHasId: vi.fn(),
  findAssetInfoOrThrow: vi.fn()
}))

vi.mock('@snowbridge/registry')

const GATEWAY = '0x1111111111111111111111111111111111111111'
const ASSET_ID = '0x2222222222222222222222222222222222222222'

const buildSigner = (overrides: Partial<WalletClient> = {}) =>
  ({
    writeContract: vi.fn().mockResolvedValue('0xdeadbeef'),
    getAddresses: vi.fn().mockResolvedValue([]),
    account: { address: '0x3333333333333333333333333333333333333333' },
    chain: { id: 1 },
    ...overrides
  }) as unknown as WalletClient

describe('approveToken', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const asset: TAssetInfo = {
      symbol: 'WETH',
      decimals: 18,
      assetId: ASSET_ID,
      location: { parents: 0, interior: 'Here' }
    }
    vi.mocked(findAssetInfoOrThrow).mockReturnValue(asset)
    vi.mocked(bridgeInfoFor).mockReturnValue({
      environment: { gatewayContract: GATEWAY }
    } as BridgeInfo)
  })

  it('writes an ERC-20 approve to the gateway and returns the hash', async () => {
    const signer = buildSigner()

    const hash = await approveToken(signer, 1_000n, 'WETH')

    expect(hash).toBe('0xdeadbeef')
    expect(assertHasId).toHaveBeenCalled()
    expect(signer.writeContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: ASSET_ID,
        functionName: 'approve',
        args: [GATEWAY, 1_000n],
        account: signer.account,
        chain: signer.chain
      })
    )
  })

  it('falls back to getAddresses() when signer has no pre-attached account', async () => {
    const address = '0x4444444444444444444444444444444444444444'
    const signer = buildSigner({
      account: undefined,
      getAddresses: vi.fn().mockResolvedValue([address])
    })

    await approveToken(signer, 1n, 'WETH')

    expect(signer.getAddresses).toHaveBeenCalled()
    expect(signer.writeContract).toHaveBeenCalledWith(expect.objectContaining({ account: address }))
  })

  it('passes chain=null when signer.chain is undefined', async () => {
    const signer = buildSigner({ chain: undefined })

    await approveToken(signer, 1n, 'WETH')

    expect(signer.writeContract).toHaveBeenCalledWith(expect.objectContaining({ chain: null }))
  })

  it('throws MissingParameterError when no account is available', async () => {
    const signer = buildSigner({
      account: undefined,
      getAddresses: vi.fn().mockResolvedValue([])
    })

    await expect(approveToken(signer, 1n, 'WETH')).rejects.toThrow(MissingParameterError)
  })

  it('throws InvalidAddressError when the gateway contract is not a valid address', async () => {
    vi.mocked(bridgeInfoFor).mockReturnValue({
      environment: { gatewayContract: 'not-an-address' }
    } as BridgeInfo)

    await expect(approveToken(buildSigner(), 1n, 'WETH')).rejects.toThrow(InvalidAddressError)
  })

  it('throws InvalidAddressError when the asset id is not a valid address', async () => {
    const asset: TAssetInfo = {
      symbol: 'WETH',
      decimals: 18,
      assetId: 'not-an-address',
      location: { parents: 0, interior: 'Here' }
    }
    vi.mocked(findAssetInfoOrThrow).mockReturnValue(asset)

    await expect(approveToken(buildSigner(), 1n, 'WETH')).rejects.toThrow(InvalidAddressError)
  })
})
