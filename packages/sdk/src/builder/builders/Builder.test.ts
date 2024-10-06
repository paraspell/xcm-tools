// Contains builder pattern tests for different Builder pattern functionalities

import { type ApiPromise } from '@polkadot/api'
import { vi, describe, expect, it } from 'vitest'
import type { Extrinsic } from '../../types'
import { Version, type TNode } from '../../types'
import * as xcmPallet from '../../pallets/xcmPallet'
import { getRelayChainSymbol } from '../../pallets/assets'
import { Builder } from './Builder'
import { type TMultiAsset } from '../../types/TMultiAsset'

const NODE: TNode = 'Acala'
const NODE_2: TNode = 'Acala'
const AMOUNT = 1000
const CURRENCY = { symbol: 'ACA' }
const CURRENCY_ID = BigInt(-1)
const ADDRESS = '23sxrMSmaUMqe2ufSJg8U3Y8kxHfKT67YbubwXWFazpYi7w6'
const PARA_ID_TO = 1999

describe('Builder', () => {
  const api = {} as ApiPromise
  const destApi = {} as ApiPromise

  it('should initiatie a para to para transfer with currency symbol', async () => {
    const spy = vi.spyOn(xcmPallet, 'send').mockResolvedValue({} as Extrinsic)

    await Builder(api)
      .from(NODE)
      .to(NODE_2)
      .currency(CURRENCY)
      .amount(AMOUNT)
      .address(ADDRESS)
      .build()

    expect(spy).toHaveBeenCalledWith({
      api,
      origin: NODE,
      currency: CURRENCY,
      amount: AMOUNT,
      address: ADDRESS,
      destination: NODE_2
    })
  })

  it('should initiatie a para to para transfer with custom paraId', async () => {
    const spy = vi.spyOn(xcmPallet, 'send').mockResolvedValue({} as Extrinsic)

    await Builder(api)
      .from(NODE)
      .to(NODE_2, PARA_ID_TO)
      .currency(CURRENCY)
      .amount(AMOUNT)
      .address(ADDRESS)
      .build()

    expect(spy).toHaveBeenCalledWith({
      api,
      origin: NODE,
      currency: CURRENCY,
      amount: AMOUNT,
      address: ADDRESS,
      destination: NODE_2,
      paraIdTo: PARA_ID_TO
    })
  })

  it('should initiatie a para to para transfer with specified asset ID', async () => {
    const spy = vi.spyOn(xcmPallet, 'send').mockResolvedValue({} as Extrinsic)
    const ASSET_ID = 1
    await Builder(api)
      .from(NODE)
      .to(NODE_2, PARA_ID_TO)
      .currency({
        id: ASSET_ID
      })
      .amount(AMOUNT)
      .address(ADDRESS)
      .build()

    expect(spy).toHaveBeenCalledWith({
      api,
      origin: NODE,
      currency: {
        id: ASSET_ID
      },
      amount: AMOUNT,
      address: ADDRESS,
      destination: NODE_2,
      paraIdTo: PARA_ID_TO
    })
  })

  it('should initiatie a para to para transfer with custom useKeepAlive', async () => {
    const spy = vi.spyOn(xcmPallet, 'send').mockResolvedValue({} as Extrinsic)

    await Builder(api)
      .from(NODE)
      .to(NODE_2, PARA_ID_TO)
      .currency(CURRENCY)
      .amount(AMOUNT)
      .address(ADDRESS)
      .useKeepAlive(destApi)
      .build()

    expect(spy).toHaveBeenCalledWith({
      api,
      origin: NODE,
      currency: CURRENCY,
      amount: AMOUNT,
      address: ADDRESS,
      destination: NODE_2,
      paraIdTo: PARA_ID_TO,
      destApiForKeepAlive: destApi
    })
  })

  it('should initiatie a para to para transfer with overriden version', async () => {
    const spy = vi.spyOn(xcmPallet, 'send').mockResolvedValue({} as Extrinsic)

    const version = Version.V2

    await Builder(api)
      .from(NODE)
      .to(NODE_2, PARA_ID_TO)
      .currency(CURRENCY)
      .amount(AMOUNT)
      .address(ADDRESS)
      .xcmVersion(version)
      .build()

    expect(spy).toHaveBeenCalledWith({
      api,
      origin: NODE,
      currency: CURRENCY,
      amount: AMOUNT,
      address: ADDRESS,
      destination: NODE_2,
      paraIdTo: PARA_ID_TO,
      version
    })
  })

  it('should initiatie a para to para transfer with custom useKeepAlive and overriden version', async () => {
    const spy = vi.spyOn(xcmPallet, 'send').mockResolvedValue({} as Extrinsic)

    const version = Version.V2

    await Builder(api)
      .from(NODE)
      .to(NODE_2, PARA_ID_TO)
      .currency(CURRENCY)
      .amount(AMOUNT)
      .address(ADDRESS)
      .useKeepAlive(destApi)
      .xcmVersion(version)
      .build()

    expect(spy).toHaveBeenCalledWith({
      api,
      origin: NODE,
      currency: CURRENCY,
      amount: AMOUNT,
      address: ADDRESS,
      destination: NODE_2,
      paraIdTo: PARA_ID_TO,
      destApiForKeepAlive: destApi,
      version
    })
  })

  it('should initiatie a para to para transfer with currency id', async () => {
    const spy = vi.spyOn(xcmPallet, 'send').mockResolvedValue({} as Extrinsic)

    await Builder(api)
      .from(NODE)
      .to(NODE_2)
      .currency({ id: CURRENCY_ID })
      .amount(AMOUNT)
      .address(ADDRESS)
      .build()

    expect(spy).toHaveBeenCalledWith({
      api,
      origin: NODE,
      currency: { id: CURRENCY_ID },
      amount: AMOUNT,
      address: ADDRESS,
      destination: NODE_2
    })
  })

  it('should initiatie a para to para transfer with fee asset', async () => {
    const spy = vi.spyOn(xcmPallet, 'send').mockResolvedValue({} as Extrinsic)

    const feeAsset = 0

    await Builder(api)
      .from(NODE)
      .to(NODE_2)
      .currency({ id: CURRENCY_ID })
      .feeAsset(feeAsset)
      .amount(AMOUNT)
      .address(ADDRESS)
      .build()

    expect(spy).toHaveBeenCalledWith({
      api,
      origin: NODE,
      currency: { id: CURRENCY_ID },
      amount: AMOUNT,
      address: ADDRESS,
      feeAsset,
      destination: NODE_2
    })
  })

  it('should initiatie a para to para transfer with two overriden multi asset', async () => {
    const spy = vi.spyOn(xcmPallet, 'send').mockResolvedValue({} as Extrinsic)

    const feeAsset = 0

    const overridedCurrencyMultiLocation: TMultiAsset[] = [
      {
        id: {
          Concrete: {
            parents: 0,
            interior: {
              X2: [
                {
                  PalletInstance: '50'
                },
                {
                  Parachain: '30'
                }
              ]
            }
          }
        },

        fun: {
          Fungible: '102928'
        }
      },
      {
        id: {
          Concrete: {
            parents: 0,
            interior: {
              X2: [
                {
                  PalletInstance: '50'
                },
                {
                  Parachain: '1337'
                }
              ]
            }
          }
        },
        fun: {
          Fungible: '38482'
        }
      }
    ]

    await Builder(api)
      .from(NODE)
      .to(NODE_2)
      .currency({ multiasset: overridedCurrencyMultiLocation })
      .feeAsset(feeAsset)
      .amount(AMOUNT)
      .address(ADDRESS)
      .build()

    expect(spy).toHaveBeenCalledWith({
      api,
      origin: NODE,
      currency: { multiasset: overridedCurrencyMultiLocation },
      amount: AMOUNT,
      address: ADDRESS,
      feeAsset,
      destination: NODE_2
    })
  })

  it('should initiatie a para to para transfer with one overriden multi asset', async () => {
    const spy = vi.spyOn(xcmPallet, 'send').mockResolvedValue({} as Extrinsic)

    const overridedCurrencyMultiLocation: TMultiAsset[] = [
      {
        id: {
          Concrete: {
            parents: 0,
            interior: {
              X2: [
                {
                  PalletInstance: '50'
                },
                {
                  Parachain: '1337'
                }
              ]
            }
          }
        },
        fun: {
          Fungible: '38482'
        }
      }
    ]

    await Builder(api)
      .from(NODE)
      .to(NODE_2)
      .currency({ multiasset: overridedCurrencyMultiLocation })
      .amount(AMOUNT)
      .address(ADDRESS)
      .build()

    expect(spy).toHaveBeenCalledWith({
      api,
      origin: NODE,
      currency: { multiasset: overridedCurrencyMultiLocation },
      amount: AMOUNT,
      address: ADDRESS,
      destination: NODE_2
    })
  })

  it('should initiatie a relay to para transfer', async () => {
    const spy = vi.spyOn(xcmPallet, 'transferRelayToPara').mockResolvedValue({} as Extrinsic)

    await Builder(api).to(NODE).amount(AMOUNT).address(ADDRESS).build()

    expect(spy).toHaveBeenCalledWith({ api, destination: NODE, amount: AMOUNT, address: ADDRESS })
  })

  it('should initiatie a relay to para transfer with custom paraId', async () => {
    const spy = vi.spyOn(xcmPallet, 'transferRelayToPara').mockResolvedValue({} as Extrinsic)

    await Builder(api).to(NODE, PARA_ID_TO).amount(AMOUNT).address(ADDRESS).build()

    expect(spy).toHaveBeenCalledWith({
      api,
      destination: NODE,
      amount: AMOUNT,
      address: ADDRESS,
      paraIdTo: PARA_ID_TO
    })
  })

  it('should initiatie a relay to para transfer with useKeepAlive', async () => {
    const spy = vi.spyOn(xcmPallet, 'transferRelayToPara').mockResolvedValue({} as Extrinsic)

    await Builder(api)
      .to(NODE, PARA_ID_TO)
      .amount(AMOUNT)
      .address(ADDRESS)
      .useKeepAlive(destApi)
      .build()

    expect(spy).toHaveBeenCalledWith({
      api,
      destination: NODE,
      amount: AMOUNT,
      address: ADDRESS,
      paraIdTo: PARA_ID_TO,
      destApiForKeepAlive: destApi
    })
  })

  it('should initiatie a relay to para transfer with useKeepAlive and overriden version', async () => {
    const spy = vi.spyOn(xcmPallet, 'transferRelayToPara').mockResolvedValue({} as Extrinsic)

    const version = Version.V2

    await Builder(api)
      .to(NODE, PARA_ID_TO)
      .amount(AMOUNT)
      .address(ADDRESS)
      .useKeepAlive(destApi)
      .xcmVersion(version)
      .build()

    expect(spy).toHaveBeenCalledWith({
      api,
      destination: NODE,
      amount: AMOUNT,
      address: ADDRESS,
      paraIdTo: PARA_ID_TO,
      destApiForKeepAlive: destApi,
      version
    })
  })

  it('should initiatie a relay to para transfer with overriden version', async () => {
    const spy = vi.spyOn(xcmPallet, 'transferRelayToPara').mockResolvedValue({} as Extrinsic)

    const version = Version.V2

    await Builder(api)
      .to(NODE, PARA_ID_TO)
      .amount(AMOUNT)
      .address(ADDRESS)
      .xcmVersion(version)
      .build()

    expect(spy).toHaveBeenCalledWith({
      api,
      destination: NODE,
      amount: AMOUNT,
      address: ADDRESS,
      paraIdTo: PARA_ID_TO,
      version
    })
  })

  it('should initiatie a para to relay transfer with currency symbol', async () => {
    const spy = vi.spyOn(xcmPallet, 'send').mockResolvedValue({} as Extrinsic)

    const currency = getRelayChainSymbol(NODE)

    await Builder(api).from(NODE).amount(AMOUNT).address(ADDRESS).build()

    expect(spy).toHaveBeenCalledWith({
      api,
      origin: NODE,
      currency: {
        symbol: currency
      },
      amount: AMOUNT,
      address: ADDRESS
    })
  })

  it('should initiatie a para to relay transfer with currency symbol', async () => {
    const spy = vi.spyOn(xcmPallet, 'send').mockResolvedValue({} as Extrinsic)

    const currency = getRelayChainSymbol(NODE)

    await Builder(api).from(NODE).amount(AMOUNT).address(ADDRESS).useKeepAlive(destApi).build()

    expect(spy).toHaveBeenCalledWith({
      api,
      origin: NODE,
      currency: {
        symbol: currency
      },
      amount: AMOUNT,
      address: ADDRESS,
      destApiForKeepAlive: destApi
    })
  })

  it('should initiatie a para to relay transfer with fee asset', async () => {
    const spy = vi.spyOn(xcmPallet, 'send').mockResolvedValue({} as Extrinsic)

    const currency = getRelayChainSymbol(NODE)
    const feeAsset = 0

    await Builder(api)
      .from(NODE)
      .feeAsset(feeAsset)
      .amount(AMOUNT)
      .address(ADDRESS)
      .useKeepAlive(destApi)
      .build()

    expect(spy).toHaveBeenCalledWith({
      api,
      origin: NODE,
      currency: {
        symbol: currency
      },
      amount: AMOUNT,
      address: ADDRESS,
      feeAsset,
      destApiForKeepAlive: destApi
    })
  })

  it('should initiatie a para to relay transfer with overriden version', async () => {
    const spy = vi.spyOn(xcmPallet, 'send').mockResolvedValue({} as Extrinsic)

    const currency = getRelayChainSymbol(NODE)
    const version = Version.V2

    await Builder(api).from(NODE).amount(AMOUNT).address(ADDRESS).xcmVersion(version).build()

    expect(spy).toHaveBeenCalledWith({
      api,
      origin: NODE,
      currency: {
        symbol: currency
      },
      amount: AMOUNT,
      address: ADDRESS,
      version
    })
  })

  it('should initiatie a para to relay transfer with fee asset, keep alive and overriden version', async () => {
    const spy = vi.spyOn(xcmPallet, 'send').mockResolvedValue({} as Extrinsic)

    const currency = getRelayChainSymbol(NODE)
    const feeAsset = 0
    const version = Version.V2

    await Builder(api)
      .from(NODE)
      .feeAsset(feeAsset)
      .amount(AMOUNT)
      .address(ADDRESS)
      .useKeepAlive(destApi)
      .xcmVersion(version)
      .build()

    expect(spy).toHaveBeenCalledWith({
      api,
      origin: NODE,
      currency: {
        symbol: currency
      },
      amount: AMOUNT,
      address: ADDRESS,
      feeAsset,
      destApiForKeepAlive: destApi,
      version
    })
  })

  it('should request a para to para transfer serialized api call with currency id', async () => {
    const serializedApiCall = await Builder()
      .from(NODE)
      .to(NODE_2)
      .currency({ symbol: 'DOT' })
      .amount(AMOUNT)
      .address(ADDRESS)
      .buildSerializedApiCall()

    expect(serializedApiCall).toHaveProperty('module')
    expect(serializedApiCall).toHaveProperty('section')
    expect(serializedApiCall).toHaveProperty('parameters')
    expect(serializedApiCall.module).toBeTypeOf('string')
    expect(serializedApiCall.section).toBeTypeOf('string')
    expect(Array.isArray(serializedApiCall.parameters)).toBe(true)
  })

  it('should request a relay to para transfer serialized api call', async () => {
    const serializedApiCall = await Builder()
      .to(NODE_2)
      .amount(AMOUNT)
      .address(ADDRESS)
      .buildSerializedApiCall()

    expect(serializedApiCall).toHaveProperty('module')
    expect(serializedApiCall).toHaveProperty('section')
    expect(serializedApiCall).toHaveProperty('parameters')
    expect(serializedApiCall.module).toBeTypeOf('string')
    expect(serializedApiCall.section).toBeTypeOf('string')
    expect(Array.isArray(serializedApiCall.parameters)).toBe(true)
  })

  it('should call claim asset function with valid params', async () => {
    const serializedApiCall = await Builder()
      .claimFrom(NODE)
      .fungible([])
      .account(ADDRESS)
      .xcmVersion(Version.V3)
      .buildSerializedApiCall()

    expect(serializedApiCall).toHaveProperty('module')
    expect(serializedApiCall).toHaveProperty('section')
    expect(serializedApiCall).toHaveProperty('parameters')
    expect(serializedApiCall.module).toBeTypeOf('string')
    expect(serializedApiCall.section).toBeTypeOf('string')
    expect(Array.isArray(serializedApiCall.parameters)).toBe(true)
  })

  it('should initiatie a para to para transfer using batching', async () => {
    const spy = vi.spyOn(xcmPallet, 'send').mockResolvedValue({} as Extrinsic)

    const api = {
      tx: {
        utility: {
          batchAll: vi.fn(),
          batch: vi.fn()
        }
      }
    } as unknown as ApiPromise

    await Builder(api)
      .from(NODE)
      .to(NODE_2)
      .currency(CURRENCY)
      .amount(AMOUNT)
      .address(ADDRESS)
      .addToBatch()
      .buildBatch()

    expect(spy).toHaveBeenCalledWith({
      api,
      origin: NODE,
      destination: NODE_2,
      currency: CURRENCY,
      amount: AMOUNT,
      address: ADDRESS
    })
  })

  it('should initiatie a double para to para transfer using batching', async () => {
    const spy = vi.spyOn(xcmPallet, 'send').mockResolvedValue({} as Extrinsic)

    const api = {
      tx: {
        utility: {
          batchAll: vi.fn(),
          batch: vi.fn()
        }
      }
    } as unknown as ApiPromise

    await Builder(api)
      .from(NODE)
      .to(NODE_2)
      .currency(CURRENCY)
      .amount(AMOUNT)
      .address(ADDRESS)
      .addToBatch()
      .from(NODE)
      .to(NODE_2)
      .currency(CURRENCY)
      .amount(AMOUNT)
      .address(ADDRESS)
      .addToBatch()
      .buildBatch()

    expect(spy).toHaveBeenCalledWith({
      api,
      origin: NODE,
      destination: NODE_2,
      currency: CURRENCY,
      amount: AMOUNT,
      address: ADDRESS
    })

    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('should initiatie a double relay to para transfer using batching', async () => {
    const spy = vi.spyOn(xcmPallet, 'transferRelayToPara').mockResolvedValue({} as Extrinsic)

    const api = {
      tx: {
        utility: {
          batchAll: vi.fn(),
          batch: vi.fn()
        }
      }
    } as unknown as ApiPromise

    await Builder(api)
      .to(NODE_2)
      .amount(AMOUNT)
      .address(ADDRESS)
      .addToBatch()
      .to(NODE_2)
      .amount(AMOUNT)
      .address(ADDRESS)
      .addToBatch()
      .buildBatch()

    expect(spy).toHaveBeenCalledWith({
      api,
      destination: NODE_2,
      amount: AMOUNT,
      address: ADDRESS
    })

    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('should throw if trying to build when transactions are batched', async () => {
    const api = {
      tx: {
        utility: {
          batchAll: vi.fn(),
          batch: vi.fn()
        }
      }
    } as unknown as ApiPromise

    await expect(
      Builder(api)
        .from(NODE)
        .to(NODE_2)
        .currency(CURRENCY)
        .amount(AMOUNT)
        .address(ADDRESS)
        .addToBatch()
        .from(NODE)
        .to(NODE_2)
        .currency(CURRENCY)
        .amount(AMOUNT)
        .address(ADDRESS)
        .build()
    ).rejects.toThrow(
      'Transaction manager contains batched items. Use buildBatch() to process them.'
    )
  })
})
