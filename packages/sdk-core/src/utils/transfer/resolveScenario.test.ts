import type { TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'
import { isRelayChain, isTMultiLocation } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TDestination } from '../../types'
import { resolveScenario } from './resolveScenario'

vi.mock('@paraspell/sdk-common', () => ({
  isRelayChain: vi.fn(),
  isTMultiLocation: vi.fn()
}))

describe('resolveScenario', () => {
  const mockIsRelayChain = vi.mocked(isRelayChain)
  const mockIsTMultiLocation = vi.mocked(isTMultiLocation)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('RelayToPara scenario', () => {
    it('should return "RelayToPara" when origin is a relay chain', () => {
      const origin = 'Polkadot' as TNodeDotKsmWithRelayChains
      const destination = 'Acala' as TDestination

      mockIsRelayChain.mockReturnValue(true)

      const result = resolveScenario(origin, destination)

      expect(result).toBe('RelayToPara')
      expect(mockIsRelayChain).toHaveBeenCalledWith(origin)
      expect(mockIsRelayChain).toHaveBeenCalledTimes(1)
      expect(mockIsTMultiLocation).not.toHaveBeenCalled()
    })

    it('should return "RelayToPara" when origin is relay chain regardless of destination type', () => {
      const origin = 'Kusama' as TNodeDotKsmWithRelayChains
      const destination = { parents: 1, interior: 'Here' } as TDestination

      mockIsRelayChain.mockReturnValue(true)

      const result = resolveScenario(origin, destination)

      expect(result).toBe('RelayToPara')
      expect(mockIsRelayChain).toHaveBeenCalledWith(origin)
    })
  })

  describe('ParaToRelay scenario', () => {
    it('should return "ParaToRelay" when origin is not relay chain, destination is not TMultiLocation and destination is relay chain', () => {
      const origin = 'Acala' as TNodeDotKsmWithRelayChains
      const destination = 'Polkadot' as TDestination

      mockIsRelayChain.mockReturnValueOnce(false).mockReturnValueOnce(true)
      mockIsTMultiLocation.mockReturnValue(false)

      const result = resolveScenario(origin, destination)

      expect(result).toBe('ParaToRelay')
      expect(mockIsRelayChain).toHaveBeenCalledWith(origin)
      expect(mockIsTMultiLocation).toHaveBeenCalledWith(destination)
      expect(mockIsRelayChain).toHaveBeenCalledWith(destination)
      expect(mockIsRelayChain).toHaveBeenCalledTimes(2)
    })

    it('should return "ParaToRelay" when origin is parachain and destination is Kusama relay', () => {
      const origin = 'Karura' as TNodeDotKsmWithRelayChains
      const destination = 'Kusama' as TDestination

      mockIsRelayChain.mockReturnValueOnce(false).mockReturnValueOnce(true)
      mockIsTMultiLocation.mockReturnValue(false)

      const result = resolveScenario(origin, destination)

      expect(result).toBe('ParaToRelay')
    })
  })

  describe('ParaToPara scenario', () => {
    it('should return "ParaToPara" when origin is not relay chain and destination is TMultiLocation', () => {
      const origin = 'Acala' as TNodeDotKsmWithRelayChains
      const destination = { parents: 1, interior: { X1: { Parachain: 2000 } } } as TDestination

      mockIsRelayChain.mockReturnValue(false)
      mockIsTMultiLocation.mockReturnValue(true)

      const result = resolveScenario(origin, destination)

      expect(result).toBe('ParaToPara')
      expect(mockIsRelayChain).toHaveBeenCalledWith(origin)
      expect(mockIsTMultiLocation).toHaveBeenCalledWith(destination)
      expect(mockIsRelayChain).toHaveBeenCalledTimes(1)
    })

    it('should return "ParaToPara" when origin is not relay chain, destination is not TMultiLocation but also not relay chain', () => {
      const origin = 'Acala' as TNodeDotKsmWithRelayChains
      const destination = 'Moonbeam' as TDestination

      mockIsRelayChain.mockReturnValueOnce(false).mockReturnValueOnce(false)
      mockIsTMultiLocation.mockReturnValue(false)

      const result = resolveScenario(origin, destination)

      expect(result).toBe('ParaToPara')
      expect(mockIsRelayChain).toHaveBeenCalledWith(origin)
      expect(mockIsTMultiLocation).toHaveBeenCalledWith(destination)
      expect(mockIsRelayChain).toHaveBeenCalledWith(destination)
      expect(mockIsRelayChain).toHaveBeenCalledTimes(2)
    })

    it('should return "ParaToPara" when both origin and destination are parachains', () => {
      const origin = 'Karura' as TNodeDotKsmWithRelayChains
      const destination = 'Moonriver' as TDestination

      mockIsRelayChain.mockReturnValue(false)
      mockIsTMultiLocation.mockReturnValue(false)

      const result = resolveScenario(origin, destination)

      expect(result).toBe('ParaToPara')
    })
  })

  describe('edge cases', () => {
    it('should handle when destination is TMultiLocation but origin check fails first', () => {
      const origin = 'SomeParachain' as TNodeDotKsmWithRelayChains
      const destination = { parents: 0, interior: 'Here' } as TDestination

      mockIsRelayChain.mockReturnValue(false)
      mockIsTMultiLocation.mockReturnValue(true)

      const result = resolveScenario(origin, destination)

      expect(result).toBe('ParaToPara')
      expect(mockIsRelayChain).toHaveBeenCalledWith(origin)
      expect(mockIsTMultiLocation).toHaveBeenCalledWith(destination)
    })

    it('should prioritize origin relay chain check over destination checks', () => {
      const origin = 'Polkadot' as TNodeDotKsmWithRelayChains
      const destination = { parents: 1, interior: { X1: [] } } as TDestination

      mockIsRelayChain.mockReturnValue(true)
      mockIsTMultiLocation.mockReturnValue(true)

      const result = resolveScenario(origin, destination)

      expect(result).toBe('RelayToPara')
      expect(mockIsRelayChain).toHaveBeenCalledWith(origin)
      expect(mockIsTMultiLocation).not.toHaveBeenCalled()
    })
  })
})
