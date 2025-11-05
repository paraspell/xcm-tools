import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils'
import type Moonriver from './Moonriver'

vi.mock('../../pallets/polkadotXcm')

describe('Moonriver', () => {
  let chain: Moonriver<unknown, unknown>

  const api = {
    createAccountId: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown>

  const mockInput = {
    api,
    version: Version.V5,
    assetInfo: {
      symbol: 'MOVR',
      amount: 100n
    }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, 'Moonriver'>('Moonriver')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('Moonriver')
    expect(chain.info).toBe('moonriver')
    expect(chain.ecosystem).toBe('Kusama')
    expect(chain.version).toBe(Version.V5)
  })

  it('should call transferPolkadotXCM with transfer_assets', async () => {
    await chain.transferPolkadotXCM(mockInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(mockInput, 'transfer_assets', 'Unlimited')
  })
})
