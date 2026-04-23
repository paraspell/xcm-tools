import {
  assertHasId,
  findAssetInfoOrThrow,
  MissingParameterError,
  type TAssetInfo
} from '@paraspell/sdk-core'
import type { BridgeInfo } from '@snowbridge/base-types'
import { ViemEthereumProvider } from '@snowbridge/provider-viem'
import { bridgeInfoFor } from '@snowbridge/registry'
import type { WalletClient } from 'viem'
import { createPublicClient, maxUint128 } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getTokenBalance } from './getTokenBalance'

vi.mock('@paraspell/sdk-core', async importOriginal => ({
  ...(await importOriginal()),
  assertHasId: vi.fn(),
  findAssetInfoOrThrow: vi.fn()
}))
vi.mock('@snowbridge/registry')
vi.mock('@snowbridge/provider-viem')
vi.mock('viem', async importOriginal => ({
  ...(await importOriginal()),
  createPublicClient: vi.fn(),
  custom: vi.fn()
}))

const GATEWAY = '0x1111111111111111111111111111111111111111'
const ETH_SENTINEL = '0x0000000000000000000000000000000000000000'
const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
const OWNER = '0x3333333333333333333333333333333333333333'

const asset = (assetId: string, symbol = 'WETH'): TAssetInfo => ({
  symbol,
  decimals: 18,
  assetId,
  location: { parents: 0, interior: 'Here' }
})

const buildSigner = (overrides: Partial<WalletClient> = {}) =>
  ({
    transport: { type: 'custom' },
    chain: { id: 1 },
    account: { address: OWNER },
    getAddresses: vi.fn().mockResolvedValue([]),
    ...overrides
  }) as unknown as WalletClient

describe('getTokenBalance', () => {
  let erc20Balance: ReturnType<typeof vi.fn>
  let getBalance: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()

    erc20Balance = vi.fn().mockResolvedValue({
      balance: 500n,
      gatewayAllowance: 100n
    })
    vi.mocked(ViemEthereumProvider).mockImplementation(function (this: {
      erc20Balance: typeof erc20Balance
    }) {
      this.erc20Balance = erc20Balance
    } as unknown as typeof ViemEthereumProvider)

    getBalance = vi.fn().mockResolvedValue(42n)
    vi.mocked(createPublicClient).mockReturnValue({
      getBalance
    } as unknown as ReturnType<typeof createPublicClient>)

    vi.mocked(bridgeInfoFor).mockReturnValue({
      environment: { gatewayContract: GATEWAY }
    } as BridgeInfo)

    vi.mocked(findAssetInfoOrThrow).mockImplementation((_chain, currency) => {
      const symbol = (currency as { symbol: string }).symbol
      if (symbol === 'ETH') return asset(ETH_SENTINEL, 'ETH')
      return asset(WETH_ADDRESS, 'WETH')
    })
  })

  it('returns ERC-20 balance + allowance for non-native tokens', async () => {
    const result = await getTokenBalance(buildSigner(), 'WETH')

    expect(result).toEqual({ balance: 500n, gatewayAllowance: 100n })
    expect(erc20Balance).toHaveBeenCalledWith(expect.anything(), WETH_ADDRESS, OWNER, GATEWAY)
    expect(getBalance).not.toHaveBeenCalled()
    expect(assertHasId).toHaveBeenCalled()
  })

  it('returns native balance + maxUint128 allowance for ETH', async () => {
    vi.mocked(findAssetInfoOrThrow).mockImplementation(() => asset(ETH_SENTINEL, 'ETH'))

    const result = await getTokenBalance(buildSigner(), 'ETH')

    expect(result).toEqual({ balance: 42n, gatewayAllowance: maxUint128 })
    expect(getBalance).toHaveBeenCalledWith({ address: OWNER })
    expect(erc20Balance).not.toHaveBeenCalled()
  })

  it('matches the ETH sentinel case-insensitively', async () => {
    vi.mocked(findAssetInfoOrThrow).mockImplementation((_chain, currency) => {
      const symbol = (currency as { symbol: string }).symbol
      if (symbol === 'ETH') return asset(ETH_SENTINEL.toLowerCase(), 'ETH')
      return asset(ETH_SENTINEL.toUpperCase(), 'ETH')
    })

    const result = await getTokenBalance(buildSigner(), 'ETH')

    expect(result.gatewayAllowance).toBe(maxUint128)
    expect(getBalance).toHaveBeenCalled()
    expect(erc20Balance).not.toHaveBeenCalled()
  })

  it('falls back to getAddresses() when signer.account is missing', async () => {
    const fallback = '0x4444444444444444444444444444444444444444'
    const signer = buildSigner({
      account: undefined,
      getAddresses: vi.fn().mockResolvedValue([fallback])
    })

    await getTokenBalance(signer, 'WETH')

    expect(signer.getAddresses).toHaveBeenCalled()
    expect(erc20Balance).toHaveBeenCalledWith(expect.anything(), WETH_ADDRESS, fallback, GATEWAY)
  })

  it('throws MissingParameterError when no account is available', async () => {
    const signer = buildSigner({
      account: undefined,
      getAddresses: vi.fn().mockResolvedValue([])
    })

    await expect(getTokenBalance(signer, 'WETH')).rejects.toThrow(MissingParameterError)
  })
})
