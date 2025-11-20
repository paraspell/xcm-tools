import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import { describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api/IPolkadotApi'
import { DRY_RUN_CLIENT_TIMEOUT_MS } from '../../constants'
import type { TDryRunChainResult } from '../../types'
import { validateAddress } from '../../utils'
import { dryRunOrigin } from './dryRunOrigin'

vi.mock('../../utils')

describe('getDryRunOrigin', () => {
  const apiMock = {
    init: vi.fn(),
    getDryRunCall: vi.fn(),
    disconnect: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown>

  it('returns the dry run result', async () => {
    const address = '0x123'
    const chain = 'Polkadot'

    const mockResult: TDryRunChainResult = {
      success: true,
      fee: 1000n,
      forwardedXcms: [],
      destParaId: 0,
      currency: 'DOT',
      asset: {
        symbol: 'DOT',
        decimals: 10
      } as TAssetInfo
    }

    vi.spyOn(apiMock, 'getDryRunCall').mockResolvedValue(mockResult)

    const initSpy = vi.spyOn(apiMock, 'init')
    const disconnectSpy = vi.spyOn(apiMock, 'disconnect')

    const result = await dryRunOrigin({
      api: apiMock,
      chain,
      destination: 'Kusama',
      address,
      asset: {} as WithAmount<TAssetInfo>,
      tx: {}
    })

    expect(validateAddress).toHaveBeenCalledWith(apiMock, address, chain, false)
    expect(result).toEqual(mockResult)
    expect(initSpy).toHaveBeenCalledWith(chain, DRY_RUN_CLIENT_TIMEOUT_MS)
    expect(disconnectSpy).toHaveBeenCalled()
  })
})
