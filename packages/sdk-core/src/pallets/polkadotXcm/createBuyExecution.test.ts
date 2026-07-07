import type { TAsset } from '@paraspell/assets'
import { describe, expect, it } from 'vitest'

import type { TWeight } from '../../types'
import { createBuyExecution } from './createBuyExecution'

describe('createBuyExecution', () => {
  const asset: TAsset = {
    id: { parents: 0, interior: 'Here' },
    fun: { Fungible: 1_000_000_000n }
  }

  const weight: TWeight = {
    refTime: 123_456n,
    proofSize: 789n
  }

  it('should create BuyExecution with Unlimited weight when no weight is provided', () => {
    const result = createBuyExecution(asset)

    expect(result).toEqual([
      {
        BuyExecution: {
          fees: asset,
          weight_limit: 'Unlimited'
        }
      }
    ])
  })

  it('should create BuyExecution with Limited weight when weight is provided', () => {
    const result = createBuyExecution(asset, weight)

    expect(result).toEqual([
      {
        BuyExecution: {
          fees: asset,
          weight_limit: {
            Limited: {
              ref_time: weight.refTime,
              proof_size: weight.proofSize
            }
          }
        }
      }
    ])
  })
})
