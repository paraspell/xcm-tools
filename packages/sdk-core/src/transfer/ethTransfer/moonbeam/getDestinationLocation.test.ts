import type { TChainAssetsInfo } from '@paraspell/assets'
import { getAssetsObject } from '@paraspell/assets'
import type { TParachain } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../../api'
import { getChainConfig } from '../../../chains/config'
import type { TChainConfig } from '../../../types'
import { getDestinationLocation } from './getDestinationLocation'

vi.mock('@paraspell/assets', () => ({
  getAssetsObject: vi.fn()
}))

vi.mock('../../../chains/config', () => ({
  getChainConfig: vi.fn()
}))

describe('getDestinationLocation', () => {
  const mockApi = {
    accountToHex: vi.fn().mockReturnValue('abc123')
  } as unknown as IPolkadotApi<unknown, unknown>

  let mockDestination: TParachain

  beforeEach(() => {
    vi.clearAllMocks()
    mockDestination = 'AssetHubPolkadot' as TParachain

    vi.mocked(getAssetsObject).mockReturnValue({ isEVM: false } as TChainAssetsInfo)
    vi.mocked(getChainConfig).mockReturnValue({ paraId: 2000 } as TChainConfig)
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
    vi.mocked(getChainConfig).mockReturnValue({ paraId: 3000 } as TChainConfig)
    const spy = vi.spyOn(mockApi, 'accountToHex').mockReturnValue('deadbeef')

    const result = getDestinationLocation(mockApi, 'another-address', mockDestination)

    expect(spy).toHaveBeenCalledWith('another-address', false)
    expect(result[0]).toBe(1)

    const [paraIdHex, finalAddress] = result[1] as [string, string]

    expect(paraIdHex).toBe('0x0000000bb8')

    expect(finalAddress).toBe('0x03deadbeef00')
  })

  it('calls getChainConfig with the correct destination', () => {
    getDestinationLocation(mockApi, 'some-address', mockDestination)
    expect(getChainConfig).toHaveBeenCalledTimes(1)
    expect(getChainConfig).toHaveBeenCalledWith(mockDestination)
  })

  it('calls getAssetsObject with the correct destination', () => {
    getDestinationLocation(mockApi, 'some-address', mockDestination)
    expect(getAssetsObject).toHaveBeenCalledTimes(1)
    expect(getAssetsObject).toHaveBeenCalledWith(mockDestination)
  })
})
