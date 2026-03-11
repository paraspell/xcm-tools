import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils/getChain'
import type Basilisk from './Basilisk'

vi.mock('../../pallets/polkadotXcm')

describe('Basilisk', () => {
  let chain: Basilisk<unknown, unknown, unknown>

  const mockInput = {
    assetInfo: { symbol: 'BSX', assetId: '123', amount: 100n }
  } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>
  beforeEach(() => {
    chain = getChain<unknown, unknown, unknown, 'Basilisk'>('Basilisk')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('Basilisk')
    expect(chain.info).toBe('basilisk')
    expect(chain.ecosystem).toBe('Kusama')
    expect(chain.version).toBe(Version.V5)
  })

  it('should create typeAndThen call when transferPolkadotXcm is invoked', async () => {
    await chain.transferPolkadotXCM(mockInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(mockInput)
  })
})
