import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MissingChainApiError } from '../errors'
import type { TBuilderConfig } from '../types'
import { resolveChainApi } from './resolveChainApi'

const CHAIN = 'Acala'
const WS_URL = 'wss://acala.example.com'
const fakeApi: object = { type: 'api', connected: true, version: '1.0' }

const createApiInstance = vi.fn<() => Promise<object>>().mockResolvedValue(fakeApi)

vi.mock('../chains/config', () => ({
  getChainProviders: vi.fn(() => 'wss://default-provider')
}))

describe('resolveChainApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses default provider when config is undefined', async () => {
    const result = await resolveChainApi(undefined, CHAIN, createApiInstance)

    expect(createApiInstance).toHaveBeenCalledWith('wss://default-provider')
    expect(result).toBe(fakeApi)
  })

  it('uses default provider when config is an empty object', async () => {
    const result = await resolveChainApi({}, CHAIN, createApiInstance)

    expect(createApiInstance).toHaveBeenCalledWith('wss://default-provider')
    expect(result).toBe(fakeApi)
  })

  it('creates api from string url passed directly as config', async () => {
    const result = await resolveChainApi(WS_URL, CHAIN, createApiInstance)

    expect(createApiInstance).toHaveBeenCalledWith(WS_URL)
    expect(result).toBe(fakeApi)
  })

  it('creates api from string array passed directly as config', async () => {
    const urls = ['wss://a', 'wss://b']
    const result = await resolveChainApi(urls, CHAIN, createApiInstance)

    expect(createApiInstance).toHaveBeenCalledWith(urls)
    expect(result).toBe(fakeApi)
  })

  it('returns existing api instance passed directly as config', async () => {
    const result = await resolveChainApi(fakeApi, CHAIN, createApiInstance)

    expect(createApiInstance).not.toHaveBeenCalled()
    expect(result).toBe(fakeApi)
  })

  it('resolves api from apiOverrides when chain override is a string', async () => {
    const config: TBuilderConfig<string> = {
      apiOverrides: { [CHAIN]: WS_URL }
    }
    const result = await resolveChainApi(config, CHAIN, createApiInstance)

    expect(createApiInstance).toHaveBeenCalledWith(WS_URL)
    expect(result).toBe(fakeApi)
  })

  it('resolves api from apiOverrides when chain override is an api instance', async () => {
    const config: TBuilderConfig<object | string> = {
      apiOverrides: { [CHAIN]: fakeApi }
    }
    const result = await resolveChainApi(config, CHAIN, createApiInstance)

    expect(createApiInstance).not.toHaveBeenCalled()
    expect(result).toBe(fakeApi)
  })

  it('falls back to default provider when apiOverrides has no entry for the chain', async () => {
    const config: TBuilderConfig<string> = {
      apiOverrides: { Astar: WS_URL }
    }
    const result = await resolveChainApi(config, CHAIN, createApiInstance)

    expect(createApiInstance).toHaveBeenCalledWith('wss://default-provider')
    expect(result).toBe(fakeApi)
  })

  it('throws MissingChainApiError in development mode when no override exists', () => {
    const config: TBuilderConfig<string> = {
      development: true
    }

    expect(() => resolveChainApi(config, CHAIN, createApiInstance)).toThrow(MissingChainApiError)
  })

  it('does not throw in development mode when override exists', async () => {
    const config: TBuilderConfig<string> = {
      development: true,
      apiOverrides: { [CHAIN]: WS_URL }
    }
    const result = await resolveChainApi(config, CHAIN, createApiInstance)

    expect(createApiInstance).toHaveBeenCalledWith(WS_URL)
    expect(result).toBe(fakeApi)
  })
})
