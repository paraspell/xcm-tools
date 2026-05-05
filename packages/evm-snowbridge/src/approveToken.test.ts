import { MissingParameterError } from '@paraspell/sdk-core'
import { type WalletClient } from 'viem'
import { mainnet } from 'viem/chains'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { approveToken } from './approveToken'
import { buildApproveToken } from './buildApproveToken'

vi.mock('./buildApproveToken')

const ASSET_ID = '0x2222222222222222222222222222222222222222'
const ACCOUNT = '0x3333333333333333333333333333333333333333'
const TX_HASH = '0xdeadbeef'

const buildSigner = (overrides: Partial<WalletClient> = {}) =>
  ({
    sendTransaction: vi.fn().mockResolvedValue(TX_HASH),
    getAddresses: vi.fn().mockResolvedValue([]),
    account: { address: ACCOUNT },
    chain: { id: 1 },
    ...overrides
  }) as unknown as WalletClient

describe('approveToken', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(buildApproveToken).mockReturnValue({
      type: 'eip1559',
      chainId: mainnet.id,
      to: ASSET_ID,
      data: '0xcalldata',
      value: 0n
    })
  })

  it('builds the approve and signs+sends via the WalletClient', async () => {
    const signer = buildSigner()

    const hash = await approveToken(signer, 1_000n, 'WETH')

    expect(hash).toBe(TX_HASH)
    expect(buildApproveToken).toHaveBeenCalledWith('WETH', 1_000n)
    expect(signer.sendTransaction).toHaveBeenCalledWith({
      type: 'eip1559',
      chainId: mainnet.id,
      to: ASSET_ID,
      data: '0xcalldata',
      value: 0n,
      account: signer.account,
      chain: signer.chain
    })
  })

  it('falls back to getAddresses() when signer has no pre-attached account', async () => {
    const fallback = '0x4444444444444444444444444444444444444444'
    const signer = buildSigner({
      account: undefined,
      getAddresses: vi.fn().mockResolvedValue([fallback])
    })

    await approveToken(signer, 1n, 'WETH')

    expect(signer.getAddresses).toHaveBeenCalled()
    expect(signer.sendTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ account: fallback })
    )
  })

  it('throws MissingParameterError when no account is available', async () => {
    const signer = buildSigner({
      account: undefined,
      getAddresses: vi.fn().mockResolvedValue([])
    })

    await expect(approveToken(signer, 1n, 'WETH')).rejects.toThrow(MissingParameterError)
  })
})
