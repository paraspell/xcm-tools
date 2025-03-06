import * as sdkCore from '@paraspell/sdk-core'
import type { MockInstance } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Builder } from './builder'
import PapiApi from './PapiApi'
import type { TPapiApi } from './types'

vi.mock('./PapiApi')
vi.mock('@paraspell/sdk-core')

describe('Builder Function using PapiApi', () => {
  const mockApi = {} as TPapiApi
  let setApiSpy: MockInstance

  beforeEach(() => {
    setApiSpy = vi.spyOn(PapiApi.prototype, 'setApi')
  })

  it('should initialize PapiApi and call setApi with the provided api', () => {
    Builder(mockApi)

    expect(setApiSpy).toHaveBeenCalledWith(mockApi)
    expect(sdkCore.Builder).toHaveBeenCalledWith(expect.any(PapiApi))
  })

  it('should call InternalBuilder.Builder with a PapiApi instance', () => {
    Builder(mockApi)

    expect(sdkCore.Builder).toHaveBeenCalledWith(expect.any(PapiApi))
  })

  it('should work correctly when api is undefined', () => {
    Builder()

    expect(setApiSpy).toHaveBeenCalledWith(undefined)
    expect(sdkCore.Builder).toHaveBeenCalledWith(expect.any(PapiApi))
  })
})
