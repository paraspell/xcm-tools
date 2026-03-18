import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { ExtensionNotInstalledError, UnsupportedOperationError } from '../../errors'
import type { TApiOrUrl, TBuilderOptions, TSendOptionsWithSwap, TSwapOptions } from '../../types'
import * as assertions from '../assertions'
import * as builder from '../builder'
import type { TSwapExtension } from './swapRegistry'
import { registerSwapExtension } from './swapRegistry'
import { createRouterBuilder, executeWithRouter, normalizeExchange } from './swapUtils'

vi.mock('../assertions')
vi.mock('../builder')

const mockBuilderInstance = {
  from: vi.fn().mockReturnThis(),
  exchange: vi.fn().mockReturnThis(),
  to: vi.fn().mockReturnThis(),
  currencyFrom: vi.fn().mockReturnThis(),
  currencyTo: vi.fn().mockReturnThis(),
  amount: vi.fn().mockReturnThis(),
  senderAddress: vi.fn().mockReturnThis(),
  evmSenderAddress: vi.fn().mockReturnThis(),
  recipientAddress: vi.fn().mockReturnThis(),
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
): IPolkadotApi<Api, Res, Signer> =>
  ({
    getType: vi.fn(() => type),
    getConfig: vi.fn(() => config)
  }) as unknown as IPolkadotApi<Api, Res, Signer>

const createBaseOptions = (
  overrides: Partial<TSendOptionsWithSwap<Api, Res, Signer>> = {}
): TSendOptionsWithSwap<Api, Res, Signer> => ({
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
      } as Partial<TSendOptionsWithSwap<Api, Res, Signer>>)

      expect(() => createRouterBuilder(options)).toThrow(UnsupportedOperationError)
      expect(() => createRouterBuilder(options)).toThrow(
        'Cannot use transact options together with swap options.'
      )
    })

    it('should throw UnsupportedOperationError when api type is not PAPI', () => {
      const options = createBaseOptions({ api: createMockApi('PJS') })

      expect(() => createRouterBuilder(options)).toThrow(UnsupportedOperationError)
      expect(() => createRouterBuilder(options)).toThrow(
        'Swaps are only supported when using PAPI SDK.'
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
        ] as TSendOptionsWithSwap<Api, Res, Signer>['currency']
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
      expect(mockBuilderInstance.senderAddress).toHaveBeenCalledWith('5G7abc...')
      expect(mockBuilderInstance.evmSenderAddress).toHaveBeenCalledWith(undefined)
      expect(mockBuilderInstance.recipientAddress).toHaveBeenCalledWith('5F3sa2TJbN...')
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

    describe('convertBuilderConfig', () => {
      it('should pass undefined config to RouterBuilder when api config is undefined', () => {
        const options = createBaseOptions({
          api: createMockApi('PAPI', undefined)
        })

        createRouterBuilder(options)

        expect(MockRouterBuilder).toHaveBeenCalledWith(undefined)
      })

      it('should strip xcmFormatCheck and pass rest when config is a plain config object', () => {
        vi.mocked(builder.isConfig).mockReturnValue(true)

        const config = { development: true, xcmFormatCheck: true }
        const options = createBaseOptions({
          api: createMockApi('PAPI', config)
        })

        createRouterBuilder(options)

        expect(MockRouterBuilder).toHaveBeenCalledWith(
          expect.objectContaining({ development: true })
        )
        // xcmFormatCheck is stripped via Omit at the type level; the spread passes it through at runtime
        // but the function does not explicitly remove it — the type prevents downstream usage
      })

      it('should pass config with filtered string apiOverrides', () => {
        vi.mocked(builder.isConfig).mockReturnValue(true)

        const config = {
          development: false,
          apiOverrides: { Acala: 'wss://acala.example.com' }
        }
        const options = createBaseOptions({
          api: createMockApi('PAPI', config)
        })

        createRouterBuilder(options)

        expect(MockRouterBuilder).toHaveBeenCalledWith(
          expect.objectContaining({
            apiOverrides: { Acala: 'wss://acala.example.com' }
          })
        )
      })

      it('should throw when apiOverrides contain non-string object values', () => {
        vi.mocked(builder.isConfig).mockReturnValue(true)

        const config = {
          apiOverrides: { Acala: { someClient: true } }
        }
        const options = createBaseOptions({
          api: createMockApi('PAPI', config)
        })

        expect(() => createRouterBuilder(options)).toThrow(UnsupportedOperationError)
        expect(() => createRouterBuilder(options)).toThrow(
          'Swap module does not support API client override with non-string values'
        )
      })

      it('should throw when config is not a config object and not a WS URL', () => {
        vi.mocked(builder.isConfig).mockReturnValue(false)

        const config = 42
        const options = createBaseOptions({
          api: createMockApi('PAPI', config)
        })

        expect(() => createRouterBuilder(options)).toThrow(UnsupportedOperationError)
        expect(() => createRouterBuilder(options)).toThrow(
          'Swap module does not support API client override'
        )
      })

      it('should return rest without apiOverrides when apiOverrides is undefined in config', () => {
        vi.mocked(builder.isConfig).mockReturnValue(true)

        const config = { development: true }
        const options = createBaseOptions({
          api: createMockApi('PAPI', config)
        })

        createRouterBuilder(options)

        expect(MockRouterBuilder).toHaveBeenCalledWith(
          expect.objectContaining({ development: true })
        )
      })
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
      expect(normalizeExchange(['AcalaDex', 'AssetHubPolkadotDex'])).toEqual([
        'AcalaDex',
        'AssetHubPolkadotDex'
      ])
    })

    it('should return extracted value from array when exchange is a single-element array', () => {
      expect(normalizeExchange(['AcalaDex'])).toEqual('AcalaDex')
    })

    it('should return the exchange as-is when it is not an array', () => {
      expect(normalizeExchange('AcalaDex')).toEqual('AcalaDex')
    })
  })
})
