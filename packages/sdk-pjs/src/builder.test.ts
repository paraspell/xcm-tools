import * as sdkCore from '@paraspell/sdk-core'
import type { ApiPromise } from '@polkadot/api'
import { describe, expect, it, vi } from 'vitest'

import { Builder } from './builder'
import PolkadotJsApi from './PolkadotJsApi'

vi.mock('./PolkadotJsApi')
vi.mock('@paraspell/sdk-core', async importActual => ({
  ...(await importActual()),
  Builder: vi.fn()
}))

describe('Builder Function', () => {
  const mockApi = {} as ApiPromise

  it('should initialize PolkadotJsApi and call setApi with the provided api', () => {
    Builder(mockApi)
    expect(sdkCore.Builder).toHaveBeenCalledWith(expect.any(PolkadotJsApi))
  })

  it('should call InternalBuilder.Builder with a PolkadotJsApi instance', () => {
    Builder(mockApi)
    expect(sdkCore.Builder).toHaveBeenCalledWith(expect.any(PolkadotJsApi))
  })

  it('should work correctly when api is undefined', () => {
    Builder()
    expect(sdkCore.Builder).toHaveBeenCalledWith(expect.any(PolkadotJsApi))
  })
})
