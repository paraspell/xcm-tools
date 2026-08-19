import { describe, expect, it } from 'vitest'

import type { TAssetInfo } from '../types'
import { isAdditionalSubstrateBridgeAsset } from './isAdditionalSubstrateBridgeAsset'

describe('isAdditionalSubstrateBridgeAsset', () => {
  const cgt: TAssetInfo = {
    symbol: 'CGT2.0',
    decimals: 18,
    location: {
      parents: 2,
      interior: {
        X2: [
          { GlobalConsensus: { Ethereum: { chainId: 1 } } },
          {
            AccountKey20: {
              network: null,
              key: '0x0e186357c323c806c1efdad36d217f7a54b63d18'
            }
          }
        ]
      }
    }
  }

  it('returns true for CGT by its canonical Ethereum location', () => {
    expect(isAdditionalSubstrateBridgeAsset(cgt)).toBe(true)
  })

  it('returns false for a different Ethereum asset', () => {
    expect(
      isAdditionalSubstrateBridgeAsset({
        ...cgt,
        location: {
          ...cgt.location,
          interior: {
            X2: [
              { GlobalConsensus: { Ethereum: { chainId: 1 } } },
              {
                AccountKey20: {
                  network: null,
                  key: '0x0000000000000000000000000000000000000000'
                }
              }
            ]
          }
        }
      })
    ).toBe(false)
  })
})
