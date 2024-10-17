import { describe, it, expect, vi } from 'vitest'
import { createApiInstanceForNode, isRelayChain } from '../../../utils'
import { buildClaimAssetsInput } from './buildClaimAssetsInput'
import type { TMultiAsset, TMultiLocation } from '../../../types'
import { Version } from '../../../types'
import type { TAssetClaimOptions } from '../../../types/TAssetClaim'
import type { ApiPromise } from '@polkadot/api'
import { claimAssets } from './assetClaim'
import type { IPolkadotApi } from '../../../api/IPolkadotApi'
import type { Extrinsic } from '../../../pjs/types'

vi.mock('../../../utils', () => ({
  createApiInstanceForNode: vi.fn(),
  isRelayChain: vi.fn()
}))

vi.mock('./buildClaimAssetsInput', () => ({
  buildClaimAssetsInput: vi.fn()
}))

describe('claimAssets', () => {
  const apiMock = {
    init: vi.fn(),
    callTxMethod: vi.fn()
  } as unknown as IPolkadotApi<ApiPromise, Extrinsic>

  const nodeMock = 'Acala'

  it('should return serializedApiCall when serializedApiCallEnabled is true', async () => {
    const options: TAssetClaimOptions<ApiPromise, Extrinsic> = {
      api: apiMock,
      node: nodeMock,
      serializedApiCallEnabled: true,
      multiAssets: ['asset1', 'asset2'] as unknown as TMultiAsset[],
      address: 'someAddress',
      version: Version.V3
    }
    const argsMock = {
      assets: { [Version.V3]: ['asset1', 'asset2'] as unknown as TMultiAsset[] },
      beneficiary: { [Version.V3]: {} as TMultiLocation }
    }
    vi.mocked(buildClaimAssetsInput).mockReturnValue(argsMock)
    vi.mocked(isRelayChain).mockReturnValue(false)

    const result = await claimAssets(options)

    expect(result).toEqual({
      module: 'PolkadotXcm',
      section: 'claim_assets',
      parameters: Object.values(argsMock)
    })
    expect(buildClaimAssetsInput).toHaveBeenCalledWith({
      ...options,
      api: apiMock
    })
  })

  it('should return extrinsic call when serializedApiCallEnabled is false', async () => {
    const options: TAssetClaimOptions<ApiPromise, Extrinsic> = {
      api: apiMock,
      node: nodeMock,
      serializedApiCallEnabled: false,
      multiAssets: ['asset1', 'asset2'] as unknown as TMultiAsset[],
      address: 'someAddress',
      version: Version.V3
    }
    const argsMock = {
      assets: { [Version.V3]: ['asset1', 'asset2'] as unknown as TMultiAsset[] },
      beneficiary: { [Version.V3]: {} as TMultiLocation }
    }
    vi.mocked(buildClaimAssetsInput).mockReturnValue(argsMock)
    vi.mocked(isRelayChain).mockReturnValue(false)

    const callSpy = vi.spyOn(apiMock, 'callTxMethod')

    await claimAssets(options)

    expect(callSpy).toHaveBeenCalledWith({
      module: 'PolkadotXcm',
      section: 'claim_assets',
      parameters: argsMock
    })
  })

  it('should create an API instance if api is not provided', async () => {
    const options: TAssetClaimOptions<ApiPromise, Extrinsic> = {
      api: apiMock,
      node: nodeMock,
      serializedApiCallEnabled: false,
      multiAssets: ['asset1', 'asset2'] as unknown as TMultiAsset[],
      address: 'someAddress',
      version: Version.V3
    }
    const apiInstanceMock = apiMock
    const argsMock = {
      assets: { [Version.V3]: ['asset1', 'asset2'] as unknown as TMultiAsset[] },
      beneficiary: { [Version.V3]: {} as TMultiLocation }
    }
    vi.mocked(createApiInstanceForNode).mockResolvedValue(apiInstanceMock)
    vi.mocked(buildClaimAssetsInput).mockReturnValue(argsMock)
    vi.mocked(isRelayChain).mockReturnValue(false)

    const callSpy = vi.spyOn(apiInstanceMock, 'callTxMethod')

    const initSpy = vi.spyOn(apiInstanceMock, 'init')

    await claimAssets(options)

    expect(initSpy).toHaveBeenCalled()
    expect(callSpy).toHaveBeenCalledWith({
      module: 'PolkadotXcm',
      section: 'claim_assets',
      parameters: argsMock
    })
  })

  it('should use xcmPallet module when node is on the relay chain', async () => {
    const options: TAssetClaimOptions<ApiPromise, Extrinsic> = {
      api: apiMock,
      node: nodeMock,
      serializedApiCallEnabled: false,
      multiAssets: ['asset1', 'asset2'] as unknown as TMultiAsset[],
      address: 'someAddress',
      version: Version.V3
    }
    const argsMock = {
      assets: { [Version.V3]: ['asset1', 'asset2'] as unknown as TMultiAsset[] },
      beneficiary: { [Version.V3]: {} as TMultiLocation }
    }
    vi.mocked(buildClaimAssetsInput).mockReturnValue(argsMock)
    vi.mocked(isRelayChain).mockReturnValue(true)

    const callSpy = vi.spyOn(apiMock, 'callTxMethod')

    await claimAssets(options)

    expect(callSpy).toHaveBeenCalledWith({
      module: 'XcmPallet',
      section: 'claim_assets',
      parameters: argsMock
    })
  })
})
