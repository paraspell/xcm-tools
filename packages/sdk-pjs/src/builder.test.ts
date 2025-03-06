import * as sdkCore from '@paraspell/sdk-core'
import type { ApiPromise } from '@polkadot/api'
import type { MockInstance } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Builder } from './builder'
import PolkadotJsApi from './PolkadotJsApi'

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
