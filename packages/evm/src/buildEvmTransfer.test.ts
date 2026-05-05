import type { PolkadotApi, TBuildEvmTransferOptions } from '@paraspell/sdk-core'
import { UnsupportedOperationError } from '@paraspell/sdk-core'
import { moonbeam } from 'viem/chains'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { buildEvmTransfer } from './buildEvmTransfer'
import { buildMoonbeamEvm } from './moonbeam/buildMoonbeamEvm'
import { buildMoonbeamToEth } from './moonbeam/buildMoonbeamToEth'

vi.mock('./moonbeam/buildMoonbeamEvm')
vi.mock('./moonbeam/buildMoonbeamToEth')

describe('buildEvmTransfer', () => {
  const mockApi = {} as PolkadotApi<unknown, unknown, unknown>
  const baseOptions: TBuildEvmTransferOptions<unknown, unknown, unknown> = {
    api: mockApi,
    from: 'Moonbeam',
    to: 'AssetHubPolkadot',
    sender: '0x1111111111111111111111111111111111111111',
    recipient: 'some-address',
    currency: { symbol: 'GLMR', amount: '1' }
  }

  const evmTx = {
    type: 'eip1559' as const,
    chainId: moonbeam.id,
    to: '0xprecompile' as const,
    data: '0xdata' as const,
    value: 0n
  }
  const ethTx = {
    type: 'eip1559' as const,
    chainId: moonbeam.id,
    to: '0xxcmprecompile' as const,
    data: '0xxcmdata' as const,
    value: 0n
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(buildMoonbeamEvm).mockReturnValue(evmTx)
    vi.mocked(buildMoonbeamToEth).mockResolvedValue(ethTx)
  })

  it('routes Moonbeam → Ethereum to buildMoonbeamToEth', async () => {
    const result = await buildEvmTransfer({ ...baseOptions, to: 'Ethereum' })
    expect(buildMoonbeamToEth).toHaveBeenCalled()
    expect(buildMoonbeamEvm).not.toHaveBeenCalled()
    expect(result).toEqual(ethTx)
  })

  it('routes Moonbeam-family origins to buildMoonbeamEvm', async () => {
    const result = await buildEvmTransfer(baseOptions)
    expect(buildMoonbeamEvm).toHaveBeenCalledWith(expect.any(Object))
    expect(buildMoonbeamToEth).not.toHaveBeenCalled()
    expect(result).toEqual(evmTx)
  })

  it('throws UnsupportedOperationError for non-EVM origins', async () => {
    await expect(buildEvmTransfer({ ...baseOptions, from: 'Acala' })).rejects.toThrow(
      UnsupportedOperationError
    )
  })
})
