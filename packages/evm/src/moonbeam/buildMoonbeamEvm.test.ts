import type { PolkadotApi, TAssetInfo, TBuildEvmTransferOptions } from '@paraspell/sdk-core'
import {
  abstractDecimals,
  findAssetInfoOrThrow,
  formatAssetIdToERC20,
  getNativeAssetSymbol
} from '@paraspell/sdk-core'
import { encodeFunctionData } from 'viem'
import { moonbeam } from 'viem/chains'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { buildMoonbeamEvm } from './buildMoonbeamEvm'
import { buildMoonbeamLocal } from './buildMoonbeamLocal'
import { getDestinationLocation } from './getDestinationLocation'

vi.mock('@paraspell/sdk-core', async importOriginal => ({
  ...(await importOriginal()),
  abstractDecimals: vi.fn(),
  assertHasId: vi.fn(),
  findAssetInfoOrThrow: vi.fn(),
  formatAssetIdToERC20: vi.fn(),
  getNativeAssetSymbol: vi.fn()
}))

vi.mock('viem', async importOriginal => ({
  ...(await importOriginal()),
  encodeFunctionData: vi.fn()
}))

vi.mock('./getDestinationLocation')
vi.mock('./buildMoonbeamLocal')

const mockApi = {
  init: vi.fn()
} as unknown as PolkadotApi<unknown, unknown, unknown>

describe('buildMoonbeamEvm', () => {
  const baseOptions: TBuildEvmTransferOptions<unknown, unknown, unknown> = {
    api: mockApi,
    from: 'Moonbeam',
    to: 'AssetHubPolkadot',
    sender: '0xSender',
    recipient: 'some-address',
    currency: { symbol: 'xcPINK2', amount: '1000000' }
  }
  const foreignAsset: TAssetInfo = {
    symbol: 'xcPINK2',
    decimals: 18,
    location: { parents: 1, interior: 'Here' },
    assetId: '10000000000000000000000000000000000001'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(findAssetInfoOrThrow).mockReturnValue(foreignAsset)
    vi.mocked(getNativeAssetSymbol).mockReturnValue('GLMR')
    vi.mocked(formatAssetIdToERC20).mockReturnValue('0xformattedAsset')
    vi.mocked(getDestinationLocation).mockReturnValue(['someDestination'] as never)
    vi.mocked(abstractDecimals).mockImplementation(amount => BigInt(amount))
    vi.mocked(buildMoonbeamLocal).mockReturnValue({
      type: 'eip1559',
      chainId: moonbeam.id,
      to: '0xLocal',
      data: '0xLocalData',
      value: 0n
    })
    vi.mocked(encodeFunctionData).mockReturnValue('0xencoded')
  })

  it('uses native asset id when symbol matches the chain native', () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValueOnce({ symbol: 'GLMR' } as TAssetInfo)
    buildMoonbeamEvm(baseOptions)
    expect(formatAssetIdToERC20).not.toHaveBeenCalled()
    expect(encodeFunctionData).toHaveBeenCalledWith({
      abi: expect.any(Array),
      functionName: 'transfer',
      args: [
        '0x0000000000000000000000000000000000000802',
        '1000000',
        ['someDestination'],
        18446744073709551615n
      ]
    })
  })

  it('throws InvalidCurrencyError for foreign asset without an assetId', () => {
    vi.mocked(findAssetInfoOrThrow).mockReturnValueOnce({
      symbol: 'NOT_NATIVE',
      assetId: undefined
    } as TAssetInfo)
    expect(() => buildMoonbeamEvm(baseOptions)).toThrow(
      'Currency must be a foreign asset with valid assetId'
    )
  })

  it('formats foreign asset id when asset is foreign', () => {
    buildMoonbeamEvm(baseOptions)
    expect(formatAssetIdToERC20).toHaveBeenCalledWith(foreignAsset.assetId)
  })

  it('encodes transferMultiCurrencies for multi-currency assets on AssetHubPolkadot', () => {
    vi.mocked(findAssetInfoOrThrow)
      .mockReturnValueOnce({
        symbol: 'xcPINK',
        assetId: '100000000'
      } as TAssetInfo)
      .mockReturnValueOnce({
        symbol: 'xcUSDT',
        decimals: 6,
        assetId: '200000000'
      } as TAssetInfo)
    buildMoonbeamEvm({
      ...baseOptions,
      currency: { symbol: 'xcPINK', amount: '1000000' }
    })
    expect(encodeFunctionData).toHaveBeenCalledWith({
      abi: expect.any(Array),
      functionName: 'transferMultiCurrencies',
      args: [
        [
          ['0xformattedAsset', '1000000'],
          // 0.2 xcUSDT at 6 decimals = 200000
          ['0xformattedAsset', '200000']
        ],
        1,
        ['someDestination'],
        18446744073709551615n
      ]
    })
  })

  it('encodes transfer for non-multi-currency assets', () => {
    buildMoonbeamEvm({
      ...baseOptions,
      currency: { symbol: 'SOME_TOKEN', amount: '1234' }
    })
    expect(encodeFunctionData).toHaveBeenCalledWith({
      abi: expect.any(Array),
      functionName: 'transfer',
      args: ['0xformattedAsset', '1234', ['someDestination'], 18446744073709551615n]
    })
  })

  it('returns an EIP-1559 tx pointing at the precompile with encoded data', () => {
    const tx = buildMoonbeamEvm(baseOptions)
    expect(tx).toEqual({
      type: 'eip1559',
      chainId: moonbeam.id,
      to: '0x0000000000000000000000000000000000000804',
      data: '0xencoded',
      value: 0n
    })
  })

  it('rejects multi-asset currency arrays', () => {
    expect(() => buildMoonbeamEvm({ ...baseOptions, currency: [] })).toThrow(
      'Multi-assets are not yet supported for EVM transfers'
    )
  })

  it('delegates to buildMoonbeamLocal when from === to', () => {
    const localAsset = { symbol: 'xcDOT', assetId: '0xABCDEF', decimals: 10 } as TAssetInfo
    vi.mocked(findAssetInfoOrThrow).mockReturnValueOnce(localAsset)

    const result = buildMoonbeamEvm({
      ...baseOptions,
      from: 'Moonbeam',
      to: 'Moonbeam',
      currency: { symbol: 'xcDOT', amount: '5000000' }
    })

    expect(buildMoonbeamLocal).toHaveBeenCalledWith(
      'Moonbeam',
      expect.objectContaining({ symbol: 'xcDOT', assetId: '0xABCDEF', amount: 5000000n }),
      'some-address'
    )
    expect(result).toEqual({
      type: 'eip1559',
      chainId: moonbeam.id,
      to: '0xLocal',
      data: '0xLocalData',
      value: 0n
    })
    expect(getDestinationLocation).not.toHaveBeenCalled()
  })
})
