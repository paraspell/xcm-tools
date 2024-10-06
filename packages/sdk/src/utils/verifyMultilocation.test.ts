import { describe, it, expect, vi } from 'vitest'
import * as deepEqual from './deepEqual'
import { getAssetsObject } from '../pallets/assets'
import type { TNode, TMultiLocation, TNodeAssets } from '../types'
import { verifyMultiLocation } from './verifyMultiLocation'

vi.mock('../pallets/assets', () => ({
  getAssetsObject: vi.fn()
}))

describe('verifyMultiLocation', () => {
  const mockNode: TNode = 'Acala'

  const mockMultiLocation: TMultiLocation = {
    parents: 1,
    interior: {
      X1: {
        Parachain: 2011
      }
    }
  }

  it('should return true when multiLocations is undefined', () => {
    vi.mocked(getAssetsObject).mockReturnValue({ multiLocations: undefined } as TNodeAssets)

    expect(verifyMultiLocation(mockNode, mockMultiLocation)).toBe(true)
  })

  it('should return true when multiLocation is found in multiLocations', () => {
    const multiLocations: TMultiLocation[] = [
      {
        parents: 1,
        interior: {
          X1: {
            Parachain: 2011
          }
        }
      },
      {
        parents: 1,
        interior: {
          X2: [
            {
              Parachain: 2034
            },
            {
              GeneralIndex: 0
            }
          ]
        }
      }
    ]
    const multiLocation: TMultiLocation = {
      parents: 1,
      interior: {
        X1: {
          Parachain: 2010
        }
      }
    }

    vi.mocked(getAssetsObject).mockReturnValue({ multiLocations } as TNodeAssets)

    const deepEqualSpy = vi.spyOn(deepEqual, 'deepEqual').mockReturnValue(true)

    expect(verifyMultiLocation(mockNode, multiLocation)).toBe(true)

    expect(deepEqualSpy).toHaveBeenCalledWith(multiLocations[0], multiLocation)

    deepEqualSpy.mockRestore()
  })

  it('should return false when multiLocation is not found in multiLocations', () => {
    const multiLocations = [
      {
        parents: 1,
        interior: {
          X1: {
            Parachain: 2011
          }
        }
      },
      {
        parents: 1,
        interior: {
          X2: [
            {
              Parachain: 2034
            },
            {
              GeneralIndex: 0
            }
          ]
        }
      }
    ]
    const multiLocation: TMultiLocation = {
      parents: 1,
      interior: {
        X1: {
          Parachain: 3369
        }
      }
    }

    vi.mocked(getAssetsObject).mockReturnValue({ multiLocations } as TNodeAssets)

    const deepEqualSpy = vi.spyOn(deepEqual, 'deepEqual').mockReturnValue(false)

    expect(verifyMultiLocation(mockNode, multiLocation)).toBe(false)

    expect(deepEqualSpy).toHaveBeenCalledTimes(multiLocations.length)

    deepEqualSpy.mockRestore()
  })

  it('should return false when multiLocation is not found in multiLocations - lowercase keys', () => {
    const multiLocations = [
      {
        parents: 1,
        interior: {
          x1: {
            parachain: 2011
          }
        }
      },
      {
        parents: 1,
        interior: {
          x2: [
            {
              parachain: 2034
            },
            {
              generalindex: 0
            }
          ]
        }
      }
    ] as unknown as TMultiLocation[]
    const multiLocation = {
      parents: 1,
      interior: {
        x1: {
          parachain: 3369
        }
      }
    } as unknown as TMultiLocation

    vi.mocked(getAssetsObject).mockReturnValue({ multiLocations } as TNodeAssets)

    const deepEqualSpy = vi.spyOn(deepEqual, 'deepEqual').mockReturnValue(false)

    expect(verifyMultiLocation(mockNode, multiLocation)).toBe(false)

    expect(deepEqualSpy).toHaveBeenCalledTimes(multiLocations.length)

    deepEqualSpy.mockRestore()
  })
})
