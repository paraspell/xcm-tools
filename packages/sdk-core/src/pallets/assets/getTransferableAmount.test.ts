import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getMaxNativeTransferableAmount,
  getMaxForeignTransferableAmount,
  getTransferableAmount
} from './getTransferableAmount'
import { getBalanceNativeInternal } from './balance/getBalanceNative'
import { getBalanceForeignInternal } from './balance/getBalanceForeign'
import { getExistentialDeposit } from './assets'
import { getAssetBySymbolOrId } from './getAssetBySymbolOrId'
import { InvalidCurrencyError } from '../../errors'
import { isForeignAsset } from '../../utils'
import type { TNodeDotKsmWithRelayChains } from '../../types'
import type { IPolkadotApi } from '../../api/IPolkadotApi'

vi.mock('./balance/getBalanceNative', () => ({
  getBalanceNativeInternal: vi.fn()
}))

vi.mock('./balance/getBalanceForeign', () => ({
  getBalanceForeignInternal: vi.fn()
}))

vi.mock('./getAssetBySymbolOrId', () => ({
  getAssetBySymbolOrId: vi.fn()
}))

vi.mock('./assets', () => ({
  getExistentialDeposit: vi.fn(),
  isNodeEvm: vi.fn()
}))

vi.mock('../../utils', async () => {
  const actual = await vi.importActual<typeof import('../../utils')>('../../utils')
  return {
    ...actual,
    isForeignAsset: vi.fn(),
    validateAddress: vi.fn()
  }
})

describe('Transferable Amounts', () => {
  const apiMock = {
    disconnect: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown>
  const mockNode: TNodeDotKsmWithRelayChains = 'Acala'
  const mockAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getMaxNativeTransferableAmount', () => {
    it('should return the correct maximum native transferable amount', async () => {
      const mockBalance = 1000000000000n
      vi.mocked(getBalanceNativeInternal).mockResolvedValue(mockBalance)
      vi.mocked(getExistentialDeposit).mockReturnValue('1000000000')

      const ed = BigInt(getExistentialDeposit(mockNode) ?? '0')
      const expectedMaxTransferableAmount = mockBalance - ed

      const result = await getMaxNativeTransferableAmount({
        api: apiMock,
        address: mockAddress,
        node: mockNode
      })

      expect(result).toBe(expectedMaxTransferableAmount > 0n ? expectedMaxTransferableAmount : 0n)
    })

    it('should return 0 if native balance is too low', async () => {
      const mockBalance = 5000n
      vi.mocked(getBalanceNativeInternal).mockResolvedValue(mockBalance)
      vi.mocked(getExistentialDeposit).mockReturnValue('1000000000')

      const result = await getMaxNativeTransferableAmount({
        api: apiMock,
        address: mockAddress,
        node: mockNode
      })

      expect(result).toBe(0n)
    })

    it('should throw an error if existential deposit cannot be obtained', async () => {
      vi.mocked(getExistentialDeposit).mockReturnValue(null)

      await expect(
        getMaxNativeTransferableAmount({
          api: apiMock,
          address: mockAddress,
          node: mockNode
        })
      ).rejects.toThrowError(`Cannot get existential deposit for node ${mockNode}`)
    })
  })

  describe('getMaxForeignTransferableAmount', () => {
    const mockCurrency = { symbol: 'UNQ' }
    const mockAsset = {
      symbol: 'UNQ',
      assetId: '1',
      existentialDeposit: '1000000000' // 1,000,000,000 as string
    }

    it('should return the correct max foreign transferable amount', async () => {
      const mockBalance = 2000000000000n
      const edBN = BigInt(mockAsset.existentialDeposit)
      vi.mocked(getAssetBySymbolOrId).mockReturnValue(mockAsset)
      vi.mocked(getBalanceForeignInternal).mockResolvedValue(mockBalance)
      vi.mocked(isForeignAsset).mockReturnValue(true)

      const result = await getMaxForeignTransferableAmount({
        api: apiMock,
        address: mockAddress,
        node: mockNode,
        currency: mockCurrency
      })

      const expected = mockBalance - edBN
      expect(result).toBe(expected > 0n ? expected : 0n)
    })

    it('should return 0 if foreign balance is too low', async () => {
      const mockBalance = 500000000n // less than the ED
      vi.mocked(getAssetBySymbolOrId).mockReturnValue(mockAsset)
      vi.mocked(getBalanceForeignInternal).mockResolvedValue(mockBalance)

      const result = await getMaxForeignTransferableAmount({
        api: apiMock,
        address: mockAddress,
        node: mockNode,
        currency: mockCurrency
      })

      expect(result).toBe(0n)
    })

    it('should throw InvalidCurrencyError if asset not found', async () => {
      vi.mocked(getAssetBySymbolOrId).mockReturnValue(null)

      await expect(
        getMaxForeignTransferableAmount({
          api: apiMock,
          address: mockAddress,
          node: mockNode,
          currency: mockCurrency
        })
      ).rejects.toThrowError(InvalidCurrencyError)
    })

    it('should throw an error if existential deposit cannot be obtained for the asset', async () => {
      const noEDAsset = { symbol: 'UNQ' } // no existentialDeposit field
      vi.mocked(getAssetBySymbolOrId).mockReturnValue(noEDAsset)

      await expect(
        getMaxForeignTransferableAmount({
          api: apiMock,
          address: mockAddress,
          node: mockNode,
          currency: mockCurrency
        })
      ).rejects.toThrowError(
        `Cannot get existential deposit for asset ${JSON.stringify(noEDAsset)}`
      )
    })
  })

  describe('getTransferableAmount', () => {
    const mockCurrency = { symbol: 'UNQ' }
    const nativeAsset = {
      symbol: 'DOT'
      // Suppose native asset's ED is directly from getExistentialDeposit
    }
    const foreignAsset = {
      symbol: 'UNQ',
      existentialDeposit: '1000000000'
    }

    it('should call getMaxNativeTransferableAmount if asset is native', async () => {
      vi.mocked(getAssetBySymbolOrId).mockReturnValue(nativeAsset)
      vi.mocked(isForeignAsset).mockReturnValue(false)
      vi.mocked(getBalanceNativeInternal).mockResolvedValue(1000000000000n)
      vi.mocked(getExistentialDeposit).mockReturnValue('1000000000')

      const result = await getTransferableAmount({
        api: apiMock,
        address: mockAddress,
        node: mockNode,
        currency: { symbol: 'DOT' } // native
      })

      // Check that it didn't call foreign functions
      expect(getBalanceForeignInternal).not.toHaveBeenCalled()
      expect(getBalanceNativeInternal).toHaveBeenCalled()
      expect(result).toBeGreaterThan(0n)
    })

    it('should call getMaxForeignTransferableAmount if asset is foreign', async () => {
      vi.mocked(getAssetBySymbolOrId).mockReturnValue(foreignAsset)
      vi.mocked(isForeignAsset).mockReturnValue(true)
      vi.mocked(getBalanceForeignInternal).mockResolvedValue(2000000000000n)

      const result = await getTransferableAmount({
        api: apiMock,
        address: mockAddress,
        node: mockNode,
        currency: mockCurrency
      })

      // Check that it didn't call native function
      expect(getBalanceNativeInternal).not.toHaveBeenCalled()
      expect(getBalanceForeignInternal).toHaveBeenCalled()
      expect(result).toBeGreaterThan(0n)
    })

    it('should throw InvalidCurrencyError if asset is not found', async () => {
      vi.mocked(getAssetBySymbolOrId).mockReturnValue(null)
      vi.mocked(isForeignAsset).mockReturnValue(false)

      await expect(
        getTransferableAmount({
          api: apiMock,
          address: mockAddress,
          node: mockNode,
          currency: mockCurrency
        })
      ).rejects.toThrowError(InvalidCurrencyError)
    })

    it('should return 0 if native balance is lower than ED when calling getTransferableAmount', async () => {
      vi.mocked(getAssetBySymbolOrId).mockReturnValue(nativeAsset)
      vi.mocked(isForeignAsset).mockReturnValue(false)
      vi.mocked(getBalanceNativeInternal).mockResolvedValue(BigInt(5000))
      vi.mocked(getExistentialDeposit).mockReturnValue('1000000000')

      const result = await getTransferableAmount({
        api: apiMock,
        address: mockAddress,
        node: mockNode,
        currency: { symbol: 'DOT' }
      })

      expect(result).toBe(0n)
    })

    it('should return 0 if foreign balance is lower than ED when calling getTransferableAmount', async () => {
      vi.mocked(getAssetBySymbolOrId).mockReturnValue(foreignAsset)
      vi.mocked(isForeignAsset).mockReturnValue(true)
      vi.mocked(getBalanceForeignInternal).mockResolvedValue(BigInt('500000000')) // less than ED

      const result = await getTransferableAmount({
        api: apiMock,
        address: mockAddress,
        node: mockNode,
        currency: mockCurrency
      })

      expect(result).toBe(0n)
    })
  })
})
