import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils'
import type Kusama from './Kusama'

vi.mock('../../pallets/polkadotXcm')

describe('Kusama', () => {
  let chain: Kusama<unknown, unknown>

  const mockInput = {
    assetInfo: { isNative: true, symbol: 'KSM', amount: 100n }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, 'Kusama'>('Kusama')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('Kusama')
    expect(chain.info).toBe('kusama')
    expect(chain.ecosystem).toBe('Kusama')
    expect(chain.version).toBe(Version.V5)
  })

  it('should create typeAndThen call when transferPolkadotXcm is invoked', async () => {
    await chain.transferPolkadotXCM(mockInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(mockInput)
  })
})
