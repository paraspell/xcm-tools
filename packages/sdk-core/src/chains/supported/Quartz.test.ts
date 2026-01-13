import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils'
import type Quartz from './Quartz'

vi.mock('../../pallets/polkadotXcm')

describe('Quartz', () => {
  let chain: Quartz<unknown, unknown>

  const mockInput = {
    assetInfo: { symbol: 'USDt', assetId: '123', amount: 100n }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, 'Quartz'>('Quartz')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('Quartz')
    expect(chain.info).toBe('quartz')
    expect(chain.ecosystem).toBe('Kusama')
    expect(chain.version).toBe(Version.V5)
  })

  it('should create typeAndThen call when transferPolkadotXcm is invoked', async () => {
    await chain.transferPolkadotXCM(mockInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(mockInput)
  })
})
