import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getNode } from '../../utils'
import type PeopleWestend from './PeopleWestend'

describe('PeopleWestend', () => {
  let chain: PeopleWestend<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getNode<unknown, unknown, 'PeopleWestend'>('PeopleWestend')
  })

  it('should initialize with correct values', () => {
    expect(chain.node).toBe('PeopleWestend')
    expect(chain.info).toBe('westendPeople')
    expect(chain.type).toBe('westend')
    expect(chain.version).toBe(Version.V5)
  })
})
