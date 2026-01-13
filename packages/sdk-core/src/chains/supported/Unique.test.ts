import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions, TTransferLocalOptions } from '../../types'
import { getChain } from '../../utils/getChain'
import type Unique from './Unique'

vi.mock('../../pallets/polkadotXcm')

describe('Unique', () => {
  let chain: Unique<unknown, unknown>

  const mockInput = {
    assetInfo: { symbol: 'GLMR', assetId: '123', amount: 100n }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, 'Unique'>('Unique')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('Unique')
    expect(chain.info).toBe('unique')
    expect(chain.ecosystem).toBe('Polkadot')
    expect(chain.version).toBe(Version.V5)
  })

  it('should create typeAndThen call when transferPolkadotXcm is invoked', async () => {
    await chain.transferPolkadotXCM(mockInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(mockInput)
  })

  it('should throw an error when trying to create a local foreign asset transfer', () => {
    const input = {
      api: {} as unknown as IPolkadotApi<unknown, unknown>,
      assetInfo: {
        symbol: 'GLMR',
        assetId: '123'
      },
      to: 'Unique'
    } as TTransferLocalOptions<unknown, unknown>

    expect(() => chain.transferLocalNonNativeAsset(input)).toThrow(ScenarioNotSupportedError)
  })
})
