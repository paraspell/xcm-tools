import type { TChainAssetsInfo } from '@paraspell/assets'
import { getAssetsObject } from '@paraspell/assets'
import type { TParachain } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../../api'
import { getDestinationLocation } from './getDestinationLocation'

vi.mock('@paraspell/assets')

describe('getDestinationLocation', () => {
  const getParaId = vi.fn()
  const mockApi = {
    accountToHex: vi.fn().mockReturnValue('abc123'),
    getParaId
  } as unknown as PolkadotApi<unknown, unknown, unknown>

  let mockDestination: TParachain

  beforeEach(() => {
    vi.clearAllMocks()
    mockDestination = 'AssetHubPolkadot'

    vi.mocked(getAssetsObject).mockReturnValue({ isEVM: false } as TChainAssetsInfo)
    getParaId.mockReturnValue(2000)
  })

  it('returns correct location when isEVM=false', () => {
    vi.mocked(getAssetsObject).mockReturnValue({ isEVM: false } as TChainAssetsInfo)

    const spy = vi.spyOn(mockApi, 'accountToHex')

    const result = getDestinationLocation(mockApi, 'some-address', mockDestination)

    expect(spy).toHaveBeenCalledWith('some-address', false)

    expect(result.length).toBe(2)
    expect(result[0]).toBe(1)

    const [paraIdHex, finalAddress] = result[1] as [string, string]

    // paraId=2000 => 0x7d0 => "0x00000007d0"
    expect(paraIdHex).toBe('0x00000007d0')

    // accountType='01', addressHex='abc123', '00' at the end
    expect(finalAddress).toBe('0x01abc12300')
  })

  it('returns correct location when isEVM=true', () => {
    vi.mocked(getAssetsObject).mockReturnValue({ isEVM: true } as TChainAssetsInfo)
    getParaId.mockReturnValue(3000)
    const spy = vi.spyOn(mockApi, 'accountToHex').mockReturnValue('deadbeef')

    const result = getDestinationLocation(mockApi, 'another-address', mockDestination)

    expect(spy).toHaveBeenCalledWith('another-address', false)
    expect(result[0]).toBe(1)

    const [paraIdHex, finalAddress] = result[1] as [string, string]

    expect(paraIdHex).toBe('0x0000000bb8')

    expect(finalAddress).toBe('0x03deadbeef00')
  })

  it('calls getParaId with the correct destination', () => {
    getDestinationLocation(mockApi, 'some-address', mockDestination)
    expect(getParaId).toHaveBeenCalledTimes(1)
    expect(getParaId).toHaveBeenCalledWith(mockDestination)
  })

  it('calls getAssetsObject with the correct destination', () => {
    getDestinationLocation(mockApi, 'some-address', mockDestination)
    expect(getAssetsObject).toHaveBeenCalledTimes(1)
    expect(getAssetsObject).toHaveBeenCalledWith(mockDestination)
  })
})
