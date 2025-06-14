import type { TMultiAsset } from '@paraspell/assets'
import { isRelayChain, type TMultiLocation, Version } from '@paraspell/sdk-common'
import { describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../../api/IPolkadotApi'
import type { TAssetClaimOptions } from '../../../types/TAssetClaim'
import { validateAddress } from '../../../utils'
import { claimAssets } from './assetClaim'
import { buildClaimAssetsInput } from './buildClaimAssetsInput'

vi.mock('../../../utils', () => ({
  validateAddress: vi.fn()
}))

vi.mock('./buildClaimAssetsInput', () => ({
  buildClaimAssetsInput: vi.fn()
}))

vi.mock('@paraspell/sdk-common', async importOriginal => ({
  ...(await importOriginal()),
  isRelayChain: vi.fn().mockReturnValue(false)
}))

describe('claimAssets', () => {
  const apiMock = {
    init: vi.fn(),
    callTxMethod: vi.fn(),
    disconnect: vi.fn(),
    getApi: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown>

  const nodeMock = 'Acala'

  it('should return extrinsic call', async () => {
    const options: TAssetClaimOptions<unknown, unknown> = {
      api: apiMock,
      node: nodeMock,
      multiAssets: ['asset1', 'asset2'] as unknown as TMultiAsset[],
      address: 'someAddress',
      version: Version.V4
    }
    const argsMock = {
      assets: { [Version.V4]: ['asset1', 'asset2'] as unknown as TMultiAsset[] },
      beneficiary: { [Version.V4]: {} as TMultiLocation }
    }
    vi.mocked(buildClaimAssetsInput).mockReturnValue(argsMock)
    vi.mocked(isRelayChain).mockReturnValue(false)

    const callSpy = vi.spyOn(apiMock, 'callTxMethod')

    await claimAssets(options)

    expect(callSpy).toHaveBeenCalledWith({
      module: 'PolkadotXcm',
      method: 'claim_assets',
      parameters: argsMock
    })

    expect(validateAddress).toHaveBeenCalledWith(options.address, nodeMock)
  })

  it('should create an API instance if api is not provided', async () => {
    const options: TAssetClaimOptions<unknown, unknown> = {
      api: apiMock,
      node: nodeMock,
      multiAssets: ['asset1', 'asset2'] as unknown as TMultiAsset[],
      address: 'someAddress',
      version: Version.V4
    }
    const apiInstanceMock = apiMock
    const argsMock = {
      assets: { [Version.V4]: ['asset1', 'asset2'] as unknown as TMultiAsset[] },
      beneficiary: { [Version.V4]: {} as TMultiLocation }
    }
    vi.mocked(buildClaimAssetsInput).mockReturnValue(argsMock)
    vi.mocked(isRelayChain).mockReturnValue(false)

    const callSpy = vi.spyOn(apiInstanceMock, 'callTxMethod')

    const initSpy = vi.spyOn(apiInstanceMock, 'init')

    await claimAssets(options)

    expect(initSpy).toHaveBeenCalled()
    expect(callSpy).toHaveBeenCalledWith({
      module: 'PolkadotXcm',
      method: 'claim_assets',
      parameters: argsMock
    })
  })

  it('should use xcmPallet module when node is on the relay chain', async () => {
    const options: TAssetClaimOptions<unknown, unknown> = {
      api: apiMock,
      node: nodeMock,
      multiAssets: ['asset1', 'asset2'] as unknown as TMultiAsset[],
      address: 'someAddress',
      version: Version.V4
    }
    const argsMock = {
      assets: { [Version.V4]: ['asset1', 'asset2'] as unknown as TMultiAsset[] },
      beneficiary: { [Version.V4]: {} as TMultiLocation }
    }
    vi.mocked(buildClaimAssetsInput).mockReturnValue(argsMock)
    vi.mocked(isRelayChain).mockReturnValue(true)

    const callSpy = vi.spyOn(apiMock, 'callTxMethod')

    await claimAssets(options)

    expect(callSpy).toHaveBeenCalledWith({
      module: 'XcmPallet',
      method: 'claim_assets',
      parameters: argsMock
    })
  })
})
