import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { transferPolkadotXcm } from '../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../types'
import CustomChain from './CustomChain'

vi.mock('../constants/chains', () => ({ chains: () => ({}) }))

vi.mock('../pallets/polkadotXcm', () => ({
  transferPolkadotXcm: vi.fn().mockResolvedValue('tx')
}))

describe('CustomChain', () => {
  beforeEach(() => {
    vi.mocked(transferPolkadotXcm).mockClear()
  })

  it('uses the chain name as both the chain key and info, and stores the supplied version', () => {
    const chain = new CustomChain<unknown, unknown, unknown>('MyCustom', 'Polkadot', Version.V5)

    expect(chain.chain).toBe('MyCustom')
    expect(chain.info).toBe('MyCustom')
    expect(chain.ecosystem).toBe('Polkadot')
    expect(chain.version).toBe(Version.V5)
  })

  it('respects an explicit version argument', () => {
    const chain = new CustomChain<unknown, unknown, unknown>('MyCustom', 'Kusama', Version.V4)
    expect(chain.version).toBe(Version.V4)
  })

  it('delegates transferPolkadotXCM to the shared helper', async () => {
    const chain = new CustomChain<unknown, unknown, unknown>('MyCustom', 'Polkadot', Version.V5)
    const input = {} as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

    const result = await chain.transferPolkadotXCM(input)

    expect(transferPolkadotXcm).toHaveBeenCalledWith(input)
    expect(result).toBe('tx')
  })
})
