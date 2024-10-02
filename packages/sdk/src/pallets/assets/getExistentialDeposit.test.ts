import { describe, it, expect, vi } from 'vitest'
import {
  getExistentialDeposit,
  getMinNativeTransferableAmount,
  getMaxNativeTransferableAmount
} from './getExistentialDeposit'
import * as edsMapJson from '../../maps/existential-deposits.json'
import { getBalanceNative } from './balance/getBalanceNative'
import { TNodeDotKsmWithRelayChains } from '../../types'

vi.mock('./balance/getBalanceNative', () => ({
  getBalanceNative: vi.fn()
}))

describe('Existential Deposit and Transferable Amounts', () => {
  const mockPalletsMap = edsMapJson as { [key: string]: string }
  const mockNode: TNodeDotKsmWithRelayChains = 'Polkadot'
  const mockAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'

  it('should return the correct existential deposit', () => {
    const ed = getExistentialDeposit(mockNode)
    expect(ed).toBe(BigInt(mockPalletsMap[mockNode]))
  })

  it('should return the correct minimum native transferable amount', () => {
    const ed = getExistentialDeposit(mockNode)
    const expectedMinTransferableAmount = ed + ed / BigInt(10)
    const result = getMinNativeTransferableAmount(mockNode)

    expect(result).toBe(expectedMinTransferableAmount)
  })

  it('should return the correct maximum native transferable amount', async () => {
    const mockBalance = BigInt(1000000000000)
    vi.mocked(getBalanceNative).mockResolvedValue(mockBalance)

    const ed = getExistentialDeposit(mockNode)
    const expectedMaxTransferableAmount = mockBalance - ed - ed / BigInt(10)

    const result = await getMaxNativeTransferableAmount(mockAddress, mockNode)

    expect(result).toBe(
      expectedMaxTransferableAmount > BigInt(0) ? expectedMaxTransferableAmount : BigInt(0)
    )
  })

  it('should return 0 for maximum native transferable amount if balance is too low', async () => {
    const mockBalance = BigInt(5000)
    vi.mocked(getBalanceNative).mockResolvedValue(mockBalance)

    const result = await getMaxNativeTransferableAmount(mockAddress, mockNode)

    expect(result).toBe(BigInt(0))
  })
})
