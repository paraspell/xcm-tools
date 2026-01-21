import { isRelayChain, Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { UnsupportedOperationError } from '../../errors'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { addXcmVersionHeader, createBeneficiaryLocation, createDestination } from '../../utils'
import { createPayFees } from './createPayFees'
import { createTransactInstructions } from './createTransact'
import { handleTransactUsingSend } from './handleTransactUsingSend'

vi.mock('@paraspell/sdk-common', async importActual => ({
  ...(await importActual()),
  isRelayChain: vi.fn()
}))

vi.mock('../../utils')

vi.mock('./createPayFees', () => ({
  createPayFees: vi.fn().mockReturnValue([{ PayFees: 'feeInstruction' }])
}))

vi.mock('./createTransact', () => ({
  createTransactInstructions: vi.fn().mockResolvedValue([{ Transact: 'transactInstruction' }])
}))

describe('handleTransactUsingSend', () => {
  let api: IPolkadotApi<unknown, unknown>

  beforeEach(() => {
    api = {} as unknown as IPolkadotApi<unknown, unknown>
    vi.clearAllMocks()
    vi.mocked(addXcmVersionHeader).mockImplementation(obj => obj)
    vi.mocked(createBeneficiaryLocation).mockReturnValue({
      parents: 0,
      interior: 'Here'
    })
  })

  const createMockOptions = (
    overrides: Partial<TPolkadotXCMTransferOptions<unknown, unknown>> = {}
  ) =>
    ({
      api,
      chain: 'Acala',
      destination: 'Astar',
      destChain: 'Astar',
      address: '5FMockAddress',
      paraIdTo: 2000,
      version: Version.V4,
      asset: {},
      transactOptions: {
        call: '0x1234'
      },
      ...overrides
    }) as TPolkadotXCMTransferOptions<unknown, unknown>

  describe('Error handling', () => {
    it('should throw UnsupportedOperationError when transactOptions.call is not defined', async () => {
      const options = createMockOptions({
        transactOptions: undefined
      })

      await expect(handleTransactUsingSend(options)).rejects.toThrow(UnsupportedOperationError)
      await expect(handleTransactUsingSend(options)).rejects.toThrow(
        'Cannot use handleTransactUsingSend without transactOptions.call defined'
      )
    })

    it('should throw UnsupportedOperationError when destChain is not provided', async () => {
      const options = createMockOptions({
        destChain: undefined
      })

      await expect(handleTransactUsingSend(options)).rejects.toThrow(UnsupportedOperationError)
      await expect(handleTransactUsingSend(options)).rejects.toThrow(
        'destChain must be provided when using handleTransactUsingSend'
      )
    })
  })

  describe('Message construction', () => {
    it('should construct message with correct XCM instructions in order', async () => {
      const options = createMockOptions()

      const result = await handleTransactUsingSend(options)

      expect(createPayFees).toHaveBeenCalledWith(options.version, options.asset)
      expect(createTransactInstructions).toHaveBeenCalledWith(
        api,
        options.transactOptions,
        options.version,
        options.destChain,
        options.address
      )
      expect(createBeneficiaryLocation).toHaveBeenCalledWith({
        api,
        address: options.address,
        version: options.version
      })

      const expectedMessage = [
        {
          WithdrawAsset: [options.asset]
        },
        { PayFees: 'feeInstruction' },
        { Transact: 'transactInstruction' },
        {
          RefundSurplus: undefined
        },
        {
          DepositAsset: {
            assets: { Wild: { AllCounted: 1 } },
            beneficiary: {
              parents: 0,
              interior: 'Here'
            }
          }
        }
      ]

      expect(result.params.message).toEqual(expectedMessage)
    })
  })

  describe('Module selection', () => {
    it('should use XcmPallet module when chain is relay chain', async () => {
      vi.mocked(isRelayChain).mockReturnValue(true)

      const options = createMockOptions({
        chain: 'Polkadot'
      })

      const result = await handleTransactUsingSend(options)

      expect(isRelayChain).toHaveBeenCalledWith('Polkadot')
      expect(result.module).toBe('XcmPallet')
    })

    it('should use PolkadotXcm module when chain is parachain', async () => {
      vi.mocked(isRelayChain).mockReturnValue(false)

      const options = createMockOptions({
        chain: 'Acala'
      })

      const result = await handleTransactUsingSend(options)

      expect(isRelayChain).toHaveBeenCalledWith('Acala')
      expect(result.module).toBe('PolkadotXcm')
    })
  })

  describe('Return value structure', () => {
    it('should return correct extrinsic structure', async () => {
      const options = createMockOptions()

      const result = await handleTransactUsingSend(options)

      expect(result).toHaveProperty('module')
      expect(result).toHaveProperty('method')
      expect(result).toHaveProperty('params')
      expect(result.method).toBe('send')
      expect(result.params).toHaveProperty('dest')
      expect(result.params).toHaveProperty('message')
    })

    it('should call createDestination with correct parameters', async () => {
      const options = createMockOptions()

      await handleTransactUsingSend(options)

      expect(createDestination).toHaveBeenCalledWith(
        options.version,
        options.chain,
        options.destination,
        options.paraIdTo
      )
    })
  })
})
