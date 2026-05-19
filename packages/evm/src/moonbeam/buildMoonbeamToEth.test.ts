import type {
  PolkadotApi,
  TAssetInfo,
  TBuildEvmTransferOptions,
  TCurrencyInputWithAmount
} from '@paraspell/sdk-core'
import {
  abstractDecimals,
  BridgeHaltedError,
  createCustomXcmOnDest,
  findAssetInfoOrThrow,
  getBridgeStatus,
  getParaEthTransferFees,
  getParaId,
  isOverrideLocationSpecifier,
  MissingParameterError,
  Version
} from '@paraspell/sdk-core'
import { encodeFunctionData } from 'viem'
import { moonbeam } from 'viem/chains'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { buildMoonbeamToEth } from './buildMoonbeamToEth'

vi.mock('@paraspell/sdk-core', async importOriginal => ({
  ...(await importOriginal()),
  abstractDecimals: vi.fn(),
  assertHasId: vi.fn(),
  createCustomXcmOnDest: vi.fn(),
  findAssetInfoOrThrow: vi.fn(),
  generateMessageId: vi.fn(),
  getBridgeStatus: vi.fn(),
  getParaEthTransferFees: vi.fn(),
  getParaId: vi.fn(),
  isOverrideLocationSpecifier: vi.fn()
}))

vi.mock('viem', async importOriginal => ({
  ...(await importOriginal()),
  encodeFunctionData: vi.fn().mockReturnValue('0xencoded')
}))

describe('buildMoonbeamToEth', () => {
  const mockApi = {
    init: vi.fn(),
    clone: vi.fn(),
    objectToHex: vi.fn().mockResolvedValue('0xmockedXcm'),
    createApiForChain: vi.fn().mockResolvedValue({}),
    _customCtx: {}
  } as unknown as PolkadotApi<unknown, unknown, unknown>

  const moonbeamAsset: TAssetInfo = {
    symbol: 'WETH',
    decimals: 18,
    assetId: '0xmockedAssetId',
    location: { parents: 2, interior: 'Here' }
  }

  const ethereumAsset: TAssetInfo = {
    symbol: 'WETH',
    decimals: 18,
    assetId: '0xethAssetId',
    location: { parents: 0, interior: 'Here' }
  }

  const baseOptions: TBuildEvmTransferOptions<unknown, unknown, unknown> = {
    api: mockApi,
    from: 'Moonbeam',
    to: 'Ethereum',
    sender: '0xSender',
    recipient: '0xmockedAddress',
    ahAddress: '0xmockedAhAddress',
    currency: { symbol: 'WETH', amount: 1000 }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(findAssetInfoOrThrow).mockImplementation(chain =>
      chain === 'Ethereum' ? ethereumAsset : moonbeamAsset
    )
    vi.mocked(isOverrideLocationSpecifier).mockReturnValue(false)
    vi.mocked(abstractDecimals).mockImplementation(amount => BigInt(amount))
    vi.mocked(getParaId).mockReturnValue(1000)
    vi.mocked(getParaEthTransferFees).mockResolvedValue([1000n, 1000n])
    vi.mocked(getBridgeStatus).mockResolvedValue('Normal')
    vi.mocked(createCustomXcmOnDest).mockReturnValue({ [Version.V4]: [] })
    vi.mocked(encodeFunctionData).mockReturnValue('0xencoded')
  })

  it('throws when ahAddress is missing', async () => {
    await expect(
      buildMoonbeamToEth('Moonbeam', { ...baseOptions, ahAddress: undefined })
    ).rejects.toThrow(MissingParameterError)
  })

  it('rejects multi-asset currency arrays', async () => {
    await expect(
      buildMoonbeamToEth('Moonbeam', {
        ...baseOptions,
        currency: [] as TCurrencyInputWithAmount
      })
    ).rejects.toThrow('Multi-assets are not yet supported for EVM transfers')
  })

  it('rejects override location specifiers', async () => {
    vi.mocked(isOverrideLocationSpecifier).mockReturnValue(true)
    await expect(
      buildMoonbeamToEth('Moonbeam', {
        ...baseOptions,
        currency: { location: { type: 'Override' } } as TCurrencyInputWithAmount
      })
    ).rejects.toThrow('Override location is not supported for EVM transfers')
  })

  it('throws BridgeHaltedError when the bridge is not Normal', async () => {
    vi.mocked(getBridgeStatus).mockResolvedValue('Halted')
    await expect(buildMoonbeamToEth('Moonbeam', baseOptions)).rejects.toThrow(BridgeHaltedError)
  })

  it('returns an EIP-1559 tx pointing at the XCM precompile', async () => {
    const tx = await buildMoonbeamToEth('Moonbeam', baseOptions)
    expect(tx).toEqual({
      type: 'eip1559',
      chainId: moonbeam.id,
      to: '0x000000000000000000000000000000000000081A',
      data: '0xencoded',
      value: 0n
    })
    expect(getParaId).toHaveBeenCalledWith('AssetHubPolkadot')
    expect(getParaEthTransferFees).toHaveBeenCalled()
    expect(encodeFunctionData).toHaveBeenCalledWith({
      abi: expect.any(Array),
      functionName: 'transferAssetsUsingTypeAndThenAddress',
      args: expect.any(Array)
    })
  })
})
