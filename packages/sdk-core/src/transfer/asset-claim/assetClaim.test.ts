import type { TAsset } from '@paraspell/assets'
import { isRelayChain, type TLocation, Version } from '@paraspell/sdk-common'
import { describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import type { TAssetClaimOptions } from '../../types'
import { validateAddress } from '../../utils'
import { claimAssets } from './assetClaim'
import { buildClaimAssetsParams } from './buildClaimAssetsParams'

vi.mock('../../utils')
vi.mock('./buildClaimAssetsParams')
vi.mock('./resolveAssets')

vi.mock('@paraspell/sdk-common', async importOriginal => ({
  ...(await importOriginal()),
  isRelayChain: vi.fn().mockReturnValue(false)
}))

describe('claimAssets', () => {
  const apiMock = {
    init: vi.fn(),
    deserializeExtrinsics: vi.fn(),
    disconnect: vi.fn(),
    getApi: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown>

  const mockChain = 'Acala'

  it('should return extrinsic call', async () => {
    const options: TAssetClaimOptions<unknown, unknown> = {
      api: apiMock,
      chain: mockChain,
      currency: ['asset1', 'asset2'] as unknown as TAsset[],
      address: 'someAddress',
      version: Version.V4
    }
    const argsMock = {
      assets: { [Version.V4]: ['asset1', 'asset2'] as unknown as TAsset[] },
      beneficiary: { [Version.V4]: {} as TLocation }
    }
    vi.mocked(buildClaimAssetsParams).mockReturnValue(argsMock)
    vi.mocked(isRelayChain).mockReturnValue(false)

    const callSpy = vi.spyOn(apiMock, 'deserializeExtrinsics')

    await claimAssets(options)

    expect(callSpy).toHaveBeenCalledWith({
      module: 'PolkadotXcm',
      method: 'claim_assets',
      params: argsMock
    })

    expect(validateAddress).toHaveBeenCalledWith(apiMock, options.address, mockChain, true)
  })

  it('should create an API instance if api is not provided', async () => {
    const options: TAssetClaimOptions<unknown, unknown> = {
      api: apiMock,
      chain: mockChain,
      currency: ['asset1', 'asset2'] as unknown as TAsset[],
      address: 'someAddress',
      version: Version.V4
    }
    const apiInstanceMock = apiMock
    const argsMock = {
      assets: { [Version.V4]: ['asset1', 'asset2'] as unknown as TAsset[] },
      beneficiary: { [Version.V4]: {} as TLocation }
    }
    vi.mocked(buildClaimAssetsParams).mockReturnValue(argsMock)
    vi.mocked(isRelayChain).mockReturnValue(false)

    const callSpy = vi.spyOn(apiInstanceMock, 'deserializeExtrinsics')

    const initSpy = vi.spyOn(apiInstanceMock, 'init')

    await claimAssets(options)

    expect(initSpy).toHaveBeenCalled()
    expect(callSpy).toHaveBeenCalledWith({
      module: 'PolkadotXcm',
      method: 'claim_assets',
      params: argsMock
    })
  })

  it('should use xcmPallet module when chain is on the relay chain', async () => {
    const options: TAssetClaimOptions<unknown, unknown> = {
      api: apiMock,
      chain: 'Polkadot',
      currency: ['asset1', 'asset2'] as unknown as TAsset[],
      address: 'someAddress',
      version: Version.V4
    }
    const argsMock = {
      assets: { [Version.V4]: ['asset1', 'asset2'] as unknown as TAsset[] },
      beneficiary: { [Version.V4]: {} as TLocation }
    }
    vi.mocked(buildClaimAssetsParams).mockReturnValue(argsMock)
    vi.mocked(isRelayChain).mockReturnValue(true)

    const callSpy = vi.spyOn(apiMock, 'deserializeExtrinsics')

    await claimAssets(options)

    expect(callSpy).toHaveBeenCalledWith({
      module: 'XcmPallet',
      method: 'claim_assets',
      params: argsMock
    })
  })
})
