import type { MockInstance } from 'vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as InternalBuilder from '../builder'
import PolkadotJsApi from './PolkadotJsApi'
import { Builder } from './builder'
import type { ApiPromise } from '@polkadot/api'

vi.mock('./PolkadotJsApi')
vi.mock('../builder')

describe('Builder Function', () => {
  const mockApi = {} as ApiPromise
  let setApiSpy: MockInstance

  beforeEach(() => {
    setApiSpy = vi.spyOn(PolkadotJsApi.prototype, 'setApi')
  })

  it('should initialize PolkadotJsApi and call setApi with the provided api', () => {
    Builder(mockApi)

    expect(setApiSpy).toHaveBeenCalledWith(mockApi)
    expect(InternalBuilder.Builder).toHaveBeenCalledWith(expect.any(PolkadotJsApi))
  })

  it('should call InternalBuilder.Builder with a PolkadotJsApi instance', () => {
    Builder(mockApi)

    expect(InternalBuilder.Builder).toHaveBeenCalledWith(expect.any(PolkadotJsApi))
  })

  it('should work correctly when api is undefined', () => {
    Builder()

    expect(setApiSpy).toHaveBeenCalledWith(undefined)
    expect(InternalBuilder.Builder).toHaveBeenCalledWith(expect.any(PolkadotJsApi))
  })
})
