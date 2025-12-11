import type { TSubstrateChain } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../api'
import { InvalidAddressError } from '../errors'
import { claimAssets } from '../transfer'
import * as utils from '../utils'
import { AssetClaimBuilder } from './AssetClaimBuilder'

vi.mock('../transfer')

const CHAIN: TSubstrateChain = 'Acala'
const ADDRESS = '23sxrMSmaUMqe2ufSJg8U3Y8kxHfKT67YbubwXWFazpYi7w6'
const SENDER_ADDRESS = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'

describe('AssetClaimBuilder', () => {
  const mockApi = {
    deriveAddress: vi.fn().mockReturnValue('5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty'),
    signAndSubmit: vi.fn().mockResolvedValue('0x1234567890abcdef')
  } as unknown as IPolkadotApi<unknown, unknown>

  const mockExtrinsic = {
    module: 'PolkadotXcm',
    method: 'claim_assets',
    params: []
  }

  const currency = { symbol: 'DOT', amount: 1 }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(claimAssets).mockResolvedValue(mockExtrinsic)
  })

  it('resolves derivation path passed to address()', async () => {
    const derivationPath = '//Alice'
    const resolvedAddress = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty'

    const deriveSpy = vi.spyOn(mockApi, 'deriveAddress')

    await new AssetClaimBuilder(mockApi, { chain: CHAIN })
      .currency(currency)
      .address(derivationPath)
      .build()

    expect(deriveSpy).toHaveBeenCalledWith(derivationPath)
    expect(claimAssets).toHaveBeenCalledWith(
      expect.objectContaining({
        api: mockApi,
        chain: CHAIN,
        currency,
        address: resolvedAddress
      })
    )
  })

  it('signs and submits transaction when senderAddress is a derivation path', async () => {
    const derivationPath = '//Alice'
    const resolvedSender = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty'

    const assertSpy = vi.spyOn(utils, 'assertDerivationPath')
    const deriveSpy = vi.spyOn(mockApi, 'deriveAddress')
    const submitSpy = vi.spyOn(mockApi, 'signAndSubmit')

    const result = await new AssetClaimBuilder(mockApi, { chain: CHAIN })
      .currency(currency)
      .address(ADDRESS)
      .senderAddress(derivationPath)
      .signAndSubmit()

    expect(assertSpy).toHaveBeenCalledWith(derivationPath)
    expect(deriveSpy).toHaveBeenCalledWith(derivationPath)

    expect(claimAssets).toHaveBeenCalledWith(
      expect.objectContaining({
        api: mockApi,
        chain: CHAIN,
        currency,
        address: ADDRESS,
        senderAddress: resolvedSender,
        path: derivationPath
      })
    )

    expect(submitSpy).toHaveBeenCalledWith(mockExtrinsic, derivationPath)
    expect(result).toBe('0x1234567890abcdef')
  })

  it('throws on signAndSubmit when senderAddress is not a derivation path', async () => {
    const assertSpy = vi.spyOn(utils, 'assertDerivationPath')
    const submitSpy = vi.spyOn(mockApi, 'signAndSubmit')

    await expect(
      new AssetClaimBuilder(mockApi, { chain: CHAIN })
        .currency(currency)
        .address(ADDRESS)
        .senderAddress(SENDER_ADDRESS)
        .signAndSubmit()
    ).rejects.toBeInstanceOf(InvalidAddressError)

    expect(assertSpy).toHaveBeenCalledWith(undefined)
    expect(claimAssets).not.toHaveBeenCalled()
    expect(submitSpy).not.toHaveBeenCalled()
  })
})
