import type { TChainAssetsInfo } from '@paraspell/assets'
import { getAssetsObject } from '@paraspell/assets'
import type { TNodePolkadotKusama } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../../api'
import { getNodeConfig } from '../../../nodes/config'
import type { TNodeConfig } from '../../../types'
import { getDestinationLocation } from './getDestinationLocation'

vi.mock('@paraspell/assets', () => ({
  getAssetsObject: vi.fn()
}))

vi.mock('../../../nodes/config', () => ({
  getNodeConfig: vi.fn()
}))

describe('getDestinationLocation', () => {
  const mockApi = {
    accountToHex: vi.fn().mockReturnValue('abc123')
  } as unknown as IPolkadotApi<unknown, unknown>

  let mockDestination: TNodePolkadotKusama

  beforeEach(() => {
    vi.clearAllMocks()
    mockDestination = 'Polkadot' as TNodePolkadotKusama

    vi.mocked(getAssetsObject).mockReturnValue({ isEVM: false } as TChainAssetsInfo)
    vi.mocked(getNodeConfig).mockReturnValue({ paraId: 2000 } as TNodeConfig)
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
    vi.mocked(getNodeConfig).mockReturnValue({ paraId: 3000 } as TNodeConfig)
    const spy = vi.spyOn(mockApi, 'accountToHex').mockReturnValue('deadbeef')

    const result = getDestinationLocation(mockApi, 'another-address', mockDestination)

    expect(spy).toHaveBeenCalledWith('another-address', false)
    expect(result[0]).toBe(1)

    const [paraIdHex, finalAddress] = result[1] as [string, string]

    expect(paraIdHex).toBe('0x0000000bb8')

    expect(finalAddress).toBe('0x03deadbeef00')
  })

  it('calls getNodeConfig with the correct destination', () => {
    getDestinationLocation(mockApi, 'some-address', mockDestination)
    expect(getNodeConfig).toHaveBeenCalledTimes(1)
    expect(getNodeConfig).toHaveBeenCalledWith(mockDestination)
  })

  it('calls getAssetsObject with the correct destination', () => {
    getDestinationLocation(mockApi, 'some-address', mockDestination)
    expect(getAssetsObject).toHaveBeenCalledTimes(1)
    expect(getAssetsObject).toHaveBeenCalledWith(mockDestination)
  })
})
