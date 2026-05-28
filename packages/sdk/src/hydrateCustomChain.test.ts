import type { TChainAssetsInfo, TCustomChainInput } from '@paraspell/sdk-core'
import { CustomChainInvalidError, Version } from '@paraspell/sdk-core'
import type { MockInstance } from 'vitest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { hydrateCustomChain } from './hydrateCustomChain'
import PapiApi from './PapiApi'

vi.mock('./PapiApi')

const CHAIN_NAME = 'MyCustomChain'

const INPUT: TCustomChainInput = {
  paraId: 4242,
  ecosystem: 'Polkadot',
  providers: [{ name: 'Local', endpoint: 'ws://example:9944' }],
  xcmVersion: Version.V5
}

const ASSETS_INFO: TChainAssetsInfo = {
  relaychainSymbol: 'DOT',
  nativeAssetSymbol: 'DOT',
  isEVM: false,
  ss58Prefix: 0,
  supportsDryRunApi: true,
  supportsXcmPaymentApi: true,
  assets: [
    {
      symbol: 'DOT',
      decimals: 10,
      location: { parents: 1, interior: { Here: null } },
      isNative: true
    }
  ]
}

describe('hydrateCustomChain', () => {
  let currentAssets: TChainAssetsInfo | undefined
  let initSpy: MockInstance
  let disconnectSpy: MockInstance

  beforeEach(() => {
    vi.clearAllMocks()
    currentAssets = ASSETS_INFO
    Object.defineProperty(PapiApi.prototype, '_customCtx', {
      configurable: true,
      get: () => ({
        customChainAssets: currentAssets ? { [CHAIN_NAME]: currentAssets } : {}
      })
    })
    initSpy = vi.spyOn(PapiApi.prototype, 'init').mockResolvedValue(undefined)
    disconnectSpy = vi.spyOn(PapiApi.prototype, 'disconnect').mockResolvedValue(undefined)
  })

  afterEach(() => {
    Reflect.deleteProperty(PapiApi.prototype, '_customCtx')
  })

  it('forwards customChains config to PapiApi and inits with the given chain name', async () => {
    await hydrateCustomChain(CHAIN_NAME, INPUT)

    expect(PapiApi).toHaveBeenCalledWith({
      customChains: { [CHAIN_NAME]: INPUT }
    })
    expect(initSpy).toHaveBeenCalledWith(CHAIN_NAME)
  })

  it('returns the hydrated TChainAssetsInfo from the api context', async () => {
    await expect(hydrateCustomChain(CHAIN_NAME, INPUT)).resolves.toBe(ASSETS_INFO)
  })

  it('throws CustomChainInvalidError when hydration leaves customChainAssets empty', async () => {
    currentAssets = undefined

    await expect(hydrateCustomChain(CHAIN_NAME, INPUT)).rejects.toBeInstanceOf(
      CustomChainInvalidError
    )
  })

  it('releases the client via disconnect() without force on success', async () => {
    await hydrateCustomChain(CHAIN_NAME, INPUT)

    expect(disconnectSpy).toHaveBeenCalledTimes(1)
    expect(disconnectSpy).toHaveBeenCalledWith()
  })

  it('releases the client even when hydration fails', async () => {
    currentAssets = undefined

    await expect(hydrateCustomChain(CHAIN_NAME, INPUT)).rejects.toThrow()

    expect(disconnectSpy).toHaveBeenCalledTimes(1)
    expect(disconnectSpy).toHaveBeenCalledWith()
  })

  it('releases the client even when init itself rejects', async () => {
    const initError = new Error('boom')
    initSpy.mockRejectedValueOnce(initError)

    await expect(hydrateCustomChain(CHAIN_NAME, INPUT)).rejects.toBe(initError)

    expect(disconnectSpy).toHaveBeenCalledTimes(1)
    expect(disconnectSpy).toHaveBeenCalledWith()
  })
})
