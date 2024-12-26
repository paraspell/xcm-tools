import type { MockInstance } from 'vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as sdkCore from '@paraspell/sdk-core'
import PolkadotJsApi from './PolkadotJsApi'
import { Builder } from './builder'
import type { ApiPromise } from '@polkadot/api'

vi.mock('./PolkadotJsApi')
vi.mock('@paraspell/sdk-core')

describe('Builder Function', () => {
  const mockApi = {} as ApiPromise
  let setApiSpy: MockInstance

  beforeEach(() => {
    setApiSpy = vi.spyOn(PolkadotJsApi.prototype, 'setApi')
  })

  it('should initialize PolkadotJsApi and call setApi with the provided api', () => {
    Builder(mockApi)

    expect(setApiSpy).toHaveBeenCalledWith(mockApi)
    expect(sdkCore.Builder).toHaveBeenCalledWith(expect.any(PolkadotJsApi))
  })

  it('should call InternalBuilder.Builder with a PolkadotJsApi instance', () => {
    Builder(mockApi)

    expect(sdkCore.Builder).toHaveBeenCalledWith(expect.any(PolkadotJsApi))
  })

  it('should work correctly when api is undefined', () => {
    Builder()

    expect(setApiSpy).toHaveBeenCalledWith(undefined)
    expect(sdkCore.Builder).toHaveBeenCalledWith(expect.any(PolkadotJsApi))
  })
})
