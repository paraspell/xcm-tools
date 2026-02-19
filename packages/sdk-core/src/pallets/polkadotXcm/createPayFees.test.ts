import type { TAsset } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { describe, expect, it } from 'vitest'

import type { TWeight } from '../../types'
import { createPayFees } from './createPayFees'

describe('createPayFees', () => {
  const asset: TAsset = {
    id: { parents: 0, interior: 'Here' },
    fun: { Fungible: 1_000_000_000n }
  }

  const weight: TWeight = {
    refTime: 123_456n,
    proofSize: 789n
  }

  it('should create BuyExecution with Unlimited weight for versions below V5', () => {
    const result = createPayFees(Version.V4, asset)

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
    const result = createPayFees(Version.V3, asset, weight)

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

  it('should create BuyExecution with Unlimited weight for V5 and above', () => {
    const result = createPayFees(Version.V5, asset)

    expect(result).toEqual([
      {
        BuyExecution: {
          fees: asset,
          weight_limit: 'Unlimited'
        }
      }
    ])
  })

  it('should create BuyExecution with Limited weight for V5 when weight is provided', () => {
    const result = createPayFees(Version.V5, asset, weight)

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
