// Regression test for C-W4-2 (PJS half): the fee-asset origin fee must
// include the swap cost. PJS computeOriginFee used to ignore AssetConversion
// SwapCreditExecuted events entirely, so a fee-asset transfer was
// under-reported (250n vs 1000n for the same scenario PAPI reports 1000n).
// Event shape is the PJS humanized form from the W4 repro driver.
import { getNativeAssetSymbol, type TSubstrateChain } from '@paraspell/sdk-core'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { computeOriginFee } from './computeOriginFee'
import { getLocationTokenId } from './getLocationTokenId'

vi.mock('@paraspell/sdk-core')
vi.mock('./getLocationTokenId')

describe('C-W4-2 regression: PJS fee-asset origin fee', () => {
  const mockChain: TSubstrateChain = 'Acala'

  beforeEach(() => {
    vi.resetAllMocks()
  })

  const feeAssetDryRun = {
    Ok: {
      emittedEvents: [
        {
          section: 'assetConversion',
          method: 'SwapCreditExecuted',
          data: { amountIn: '1,000' },
        },
        {
          section: 'xcmPallet',
          method: 'FeesPaid',
          data: {
            fees: [
              {
                fun: { Fungible: '50' },
                id: { parents: 0, interior: { Here: null } },
              },
            ],
          },
        },
      ],
    },
  }

  it('counts the swap cost for a fee-asset transfer', () => {
    vi.mocked(getNativeAssetSymbol).mockReturnValue('ACA')
    vi.mocked(getLocationTokenId).mockReturnValue('ACA')

    const result = computeOriginFee(feeAssetDryRun, mockChain, 200n)
    expect(result).toBe(1000n)
  })

  it('still returns delivery + execution fees when no swap happened', () => {
    const dryRun = {
      Ok: {
        emittedEvents: [
          {
            section: 'xcmPallet',
            method: 'FeesPaid',
            data: {
              fees: [
                {
                  fun: { Fungible: '50' },
                  id: { parents: 0, interior: { Here: null } },
                },
              ],
            },
          },
        ],
      },
    }

    vi.mocked(getNativeAssetSymbol).mockReturnValue('ACA')
    vi.mocked(getLocationTokenId).mockReturnValue('ACA')

    const result = computeOriginFee(dryRun, mockChain, 200n)
    expect(result).toBe(250n)
  })
})
