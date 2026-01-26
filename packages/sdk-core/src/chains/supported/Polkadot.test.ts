import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils'
import type Polkadot from './Polkadot'

vi.mock('../../pallets/polkadotXcm')

describe('Polkadot', () => {
  let chain: Polkadot<unknown, unknown>

  const mockInput = {
    assetInfo: { isNative: true, symbol: 'DOT', amount: 100n }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, 'Polkadot'>('Polkadot')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('Polkadot')
    expect(chain.info).toBe('polkadot')
    expect(chain.ecosystem).toBe('Polkadot')
    expect(chain.version).toBe(Version.V5)
  })

  it('should create typeAndThen call when transferPolkadotXcm is invoked', async () => {
    await chain.transferPolkadotXCM(mockInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(mockInput)
  })
})
