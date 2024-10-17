import type { MockInstance } from 'vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as InternalBuilder from '../builder'
import PapiApi from './PapiApi'
import { Builder } from './builder'
import type { PolkadotClient } from 'polkadot-api'

vi.mock('./PapiApi')
vi.mock('../builder')

describe('Builder Function using PapiApi', () => {
  const mockApi = {} as PolkadotClient
  let setApiSpy: MockInstance

  beforeEach(() => {
    setApiSpy = vi.spyOn(PapiApi.prototype, 'setApi')
  })

  it('should initialize PapiApi and call setApi with the provided api', () => {
    Builder(mockApi)

    expect(setApiSpy).toHaveBeenCalledWith(mockApi)
    expect(InternalBuilder.Builder).toHaveBeenCalledWith(expect.any(PapiApi))
  })

  it('should call InternalBuilder.Builder with a PapiApi instance', () => {
    Builder(mockApi)

    expect(InternalBuilder.Builder).toHaveBeenCalledWith(expect.any(PapiApi))
  })

  it('should work correctly when api is undefined', () => {
    Builder()

    expect(setApiSpy).toHaveBeenCalledWith(undefined)
    expect(InternalBuilder.Builder).toHaveBeenCalledWith(expect.any(PapiApi))
  })
})
