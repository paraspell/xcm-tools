import { describe, it, expect, vi } from 'vitest'
import { createApiInstanceForNode, isRelayChain } from '../../../utils'
import { buildClaimAssetsInput } from './buildClaimAssetsInput'
import type { TMultiAsset, TMultiLocation } from '../../../types'
import { Version } from '../../../types'
import type { TAssetClaimOptions } from '../../../types/TAssetClaim'
import type { ApiPromise } from '@polkadot/api'
import { claimAssets } from './assetClaim'

vi.mock('../../../utils', () => ({
  createApiInstanceForNode: vi.fn(),
  isRelayChain: vi.fn()
}))

vi.mock('./buildClaimAssetsInput', () => ({
  buildClaimAssetsInput: vi.fn()
}))

describe('claimAssets', () => {
  const apiMock = {
    tx: {
      polkadotXcm: {
        claimAssets: vi.fn()
      },
      xcmPallet: {
        claimAssets: vi.fn()
      }
    }
  } as unknown as ApiPromise

  const nodeMock = 'Acala'

  it('should return serializedApiCall when serializedApiCallEnabled is true', async () => {
    const options: TAssetClaimOptions = {
      api: apiMock,
      node: nodeMock,
      serializedApiCallEnabled: true,
      multiAssets: ['asset1', 'asset2'] as unknown as TMultiAsset[],
      address: 'someAddress',
      version: Version.V3
    }
    const argsMock = [{ [Version.V3]: ['asset1', 'asset2'] }, { [Version.V3]: {} }] as unknown as (
      | { [x: string]: TMultiAsset[] }
      | { [x: string]: TMultiLocation }
    )[]
    vi.mocked(buildClaimAssetsInput).mockReturnValue(argsMock)
    vi.mocked(isRelayChain).mockReturnValue(false)

    const result = await claimAssets(options)

    expect(result).toEqual({
      module: 'polkadotXcm',
      section: 'claimAssets',
      parameters: argsMock
    })
    expect(buildClaimAssetsInput).toHaveBeenCalledWith({
      ...options,
      api: apiMock
    })
  })

  it('should return extrinsic call when serializedApiCallEnabled is false', async () => {
    const options: TAssetClaimOptions = {
      api: apiMock,
      node: nodeMock,
      serializedApiCallEnabled: false,
      multiAssets: ['asset1', 'asset2'] as unknown as TMultiAsset[],
      address: 'someAddress',
      version: Version.V3
    }
    const argsMock = [{ [Version.V3]: ['asset1', 'asset2'] }, { [Version.V3]: {} }] as unknown as (
      | { [x: string]: TMultiAsset[] }
      | { [x: string]: TMultiLocation }
    )[]
    vi.mocked(buildClaimAssetsInput).mockReturnValue(argsMock)
    vi.mocked(isRelayChain).mockReturnValue(false)

    await claimAssets(options)

    expect(apiMock.tx.polkadotXcm.claimAssets).toHaveBeenCalledWith(...argsMock)
  })

  it('should create an API instance if api is not provided', async () => {
    const options: TAssetClaimOptions = {
      api: undefined,
      node: nodeMock,
      serializedApiCallEnabled: false,
      multiAssets: ['asset1', 'asset2'] as unknown as TMultiAsset[],
      address: 'someAddress',
      version: Version.V3
    }
    const apiInstanceMock = apiMock
    const argsMock = [{ [Version.V3]: ['asset1', 'asset2'] }, { [Version.V3]: {} }] as unknown as (
      | { [x: string]: TMultiAsset[] }
      | { [x: string]: TMultiLocation }
    )[]
    vi.mocked(createApiInstanceForNode).mockResolvedValue(apiInstanceMock)
    vi.mocked(buildClaimAssetsInput).mockReturnValue(argsMock)
    vi.mocked(isRelayChain).mockReturnValue(false)

    await claimAssets(options)

    expect(createApiInstanceForNode).toHaveBeenCalledWith(nodeMock)
    expect(apiInstanceMock.tx.polkadotXcm.claimAssets).toHaveBeenCalledWith(...argsMock)
  })

  it('should use xcmPallet module when node is on the relay chain', async () => {
    const options: TAssetClaimOptions = {
      api: apiMock,
      node: nodeMock,
      serializedApiCallEnabled: false,
      multiAssets: ['asset1', 'asset2'] as unknown as TMultiAsset[],
      address: 'someAddress',
      version: Version.V3
    }
    const argsMock = [{ [Version.V3]: ['asset1', 'asset2'] }, { [Version.V3]: {} }] as unknown as (
      | { [x: string]: TMultiAsset[] }
      | { [x: string]: TMultiLocation }
    )[]
    vi.mocked(buildClaimAssetsInput).mockReturnValue(argsMock)
    vi.mocked(isRelayChain).mockReturnValue(true)

    await claimAssets(options)

    expect(apiMock.tx.xcmPallet.claimAssets).toHaveBeenCalledWith(...argsMock)
  })
})
