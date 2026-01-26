import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils'
import type Paseo from './Paseo'

vi.mock('../../pallets/polkadotXcm')

describe('Paseo', () => {
  let chain: Paseo<unknown, unknown>

  const mockInput = {
    assetInfo: { isNative: true, symbol: 'PAS', amount: 100n }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, 'Paseo'>('Paseo')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('Paseo')
    expect(chain.info).toBe('paseo')
    expect(chain.ecosystem).toBe('Paseo')
    expect(chain.version).toBe(Version.V5)
  })

  it('should create typeAndThen call when transferPolkadotXcm is invoked', async () => {
    await chain.transferPolkadotXCM(mockInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(mockInput)
  })
})
