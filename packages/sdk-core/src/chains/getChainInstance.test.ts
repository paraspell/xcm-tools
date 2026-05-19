import { Version } from '@paraspell/sdk-common'
import { describe, expect, it, vi } from 'vitest'

import { CustomChainInvalidError } from '../errors'
import type { TFullCustomCtx } from '../types'
import CustomChain from './CustomChain'
import { getChainImpl } from './getChainInstance'

const fakeAcalaInstance = { chain: 'Acala' }

vi.mock('../constants', () => ({
  chains: () => ({ Acala: fakeAcalaInstance })
}))

describe('getChainImpl', () => {
  it('returns the static chain instance when no custom chain matches', () => {
    expect(getChainImpl('Acala')).toBe(fakeAcalaInstance)
  })

  it('returns a CustomChain instance when the chain is registered in the ctx', () => {
    const ctx: TFullCustomCtx = {
      customChains: {
        MyCustom: {
          name: 'MyCustom',
          paraId: 4242,
          ecosystem: 'Kusama',
          providers: [],
          xcmVersion: Version.V5,
          assets: []
        }
      }
    }
    const result = getChainImpl<unknown, unknown, unknown, 'MyCustom'>('MyCustom', ctx)
    expect(result).toBeInstanceOf(CustomChain)
    expect(result.chain).toBe('MyCustom')
    expect(result.ecosystem).toBe('Kusama')
  })

  it('throws CustomChainInvalidError when the chain is not a built-in and not registered', () => {
    expect(() => getChainImpl<unknown, unknown, unknown, 'MyCustom'>('MyCustom')).toThrow(
      CustomChainInvalidError
    )
  })
})
