// Regression test for C-W4-2 (Dedot half): the fee-asset origin fee must
// include the swap cost. The Dedot branch used to match PAPI-shaped
// e.type/e.value events only, so a real Dedot-shaped SwapCreditExecuted
// event was ignored and the fee was under-reported (250n vs 1000n).
import type { TSubstrateChain } from '@paraspell/sdk-core'
import { getNativeAssetSymbol } from '@paraspell/sdk-core'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { computeOriginFee } from './computeOriginFee'
import { getLocationTokenId } from './getLocationTokenId'

vi.mock('@paraspell/sdk-core')
vi.mock('./getLocationTokenId')

describe('C-W4-2 regression: Dedot fee-asset origin fee', () => {
  const mockChain: TSubstrateChain = 'Acala'

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('counts the swap cost for a fee-asset transfer (production 3-arg call)', () => {
    const dryRun = {
      value: {
        emittedEvents: [
          {
            pallet: 'XcmPallet',
            palletEvent: {
              name: 'FeesPaid',
              data: {
                fees: [{ fun: { type: 'Fungible', value: 50n }, id: 'tokenId1' }],
              },
            },
          },
          {
            pallet: 'AssetConversion',
            palletEvent: {
              name: 'SwapCreditExecuted',
              data: { amount_in: 1000n },
            },
          },
        ],
      },
    }

    vi.mocked(getNativeAssetSymbol).mockReturnValue('ACA')
    vi.mocked(getLocationTokenId).mockImplementation((id: string) =>
      id === 'tokenId1' ? 'ACA' : null,
    )

    // Production call shape: 3 args, isFeeAsset never passed (DedotApi.ts:584)
    const result = computeOriginFee(dryRun, mockChain, 200n)
    expect(result).toBe(1000n)
  })

  it('counts the swap cost when isFeeAsset=true (Dedot-shaped events)', () => {
    const dryRun = {
      value: {
        emittedEvents: [
          {
            pallet: 'XcmPallet',
            palletEvent: {
              name: 'FeesPaid',
              data: {
                fees: [{ fun: { type: 'Fungible', value: 50n }, id: 'tokenId1' }],
              },
            },
          },
          {
            pallet: 'AssetConversion',
            palletEvent: {
              name: 'SwapCreditExecuted',
              data: { amount_in: 1000n },
            },
          },
        ],
      },
    }

    vi.mocked(getNativeAssetSymbol).mockReturnValue('ACA')
    vi.mocked(getLocationTokenId).mockImplementation((id: string) =>
      id === 'tokenId1' ? 'ACA' : null,
    )

    // Even explicitly enabled, the branch checks e.type === 'AssetConversion'
    // (PAPI shape) — a Dedot-shaped event has pallet/palletEvent, no .type
    const result = computeOriginFee(dryRun, mockChain, 200n, true)
    expect(result).toBe(1000n)
  })
})
