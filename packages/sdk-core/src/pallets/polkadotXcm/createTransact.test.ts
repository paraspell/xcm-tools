import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import type { TTransactOptions, TWeight } from '../../types'
import { createTransactInstructions } from './createTransact'

describe('createTransactInstructions', () => {
  const mockApi = {
    clone: vi.fn(),
    init: vi.fn(),
    txFromHex: vi.fn(),
    getPaymentInfo: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown>

  const mockWeight: TWeight = {
    refTime: 111n,
    proofSize: 222n
  }

  const baseOptions: TTransactOptions<unknown> = {
    call: '0xdeadbeef',
    originKind: 'SovereignAccount'
  }

  beforeEach(() => {
    vi.spyOn(mockApi, 'clone').mockReturnValue(mockApi)
    vi.spyOn(mockApi, 'txFromHex').mockResolvedValue('tx')
    vi.spyOn(mockApi, 'getPaymentInfo').mockResolvedValue({ weight: mockWeight, partialFee: 0n })
    vi.clearAllMocks()
  })

  it('uses provided maxWeight without estimating', async () => {
    const cloneSpy = vi.spyOn(mockApi, 'clone')
    const paymentInfoSpy = vi.spyOn(mockApi, 'getPaymentInfo')

    const result = await createTransactInstructions(
      mockApi,
      { ...baseOptions, maxWeight: mockWeight },
      Version.V4,
      'Polkadot',
      'address'
    )

    const instr = result[0]

    if (!instr.Transact) {
      throw new Error('Expected Transact instruction')
    }

    expect(instr.Transact.require_weight_at_most).toEqual({
      ref_time: 111n,
      proof_size: 222n
    })

    expect(cloneSpy).not.toHaveBeenCalled()
    expect(paymentInfoSpy).not.toHaveBeenCalled()
  })

  it('estimates weight via paymentInfo for versions below V5', async () => {
    const cloneSpy = vi.spyOn(mockApi, 'clone')
    const initSpy = vi.spyOn(mockApi, 'init')
    const txFromHexSpy = vi.spyOn(mockApi, 'txFromHex')
    const paymentInfoSpy = vi.spyOn(mockApi, 'getPaymentInfo')

    const result = await createTransactInstructions(
      mockApi,
      baseOptions,
      Version.V4,
      'Polkadot',
      'address'
    )

    const instr = result[0]

    if (!instr.Transact) {
      throw new Error('Expected Transact instruction')
    }

    expect(instr.Transact.require_weight_at_most).toEqual({
      ref_time: 111n,
      proof_size: 222n
    })

    expect(cloneSpy).toHaveBeenCalled()
    expect(initSpy).toHaveBeenCalledWith('Polkadot')
    expect(txFromHexSpy).toHaveBeenCalledWith('0xdeadbeef')
    expect(paymentInfoSpy).toHaveBeenCalledWith('tx', 'address')
  })

  it('does not estimate weight for V5 and above', async () => {
    const cloneSpy = vi.spyOn(mockApi, 'clone')

    const result = await createTransactInstructions(
      mockApi,
      baseOptions,
      Version.V5,
      'Polkadot',
      'address'
    )

    const instr = result[0]

    if (!instr.Transact) {
      throw new Error('Expected Transact instruction')
    }

    expect(instr.Transact.fallback_max_weight).toBeUndefined()
    expect(cloneSpy).not.toHaveBeenCalled()
  })

  it('uses fallback_max_weight key for V5+', async () => {
    const result = await createTransactInstructions(
      mockApi,
      { ...baseOptions, maxWeight: mockWeight },
      Version.V5,
      'Polkadot',
      'address'
    )

    expect(result[0].Transact).toMatchObject({
      fallback_max_weight: {
        ref_time: 111n,
        proof_size: 222n
      }
    })
  })
})
