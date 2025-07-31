import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getChain } from '../../utils'
import type Penpal from './Penpal'

describe('Penpal', () => {
  let chain: Penpal<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getChain<unknown, unknown, 'Penpal'>('Penpal')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('Penpal')
    expect(chain.info).toBe('westendPenpal')
    expect(chain.type).toBe('westend')
    expect(chain.version).toBe(Version.V4)
  })
})
