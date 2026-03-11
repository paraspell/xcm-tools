import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils'
import PeoplePolkadot from './PeoplePolkadot'

vi.mock('../../pallets/polkadotXcm')

describe('PeoplePolkadot', () => {
  let chain: PeoplePolkadot<unknown, unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, unknown, 'PeoplePolkadot'>('PeoplePolkadot')
  })

  it('should initialize with correct values', () => {
    expect(chain).toBeInstanceOf(PeoplePolkadot)
    expect(chain.chain).toBe('PeoplePolkadot')
    expect(chain.info).toBe('polkadotPeople')
    expect(chain.ecosystem).toBe('Polkadot')
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
