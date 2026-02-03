import type { TAssetInfo } from '@paraspell/assets'
import { findNativeAssetInfoOrThrow } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { UnableToComputeError } from '../../errors'
import { getParaEthTransferFees } from '../../transfer'
import { assertHasLocation } from '../assertions'
import { getMythosOriginFee } from './getMythosOriginFee'
import { padValueBy } from './padFee'

vi.mock('../../transfer')
vi.mock('@paraspell/assets')
vi.mock('../assertions')
vi.mock('./padFee')

describe('getMythosOriginFee', () => {
  const mockApi = {
    clone: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown, unknown>

  const mockClone = {
    init: vi.fn(),
    disconnect: vi.fn(),
    quoteAhPrice: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    vi.spyOn(mockApi, 'clone').mockReturnValue(mockClone)
  })

  it('returns padded fee when conversion succeeds', async () => {
    vi.mocked(getParaEthTransferFees).mockResolvedValue([100n, 50n]) // bridge + ah fee
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({
      symbol: 'MYTH',
      decimals: 18,
      location: { parents: 1, interior: [] }
    } as TAssetInfo)
    vi.mocked(assertHasLocation).mockReturnValue(undefined)
    vi.spyOn(mockClone, 'quoteAhPrice').mockResolvedValue(200n)
    vi.mocked(padValueBy).mockReturnValue(220n)

    const cloneSpy = vi.spyOn(mockApi, 'clone')
    const initSpy = vi.spyOn(mockClone, 'init')
    const quoteSpy = vi.spyOn(mockClone, 'quoteAhPrice')

    const res = await getMythosOriginFee(mockApi)

    expect(cloneSpy).toHaveBeenCalled()
    expect(initSpy).toHaveBeenCalledWith('AssetHubPolkadot')
    expect(getParaEthTransferFees).toHaveBeenCalledWith(mockClone, false)
    expect(findNativeAssetInfoOrThrow).toHaveBeenCalledWith('Mythos')
    expect(assertHasLocation).toHaveBeenCalled()
    expect(quoteSpy).toHaveBeenCalledWith(expect.anything(), { parents: 1, interior: [] }, 150n)
    expect(padValueBy).toHaveBeenCalledWith(200n, 10)
    expect(res).toBe(220n)
  })

  it('throws UnableToComputeError when fee conversion fails', async () => {
    vi.mocked(getParaEthTransferFees).mockResolvedValue([1n, 2n])
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue({
      symbol: 'MYTH',
      decimals: 18,
      location: { parents: 1, interior: [] }
    } as TAssetInfo)
    vi.mocked(assertHasLocation).mockReturnValue(undefined)
    vi.spyOn(mockClone, 'quoteAhPrice').mockResolvedValue(undefined)

    await expect(getMythosOriginFee(mockApi)).rejects.toThrow(UnableToComputeError)
  })
})
