import type { TMultiAsset } from '@paraspell/assets'
import type { TPallet } from '@paraspell/pallets'
import type { TMultiLocation } from '@paraspell/sdk-common'
import { isTMultiLocation } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_FEE } from '../../../constants'
import {
  type TXTokensCurrencySelection,
  type TXTokensTransferOptions,
  Version
} from '../../../types'
import { buildXTokensCall } from './buildXTokensCall'
import { getModifiedCurrencySelection } from './currencySelection'
import { getXTokensParameters } from './getXTokensParameters'

vi.mock('@paraspell/sdk-common', async importActual => {
  const actual = await importActual<typeof import('@paraspell/sdk-common')>()
  return {
    ...actual,
    isTMultiLocation: vi.fn()
  }
})

vi.mock('./currencySelection', () => ({
  getModifiedCurrencySelection: vi.fn()
}))

vi.mock('./getXTokensParameters', () => ({
  getXTokensParameters: vi.fn()
}))

describe('buildXTokensCall', () => {
  const baseInput = {
    origin: 'Acala',
    destination: 'Kusama',
    scenario: 'ParaToPara',
    asset: { amount: '100' },
    addressSelection: {},
    fees: 10000
  } as TXTokensTransferOptions<unknown, unknown>

  let currencySelection: TXTokensCurrencySelection

  beforeEach(() => {
    vi.clearAllMocks()
    currencySelection = { ForeignAsset: '1' }
    vi.mocked(getModifiedCurrencySelection).mockReturnValue({ [Version.V3]: {} as TMultiAsset })
    vi.mocked(getXTokensParameters).mockReturnValue({ param1: 'value1', param2: 'value2' })
    vi.mocked(isTMultiLocation).mockReturnValue(true)
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

    expect(result).toEqual({
      module: 'XTokens',
      method: 'transfer',
      parameters: {
        param1: 'value1',
        param2: 'value2'
      }
    })
    expect(getModifiedCurrencySelection).not.toHaveBeenCalled()
    expect(getXTokensParameters).toHaveBeenCalledWith(
      false,
      currencySelection,
      input.addressSelection,
      input.asset.amount,
      '0.1',
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

    expect(getModifiedCurrencySelection).toHaveBeenCalledWith(input)
    expect(getXTokensParameters).toHaveBeenCalledWith(
      true,
      { [Version.V3]: {} },
      input.addressSelection,
      input.asset.amount,
      123,
      undefined
    )
    expect(result.module).toBe('TestPallet')
  })

  it('selects transfer_multiasset when overriddenAsset is MultiLocation', () => {
    const overridden = {} as TMultiLocation

    const input = {
      ...baseInput,
      useMultiAssetTransfer: false,
      overriddenAsset: overridden,
      origin: 'Acala',
      destination: 'AssetHubPolkadot',
      scenario: 'ParaToPara'
    } as TXTokensTransferOptions<unknown, unknown>

    const result = buildXTokensCall(input, currencySelection, '0.1')

    expect(result.method).toBe('transfer_multiasset')
  })

  it('selects transfer_multiassets when overriddenAsset is not MultiLocation', () => {
    vi.mocked(isTMultiLocation).mockReturnValue(false)
    const overridden = {} as TMultiLocation

    const input = {
      ...baseInput,
      useMultiAssetTransfer: true,
      overriddenAsset: overridden,
      origin: 'Shiden',
      destination: 'Polkadot',
      scenario: 'ParaToRelay'
    } as TXTokensTransferOptions<unknown, unknown>

    const result = buildXTokensCall(input, currencySelection, '0.1')

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
    expect(result.method).toBe('custom_method')
  })
})
