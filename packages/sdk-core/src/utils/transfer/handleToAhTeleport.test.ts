import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InvalidParameterError } from '../../errors'
import { dryRunInternal, getXcmFeeInternal } from '../../transfer'
import type { TDryRunResult, TGetXcmFeeResult, TPolkadotXCMTransferOptions } from '../../types'
import { padFeeBy } from '../fees/padFee'
import { createExecuteExchangeXcm } from './execute'
import { handleToAhTeleport } from './handleToAhTeleport'

vi.mock('../../transfer')
vi.mock('./execute')
vi.mock('../fees/padFee')

vi.mock('../../transfer/fees/padFee', () => ({
  padFeeBy: vi.fn((fee: bigint, percent: number) => fee + (fee * BigInt(percent)) / 100n)
}))

describe('handleToAhTeleport', () => {
  const mockInput = {
    api: {},
    destination: 'Astar',
    address: '5FakeAddress',
    senderAddress: 'FakeSender',
    assetInfo: { symbol: 'DOT', amount: 1000n },
    currency: { symbol: 'DOT' }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  const mockOrigin = 'Acala'

  const defaultTx = { method: 'transfer' }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns defaultTx if dry run is successful', async () => {
    vi.mocked(dryRunInternal).mockResolvedValue({ destination: { success: true } } as TDryRunResult)

    const result = await handleToAhTeleport(mockOrigin, mockInput, defaultTx)

    expect(result).toBe(defaultTx)
    expect(dryRunInternal).toHaveBeenCalled()
    expect(getXcmFeeInternal).not.toHaveBeenCalled()
  })

  it('returns executeTx if dry run fails', async () => {
    const dummyTx = { method: 'dummy' }
    const finalTx = { method: 'execute' }

    vi.mocked(dryRunInternal).mockResolvedValue({
      destination: { success: false }
    } as TDryRunResult)
    vi.mocked(createExecuteExchangeXcm).mockReturnValueOnce(dummyTx).mockReturnValueOnce(finalTx)
    vi.mocked(getXcmFeeInternal).mockResolvedValue({
      origin: { fee: 100n, weight: {} },
      destination: { feeType: 'paymentInfo', fee: 50n }
    } as TGetXcmFeeResult)

    const result = await handleToAhTeleport(mockOrigin, mockInput, defaultTx)

    expect(result).toBe(finalTx)
    expect(createExecuteExchangeXcm).toHaveBeenCalledTimes(2)
    expect(getXcmFeeInternal).toHaveBeenCalled()
  })

  it('throws error if destination is a location', async () => {
    const input = {
      ...mockInput,
      destination: { parents: 1, interior: 'Here' }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    await expect(() => handleToAhTeleport(mockOrigin, input, defaultTx)).rejects.toThrow(
      InvalidParameterError
    )
  })

  it('throws error if address is a location', async () => {
    const input = {
      ...mockInput,
      address: { parents: 1, interior: 'Here' }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    await expect(() => handleToAhTeleport(mockOrigin, input, defaultTx)).rejects.toThrow(
      InvalidParameterError
    )
  })

  it('pads fees by 20% when creating execute tx', async () => {
    const dummyTx = { method: 'dummy' }
    const finalTx = { method: 'execute' }

    vi.mocked(dryRunInternal).mockResolvedValue({
      destination: { success: false }
    } as TDryRunResult)
    vi.mocked(createExecuteExchangeXcm).mockReturnValueOnce(dummyTx).mockReturnValueOnce(finalTx)
    vi.mocked(getXcmFeeInternal).mockResolvedValue({
      origin: { fee: 200n, weight: {} },
      destination: { feeType: 'dryRun', fee: 100n }
    } as TGetXcmFeeResult)

    const result = await handleToAhTeleport(mockOrigin, mockInput, defaultTx)

    expect(result).toBe(finalTx)
    expect(padFeeBy).toHaveBeenCalledWith(200n, 20)
    expect(padFeeBy).toHaveBeenCalledWith(100n, 20)
  })
})
