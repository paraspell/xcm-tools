import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils'
import type Westend from './Westend'

vi.mock('../../pallets/polkadotXcm')

describe('Westend', () => {
  let chain: Westend<unknown, unknown>

  const mockInput = {
    assetInfo: { isNative: true, symbol: 'WND', amount: 100n }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, 'Westend'>('Westend')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('Westend')
    expect(chain.info).toBe('westend')
    expect(chain.ecosystem).toBe('Westend')
    expect(chain.version).toBe(Version.V5)
  })

  it('should create typeAndThen call when transferPolkadotXcm is invoked', async () => {
    await chain.transferPolkadotXCM(mockInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(mockInput)
  })
})
