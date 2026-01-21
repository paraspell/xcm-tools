/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { TAssetInfo } from '@paraspell/assets'
import { findAssetInfoOrThrow, getNativeAssetSymbol } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getParaId } from '../../../chains/config'
import type { TCreateSwapXcmInternalOptions } from '../../../types'
import { assertHasLocation } from '../../assertions'
import { createAsset } from '../../asset'
import { localizeLocation } from '../../location'
import { addXcmVersionHeader } from '../../xcm-version'
import { createBaseExecuteXcm } from './createBaseExecuteXcm'
import { createSwapExecuteXcm } from './createSwapExecuteXcm'
import { isMultiHopSwap } from './isMultiHopSwap'
import { prepareCommonExecuteXcm } from './prepareCommonExecuteXcm'

vi.mock('@paraspell/assets')
vi.mock('../../../chains/config')
vi.mock('../../xcm-version')
vi.mock('../../assertions')
vi.mock('../../location')
vi.mock('../../asset')
vi.mock('./createBaseExecuteXcm')
vi.mock('./prepareCommonExecuteXcm')
vi.mock('./isMultiHopSwap')

describe('createSwapExecuteXcm', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('builds a simple swap XCM when no multi-hop and no destChain', async () => {
    vi.mocked(assertHasLocation).mockImplementation(() => {})
    vi.mocked(getNativeAssetSymbol).mockReturnValue('DOT')
    vi.mocked(isMultiHopSwap).mockReturnValue(false)
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({
      location: {}
    } as TAssetInfo)
    vi.mocked(createAsset).mockReturnValue({} as any)
    vi.mocked(localizeLocation).mockReturnValue({} as any)
    vi.mocked(prepareCommonExecuteXcm).mockReturnValue({
      prefix: ['P1'] as any,
      depositInstruction: 'D1' as any
    })
    vi.mocked(addXcmVersionHeader).mockImplementation((xcm, _v) => ['HDR', ...(xcm as any[])])

    const options = {
      api: {} as any,
      chain: undefined,
      exchangeChain: 'Hydration' as any,
      destChain: undefined,
      assetInfoFrom: { amount: 2000n, location: {} } as any,
      assetInfoTo: { amount: 1500n, location: {} } as any,
      fees: { originReserveFee: 10n, exchangeFee: 0n, destReserveFee: 20n },
      recipientAddress: 'addr1',
      version: 3,
      paraIdTo: 42
    } as unknown as TCreateSwapXcmInternalOptions<unknown, unknown>

    const result = (await createSwapExecuteXcm(options)) as unknown as any[]

    expect(prepareCommonExecuteXcm).toHaveBeenCalledOnce()
    expect(isMultiHopSwap).toHaveBeenCalledWith(
      'Hydration',
      options.assetInfoFrom,
      options.assetInfoTo
    )
    expect(result[0]).toBe('HDR')
    expect(result[1]).toBe('P1')
    expect(result[2]).toMatchObject({
      ExchangeAsset: {
        maximal: false,
        give: expect.any(Object),
        want: expect.any(Array)
      }
    })
  })

  it('builds a multi-hop swap XCM with destChain and chain provided', async () => {
    vi.mocked(assertHasLocation).mockImplementation(() => {})
    vi.mocked(getNativeAssetSymbol).mockReturnValue('KSM')
    vi.mocked(isMultiHopSwap).mockReturnValue(true)
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({ location: {} } as any)
    vi.mocked(localizeLocation).mockImplementation((_chain, ml) => ml)
    vi.mocked(createAsset)
      .mockReturnValueOnce({} as any)
      .mockReturnValueOnce({} as any)
      .mockReturnValueOnce({} as any)
    vi.mocked(prepareCommonExecuteXcm).mockReturnValue({
      prefix: ['PFX'] as any,
      depositInstruction: 'DEP' as any
    })
    vi.mocked(createBaseExecuteXcm).mockReturnValueOnce(['X1']).mockReturnValueOnce(['X2'])
    vi.mocked(getParaId).mockReturnValue(99)
    const minOut = 123n
    const calculateMinAmountOut = vi.fn().mockResolvedValue(minOut)
    vi.mocked(addXcmVersionHeader).mockImplementation((xcm, _v) => ['HEAD', ...(xcm as any[])])

    const options = {
      api: {} as any,
      chain: 'Relay',
      exchangeChain: 'Kusama' as any,
      destChain: 'Moonriver' as any,
      assetInfoFrom: { amount: 2000n, location: {} } as any,
      assetInfoTo: { amount: 1500n, location: {} } as any,
      fees: { originReserveFee: 5n, exchangeFee: 10n, destReserveFee: 15n },
      recipientAddress: 'addr2',
      version: 2,
      paraIdTo: 77,
      calculateMinAmountOut
    } as unknown as TCreateSwapXcmInternalOptions<unknown, unknown>

    const result = await createSwapExecuteXcm(options)

    expect(isMultiHopSwap).toHaveBeenCalledWith(
      'Kusama',
      options.assetInfoFrom,
      options.assetInfoTo
    )
    expect(createBaseExecuteXcm).toHaveBeenCalledTimes(2)
    expect(result).toEqual(['HEAD', 'PFX', 'X2'])
  })
})
