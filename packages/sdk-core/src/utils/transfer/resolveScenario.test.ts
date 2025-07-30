import type { TSubstrateChain } from '@paraspell/sdk-common'
import { isRelayChain, isTLocation } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TDestination } from '../../types'
import { resolveScenario } from './resolveScenario'

vi.mock('@paraspell/sdk-common', () => ({
  isRelayChain: vi.fn(),
  isTLocation: vi.fn()
}))

describe('resolveScenario', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('RelayToPara scenario', () => {
    it('should return "RelayToPara" when origin is a relay chain', () => {
      const origin: TSubstrateChain = 'Polkadot'
      const destination: TDestination = 'Acala'

      vi.mocked(isRelayChain).mockReturnValue(true)

      const result = resolveScenario(origin, destination)

      expect(result).toBe('RelayToPara')
      expect(isRelayChain).toHaveBeenCalledWith(origin)
      expect(isRelayChain).toHaveBeenCalledTimes(1)
      expect(isTLocation).not.toHaveBeenCalled()
    })

    it('should return "RelayToPara" when origin is relay chain regardless of destination type', () => {
      const origin: TSubstrateChain = 'Kusama'
      const destination: TDestination = { parents: 1, interior: 'Here' }

      vi.mocked(isRelayChain).mockReturnValue(true)

      const result = resolveScenario(origin, destination)

      expect(result).toBe('RelayToPara')
      expect(isRelayChain).toHaveBeenCalledWith(origin)
    })
  })

  describe('ParaToRelay scenario', () => {
    it('should return "ParaToRelay" when origin is not relay chain, destination is not TLocation and destination is relay chain', () => {
      const origin: TSubstrateChain = 'Acala'
      const destination: TDestination = 'Polkadot'

      vi.mocked(isRelayChain).mockReturnValueOnce(false).mockReturnValueOnce(true)
      vi.mocked(isTLocation).mockReturnValue(false)

      const result = resolveScenario(origin, destination)

      expect(result).toBe('ParaToRelay')
      expect(isRelayChain).toHaveBeenCalledWith(origin)
      expect(isTLocation).toHaveBeenCalledWith(destination)
      expect(isRelayChain).toHaveBeenCalledWith(destination)
      expect(isRelayChain).toHaveBeenCalledTimes(2)
    })

    it('should return "ParaToRelay" when origin is parachain and destination is Kusama relay', () => {
      const origin: TSubstrateChain = 'Karura'
      const destination: TDestination = 'Kusama'

      vi.mocked(isRelayChain).mockReturnValueOnce(false).mockReturnValueOnce(true)
      vi.mocked(isTLocation).mockReturnValue(false)

      const result = resolveScenario(origin, destination)

      expect(result).toBe('ParaToRelay')
    })
  })

  describe('ParaToPara scenario', () => {
    it('should return "ParaToPara" when origin is not relay chain and destination is TLocation', () => {
      const origin: TSubstrateChain = 'Acala'
      const destination: TDestination = { parents: 1, interior: { X1: { Parachain: 2000 } } }

      vi.mocked(isRelayChain).mockReturnValue(false)
      vi.mocked(isTLocation).mockReturnValue(true)

      const result = resolveScenario(origin, destination)

      expect(result).toBe('ParaToPara')
      expect(isRelayChain).toHaveBeenCalledWith(origin)
      expect(isTLocation).toHaveBeenCalledWith(destination)
      expect(isRelayChain).toHaveBeenCalledTimes(1)
    })

    it('should return "ParaToPara" when origin is not relay chain, destination is not TLocation but also not relay chain', () => {
      const origin: TSubstrateChain = 'Acala'
      const destination: TDestination = 'Moonbeam'

      vi.mocked(isRelayChain).mockReturnValueOnce(false).mockReturnValueOnce(false)
      vi.mocked(isTLocation).mockReturnValue(false)

      const result = resolveScenario(origin, destination)

      expect(result).toBe('ParaToPara')
      expect(isRelayChain).toHaveBeenCalledWith(origin)
      expect(isTLocation).toHaveBeenCalledWith(destination)
      expect(isRelayChain).toHaveBeenCalledWith(destination)
      expect(isRelayChain).toHaveBeenCalledTimes(2)
    })

    it('should return "ParaToPara" when both origin and destination are parachains', () => {
      const origin: TSubstrateChain = 'Karura'
      const destination: TDestination = 'Moonriver'

      vi.mocked(isRelayChain).mockReturnValue(false)
      vi.mocked(isTLocation).mockReturnValue(false)

      const result = resolveScenario(origin, destination)

      expect(result).toBe('ParaToPara')
    })
  })

  describe('edge cases', () => {
    it('should handle when destination is TLocation but origin check fails first', () => {
      const origin: TSubstrateChain = 'Acala'
      const destination: TDestination = { parents: 0, interior: 'Here' }

      vi.mocked(isRelayChain).mockReturnValue(false)
      vi.mocked(isTLocation).mockReturnValue(true)

      const result = resolveScenario(origin, destination)

      expect(result).toBe('ParaToPara')
      expect(isRelayChain).toHaveBeenCalledWith(origin)
      expect(isTLocation).toHaveBeenCalledWith(destination)
    })

    it('should prioritize origin relay chain check over destination checks', () => {
      const origin: TSubstrateChain = 'Polkadot'
      const destination: TDestination = { parents: 1, interior: { X1: [] } }

      vi.mocked(isRelayChain).mockReturnValue(true)
      vi.mocked(isTLocation).mockReturnValue(true)

      const result = resolveScenario(origin, destination)

      expect(result).toBe('RelayToPara')
      expect(isRelayChain).toHaveBeenCalledWith(origin)
      expect(isTLocation).not.toHaveBeenCalled()
    })
  })
})
