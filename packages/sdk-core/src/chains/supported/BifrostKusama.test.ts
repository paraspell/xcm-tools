import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it } from 'vitest'

import { getChain } from '../../utils'
import type BifrostKusama from './BifrostKusama'

describe('BifrostKusama', () => {
  let bifrostKusama: BifrostKusama<unknown, unknown>

  beforeEach(() => {
    bifrostKusama = getChain<unknown, unknown, 'BifrostKusama'>('BifrostKusama')
  })

  it('should initialize with correct values', () => {
    expect(bifrostKusama.chain).toBe('BifrostKusama')
    expect(bifrostKusama.info).toBe('bifrost')
    expect(bifrostKusama.ecosystem).toBe('Kusama')
    expect(bifrostKusama.version).toBe(Version.V5)
  })
})
