import type { PolkadotApi, TBuildEvmTransferOptions } from '@paraspell/sdk-core'
import { ScenarioNotSupportedError, UnsupportedOperationError } from '@paraspell/sdk-core'
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

  it('rejects Darwinia EVM transfers to Kusama-ecosystem destinations', async () => {
    for (const to of ['Karura', 'AssetHubKusama', 'Kusama'] as const) {
      await expect(buildEvmTransfer({ ...baseOptions, to })).rejects.toThrow(
        ScenarioNotSupportedError
      )
      await expect(buildEvmTransfer({ ...baseOptions, to })).rejects.toThrow(
        'Origin and destination must share the same relay chain unless using a bridge.'
      )
    }
  })

  it('still builds Darwinia EVM transfers to Polkadot-ecosystem destinations', async () => {
    for (const to of ['Acala', 'AssetHubPolkadot', 'Polkadot'] as const) {
      const result = await buildEvmTransfer({ ...baseOptions, to })
      expect(result).toEqual(evmTx)
    }
  })

  it('does not apply the relay-chain check to external destinations', async () => {
    const result = await buildEvmTransfer({ ...baseOptions, to: 'Ethereum' })
    expect(result).toEqual(evmTx)
  })
})
