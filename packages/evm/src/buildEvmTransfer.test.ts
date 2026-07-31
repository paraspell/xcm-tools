import type { PolkadotApi, TBuildEvmTransferOptions } from '@paraspell/sdk-core'
import { UnsupportedOperationError } from '@paraspell/sdk-core'
import { darwinia } from 'viem/chains'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { buildEvmTransfer } from './buildEvmTransfer'
import { buildXTokensEvm } from './xTokens/buildXTokensEvm'

vi.mock('./xTokens/buildXTokensEvm')

describe('buildEvmTransfer', () => {
  const mockApi = {} as PolkadotApi<unknown, unknown, unknown>
  const baseOptions: TBuildEvmTransferOptions<unknown, unknown, unknown> = {
    api: mockApi,
    from: 'Darwinia',
    to: 'AssetHubPolkadot',
    sender: '0x1111111111111111111111111111111111111111',
    recipient: 'some-address',
    currency: { symbol: 'RING', amount: '1' }
  }

  const evmTx = {
    type: 'eip1559' as const,
    chainId: darwinia.id,
    to: '0xprecompile' as const,
    data: '0xdata' as const,
    value: 0n
  }
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(buildXTokensEvm).mockReturnValue(evmTx)
  })

  it('routes Darwinia origins to buildXTokensEvm', async () => {
    const result = await buildEvmTransfer(baseOptions)
    expect(buildXTokensEvm).toHaveBeenCalledWith(expect.any(Object))
    expect(result).toEqual(evmTx)
  })

  it('throws UnsupportedOperationError for non-EVM origins', async () => {
    await expect(buildEvmTransfer({ ...baseOptions, from: 'Acala' })).rejects.toThrow(
      UnsupportedOperationError
    )
  })
})
