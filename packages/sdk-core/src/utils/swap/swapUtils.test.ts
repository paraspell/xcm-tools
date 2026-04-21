import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { ExtensionNotInstalledError, UnsupportedOperationError } from '../../errors'
import type {
  TApiOrUrl,
  TBuilderOptions,
  TSwapOptions,
  TTransferOptionsWithSwap
} from '../../types'
import * as assertions from '../assertions'
import * as guards from '../guards'
import type { TSwapExtension } from './swapRegistry'
import { registerSwapExtension } from './swapRegistry'
import {
  convertBuilderConfig,
  createRouterBuilder,
  executeWithRouter,
  normalizeExchange
} from './swapUtils'

vi.mock('../assertions')
vi.mock('../guards')

const mockBuilderInstance = {
  from: vi.fn().mockReturnThis(),
  exchange: vi.fn().mockReturnThis(),
  to: vi.fn().mockReturnThis(),
  currencyFrom: vi.fn().mockReturnThis(),
  currencyTo: vi.fn().mockReturnThis(),
  amount: vi.fn().mockReturnThis(),
  sender: vi.fn().mockReturnThis(),
  evmSenderAddress: vi.fn().mockReturnThis(),
  recipient: vi.fn().mockReturnThis(),
  slippagePct: vi.fn().mockReturnThis(),
  onStatusChange: vi.fn().mockReturnThis()
}

const MockRouterBuilder = vi.fn(
  () => mockBuilderInstance
) as unknown as TSwapExtension['RouterBuilder']

type Api = unknown
type Res = unknown
type Signer = unknown

const createMockApi = (
  type: 'PAPI' | 'PJS' = 'PAPI',
  config?: TBuilderOptions<TApiOrUrl<Api>>
): PolkadotApi<Api, Res, Signer> =>
  ({
    getType: vi.fn(() => type),
    getConfig: vi.fn(() => config)
  }) as unknown as PolkadotApi<Api, Res, Signer>

const createBaseOptions = (
  overrides: Partial<TTransferOptionsWithSwap<Api, Res, Signer>> = {}
): TTransferOptionsWithSwap<Api, Res, Signer> => ({
  api: createMockApi(),
  from: 'Acala',
  to: 'Astar',
  recipient: '5F3sa2TJbN...',
  sender: '5G7abc...',
  currency: { symbol: 'DOT', amount: '1000000000' },
  swapOptions: {
    currencyTo: { symbol: 'GLMR' },
    exchange: undefined,
    slippage: 1,
    evmSenderAddress: undefined,
    onStatusChange: undefined
  },
  ...overrides
})

describe('swapUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    registerSwapExtension({ RouterBuilder: MockRouterBuilder })
  })

  describe('createRouterBuilder', () => {
    it('should throw UnsupportedOperationError when transactOptions.call is set', () => {
      const options = createBaseOptions({
        transactOptions: { call: '0x1234' }
      } as Partial<TTransferOptionsWithSwap<Api, Res, Signer>>)

      expect(() => createRouterBuilder(options)).toThrow(UnsupportedOperationError)
      expect(() => createRouterBuilder(options)).toThrow(
        'Cannot use transact options together with swap options.'
      )
    })

    it('should call assertion functions with correct arguments', () => {
      const options = createBaseOptions()

      createRouterBuilder(options)

      expect(assertions.assertToIsString).toHaveBeenCalledWith(options.to)
      expect(assertions.assertAddressIsString).toHaveBeenCalledWith(options.recipient)
      expect(assertions.assertSender).toHaveBeenCalledWith(options.sender)
    })

    it('should throw UnsupportedOperationError when currency is an array', () => {
      const options = createBaseOptions({
        currency: [
          { symbol: 'DOT', amount: '1000' },
          { symbol: 'GLMR', amount: '2000' }
        ] as TTransferOptionsWithSwap<Api, Res, Signer>['currency']
      })

      expect(() => createRouterBuilder(options)).toThrow(UnsupportedOperationError)
      expect(() => createRouterBuilder(options)).toThrow(
        'Swaps with multiple currencies are not supported.'
      )
    })

    it('should build router with correct chain methods when config is undefined', () => {
      const options = createBaseOptions()

      const result = createRouterBuilder(options)

      expect(mockBuilderInstance.from).toHaveBeenCalledWith('Acala')
      expect(mockBuilderInstance.exchange).toHaveBeenCalledWith(undefined)
      expect(mockBuilderInstance.to).toHaveBeenCalledWith('Astar')
      expect(mockBuilderInstance.currencyFrom).toHaveBeenCalledWith({
        symbol: 'DOT',
        amount: '1000000000'
      })
      expect(mockBuilderInstance.currencyTo).toHaveBeenCalledWith({ symbol: 'GLMR' })
      expect(mockBuilderInstance.amount).toHaveBeenCalledWith('1000000000')
      expect(mockBuilderInstance.sender).toHaveBeenCalledWith('5G7abc...')
      expect(mockBuilderInstance.evmSenderAddress).toHaveBeenCalledWith(undefined)
      expect(mockBuilderInstance.recipient).toHaveBeenCalledWith('5F3sa2TJbN...')
      expect(mockBuilderInstance.slippagePct).toHaveBeenCalledWith('1')
      expect(mockBuilderInstance.onStatusChange).not.toHaveBeenCalled()
      expect(result).toBe(mockBuilderInstance)
    })

    it('should call onStatusChange when provided', () => {
      const onStatusChange = vi.fn()
      const options = createBaseOptions({
        swapOptions: {
          currencyTo: { symbol: 'GLMR' },
          exchange: undefined,
          slippage: 1,
          onStatusChange
        } as TSwapOptions<Api, Res, Signer>
      })

      createRouterBuilder(options)

      expect(mockBuilderInstance.onStatusChange).toHaveBeenCalledWith(onStatusChange)
    })

    it('should pass evmSenderAddress when provided', () => {
      const options = createBaseOptions({
        swapOptions: {
          currencyTo: { symbol: 'GLMR' },
          exchange: undefined,
          slippage: 2,
          evmSenderAddress: '0xabc123'
        }
      })

      createRouterBuilder(options)

      expect(mockBuilderInstance.evmSenderAddress).toHaveBeenCalledWith('0xabc123')
      expect(mockBuilderInstance.slippagePct).toHaveBeenCalledWith('2')
    })

    it('should pass api to RouterBuilder', () => {
      const api = createMockApi('PAPI')
      const options = createBaseOptions({ api })

      createRouterBuilder(options)

      expect(MockRouterBuilder).toHaveBeenCalledWith(api)
    })
  })

  describe('convertBuilderConfig', () => {
    it('should return undefined when config is undefined', () => {
      expect(convertBuilderConfig(undefined)).toBeUndefined()
    })

    it('should strip xcmFormatCheck and pass rest when config is a plain config object', () => {
      vi.mocked(guards.isConfig).mockReturnValue(true)

      const config = { development: true, xcmFormatCheck: true }
      const result = convertBuilderConfig(config)

      expect(result).toEqual(expect.objectContaining({ development: true }))
    })

    it('should pass config with filtered string apiOverrides', () => {
      vi.mocked(guards.isConfig).mockReturnValue(true)

      const config = {
        development: false,
        apiOverrides: { Acala: 'wss://acala.example.com' }
      }
      const result = convertBuilderConfig(config)

      expect(result).toEqual(
        expect.objectContaining({
          apiOverrides: { Acala: 'wss://acala.example.com' }
        })
      )
    })

    it('should throw when apiOverrides contain non-string object values', () => {
      vi.mocked(guards.isConfig).mockReturnValue(true)

      const config = {
        apiOverrides: { Acala: { someClient: true } }
      }

      expect(() => convertBuilderConfig(config)).toThrow(UnsupportedOperationError)
      expect(() => convertBuilderConfig(config)).toThrow(
        'Swap module does not support API client override with non-string values'
      )
    })

    it('should throw when config is not a config object and not a WS URL', () => {
      vi.mocked(guards.isConfig).mockReturnValue(false)

      const config = 42

      expect(() => convertBuilderConfig(config)).toThrow(UnsupportedOperationError)
      expect(() => convertBuilderConfig(config)).toThrow(
        'Swap module does not support API client override'
      )
    })

    it('should return rest without apiOverrides when apiOverrides is undefined in config', () => {
      vi.mocked(guards.isConfig).mockReturnValue(true)

      const config = { development: true }
      const result = convertBuilderConfig(config)

      expect(result).toEqual(expect.objectContaining({ development: true }))
    })

    it('should throw ExtensionNotInstalledError when swap extension is not registered', async () => {
      // Reset the registry by importing a fresh module
      const { registerSwapExtension: freshRegister } = await import('./swapRegistry')
      // Register with undefined to clear
      freshRegister(undefined as never)

      const options = createBaseOptions()

      expect(() => createRouterBuilder(options)).toThrow(ExtensionNotInstalledError)
      expect(() => createRouterBuilder(options)).toThrow(
        'The swap extension is not registered. Please install @paraspell/swap and import it before using swap features.'
      )

      // Restore
      freshRegister({ RouterBuilder: MockRouterBuilder })
    })
  })

  describe('executeWithRouter', () => {
    it('should call executor with the created router builder', async () => {
      const options = createBaseOptions()
      const expectedResult = 'execution-result'
      const executor = vi.fn().mockResolvedValue(expectedResult)

      const result = await executeWithRouter(options, executor)

      expect(executor).toHaveBeenCalledWith(mockBuilderInstance)
      expect(result).toBe(expectedResult)
    })
  })

  describe('normalizeExchange', () => {
    it('should return undefined when exchange is an empty array', () => {
      expect(normalizeExchange([])).toBeUndefined()
    })

    it('should return the same exchange in an array when exchange is a multi-element array', () => {
      expect(normalizeExchange(['Acala', 'AssetHubPolkadot'])).toEqual([
        'Acala',
        'AssetHubPolkadot'
      ])
    })

    it('should return extracted value from array when exchange is a single-element array', () => {
      expect(normalizeExchange(['Acala'])).toEqual('Acala')
    })

    it('should return the exchange as-is when it is not an array', () => {
      expect(normalizeExchange('Acala')).toEqual('Acala')
    })
  })
})
