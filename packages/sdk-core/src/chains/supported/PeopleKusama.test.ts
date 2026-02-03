import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils'
import PeopleKusama from './PeopleKusama'

vi.mock('../../pallets/polkadotXcm')

describe('PeopleKusama', () => {
  let chain: PeopleKusama<unknown, unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, unknown, 'PeopleKusama'>('PeopleKusama')
  })

  it('should initialize with correct values', () => {
    expect(chain).toBeInstanceOf(PeopleKusama)
    expect(chain.chain).toBe('PeopleKusama')
    expect(chain.info).toBe('kusamaPeople')
    expect(chain.ecosystem).toBe('Kusama')
    expect(chain.version).toBe(Version.V5)
  })

  it('should throw an error when scenario is ParaToPara', () => {
    const input = { scenario: 'ParaToPara' } as TPolkadotXCMTransferOptions<
      unknown,
      unknown,
      unknown
    >
    expect(() => chain.transferPolkadotXCM(input)).toThrow(ScenarioNotSupportedError)
  })

  it('should use typeAndThen when scenario is not ParaToPara', async () => {
    const input = { scenario: 'ParaToRelay' } as TPolkadotXCMTransferOptions<
      unknown,
      unknown,
      unknown
    >
    await chain.transferPolkadotXCM(input)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(input)
  })
})
