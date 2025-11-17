import * as sdkCore from '@paraspell/sdk-core'
import { describe, expect, it, vi } from 'vitest'

import { Builder } from './builder'
import PapiApi from './PapiApi'
import type { TPapiApi } from './types'

vi.mock('@paraspell/sdk-core')

vi.mock('./PapiApi')

describe('Builder Function using PapiApi', () => {
  const mockApi = {} as TPapiApi

  it('should initialize PapiApi and call setApi with the provided api', () => {
    Builder(mockApi)
    expect(sdkCore.Builder).toHaveBeenCalledWith(expect.any(PapiApi))
  })

  it('should call InternalBuilder.Builder with a PapiApi instance', () => {
    Builder(mockApi)
    expect(sdkCore.Builder).toHaveBeenCalledWith(expect.any(PapiApi))
  })

  it('should work correctly when api is undefined', () => {
    Builder()
    expect(sdkCore.Builder).toHaveBeenCalledWith(expect.any(PapiApi))
  })
})
