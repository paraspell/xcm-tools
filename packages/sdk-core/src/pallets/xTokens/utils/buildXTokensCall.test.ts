import type { TAsset } from '@paraspell/assets'
import type { TPallet } from '@paraspell/pallets'
import type { TLocation } from '@paraspell/sdk-common'
import { isTLocation, Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../../api'
import { DEFAULT_FEE } from '../../../constants'
import { type TXTokensCurrencySelection, type TXTokensTransferOptions } from '../../../types'
import { createBeneficiaryLocXTokens } from '../../../utils'
import { buildXTokensCall } from './buildXTokensCall'
import { getModifiedCurrencySelection } from './currencySelection'
import { getXTokensParams } from './getXTokensParams'

vi.mock('@paraspell/sdk-common', async importActual => ({
  ...(await importActual()),
  isTLocation: vi.fn()
}))

vi.mock('./currencySelection')
vi.mock('./getXTokensParams')
vi.mock('../../../utils')

describe('buildXTokensCall', () => {
  const version = Version.V4
  const mockDestLocation = { parents: 1, interior: { X1: { Parachain: 2000 } } }
  const mockApi = {} as IPolkadotApi<unknown, unknown>

  const baseInput = {
    api: mockApi,
    origin: 'Acala',
    destination: 'Kusama',
    scenario: 'ParaToPara',
    asset: { amount: 100n },
    address: '0x123',
    paraIdTo: 2000,
    version
  } as TXTokensTransferOptions<unknown, unknown>

  let currencySelection: TXTokensCurrencySelection

  beforeEach(() => {
    vi.clearAllMocks()
    currencySelection = { ForeignAsset: '1' }
    vi.mocked(getModifiedCurrencySelection).mockReturnValue({ [Version.V4]: {} as TAsset })
    vi.mocked(getXTokensParams).mockReturnValue({ param1: 'value1', param2: 'value2' })
    vi.mocked(isTLocation).mockReturnValue(true)
    vi.mocked(createBeneficiaryLocXTokens).mockReturnValue(mockDestLocation)
  })

  it('uses default pallet and transfer method when multiAsset is false', () => {
    const input = {
      ...baseInput,
      useMultiAssetTransfer: false,
      overriddenAsset: undefined,
      pallet: undefined,
      method: undefined,
      origin: 'Acala',
      destination: 'Astar',
      scenario: 'ParaToPara'
    } as TXTokensTransferOptions<unknown, unknown>

    const result = buildXTokensCall(input, currencySelection, '0.1')

    expect(createBeneficiaryLocXTokens).toHaveBeenCalledWith({
      api: mockApi,
      origin: 'Acala',
      destination: 'Astar',
      address: '0x123',
      version,
      paraId: 2000
    })

    expect(result).toEqual({
      module: 'XTokens',
      method: 'transfer',
      params: {
        param1: 'value1',
        param2: 'value2'
      }
    })
    expect(getModifiedCurrencySelection).not.toHaveBeenCalled()
    expect(getXTokensParams).toHaveBeenCalledWith(
      false,
      currencySelection,
      mockDestLocation,
      input.asset.amount,
      '0.1',
      version,
      undefined
    )
  })

  it('uses modified currencySelection when multiAsset is true', () => {
    const input = {
      ...baseInput,
      useMultiAssetTransfer: true,
      overriddenAsset: undefined,
      pallet: 'TestPallet' as TPallet,
      method: undefined,
      origin: 'Astar',
      destination: 'Polkadot',
      scenario: 'ParaToRelay'
    } as TXTokensTransferOptions<unknown, unknown>

    const result = buildXTokensCall(input, currencySelection, 123)

    expect(createBeneficiaryLocXTokens).toHaveBeenCalledWith({
      api: mockApi,
      origin: 'Astar',
      destination: 'Polkadot',
      address: '0x123',
      version,
      paraId: 2000
    })

    expect(getModifiedCurrencySelection).toHaveBeenCalledWith(input)
    expect(getXTokensParams).toHaveBeenCalledWith(
      true,
      { [Version.V4]: {} },
      mockDestLocation,
      input.asset.amount,
      123,
      version,
      undefined
    )
    expect(result.module).toBe('TestPallet')
  })

  it('selects transfer_multiasset when overriddenAsset is location', () => {
    const overridden = {} as TLocation

    const input = {
      ...baseInput,
      useMultiAssetTransfer: false,
      overriddenAsset: overridden,
      origin: 'Acala',
      destination: 'AssetHubPolkadot',
      scenario: 'ParaToPara'
    } as TXTokensTransferOptions<unknown, unknown>

    const result = buildXTokensCall(input, currencySelection, '0.1')

    expect(createBeneficiaryLocXTokens).toHaveBeenCalledWith({
      api: mockApi,
      origin: 'Acala',
      destination: 'AssetHubPolkadot',
      address: '0x123',
      version,
      paraId: 2000
    })

    expect(result.method).toBe('transfer_multiasset')
  })

  it('selects transfer_multiassets when overriddenAsset is not location', () => {
    vi.mocked(isTLocation).mockReturnValue(false)
    const overridden = {} as TLocation

    const input = {
      ...baseInput,
      useMultiAssetTransfer: true,
      overriddenAsset: overridden,
      origin: 'Shiden',
      destination: 'Polkadot',
      scenario: 'ParaToRelay'
    } as TXTokensTransferOptions<unknown, unknown>

    const result = buildXTokensCall(input, currencySelection, '0.1')

    expect(createBeneficiaryLocXTokens).toHaveBeenCalledWith({
      api: mockApi,
      origin: 'Shiden',
      destination: 'Polkadot',
      address: '0x123',
      version,
      paraId: 2000
    })

    expect(result.method).toBe('transfer_multiassets')
  })

  it('uses method override when provided', () => {
    const input = {
      ...baseInput,
      useMultiAssetTransfer: false,
      overriddenAsset: undefined,
      pallet: undefined,
      method: 'custom_method',
      origin: 'Acala',
      destination: 'Kusama',
      scenario: 'ParaToPara'
    } as TXTokensTransferOptions<unknown, unknown>

    const result = buildXTokensCall(input, currencySelection, DEFAULT_FEE)

    expect(createBeneficiaryLocXTokens).toHaveBeenCalledWith({
      api: mockApi,
      origin: 'Acala',
      destination: 'Kusama',
      address: '0x123',
      version,
      paraId: 2000
    })

    expect(result.method).toBe('custom_method')
  })

  describe('shouldUseMultiAssetTransfer scenarios', () => {
    it('returns true for Astar to Relay scenario', () => {
      const input = {
        ...baseInput,
        origin: 'Astar',
        destination: 'Polkadot',
        scenario: 'ParaToRelay',
        useMultiAssetTransfer: false
      } as TXTokensTransferOptions<unknown, unknown>

      const result = buildXTokensCall(input, currencySelection, '0.1')

      expect(result.method).toBe('transfer_multiasset')
    })

    it('returns true for Shiden to Relay scenario', () => {
      const input = {
        ...baseInput,
        origin: 'Shiden',
        destination: 'Kusama',
        scenario: 'ParaToRelay',
        useMultiAssetTransfer: false
      } as TXTokensTransferOptions<unknown, unknown>

      const result = buildXTokensCall(input, currencySelection, '0.1')

      expect(result.method).toBe('transfer_multiasset')
    })

    it('returns true for AssetHub destination (non-Bifrost origin)', () => {
      const input = {
        ...baseInput,
        origin: 'Acala',
        destination: 'AssetHubPolkadot',
        scenario: 'ParaToPara',
        useMultiAssetTransfer: false
      } as TXTokensTransferOptions<unknown, unknown>

      const result = buildXTokensCall(input, currencySelection, '0.1')

      expect(result.method).toBe('transfer_multiasset')
    })

    it('returns false for AssetHub destination with Bifrost origin', () => {
      const input = {
        ...baseInput,
        origin: 'BifrostPolkadot',
        destination: 'AssetHubPolkadot',
        scenario: 'ParaToPara',
        useMultiAssetTransfer: false
      } as TXTokensTransferOptions<unknown, unknown>

      const result = buildXTokensCall(input, currencySelection, '0.1')

      expect(result.method).toBe('transfer')
    })
  })
})
