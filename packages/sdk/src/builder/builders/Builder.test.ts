/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
// Contains builder pattern tests for different Builder pattern functionalities

import { type ApiPromise } from '@polkadot/api'
import { vi, describe, expect, it, beforeAll } from 'vitest'
import { Version, type TNode } from '../../types'
import { createApiInstance } from '../../utils'
import * as hrmp from '../../pallets/hrmp'
import * as parasSudoWrapper from '../../pallets/parasSudoWrapper'
import * as xcmPallet from '../../pallets/xcmPallet'
import { getRelayChainSymbol } from '../../pallets/assets'
import { Builder } from './Builder'
import { type TMultiAsset } from '../../types/TMultiAsset'

const WS_URL = 'wss://subsocial-rpc.dwellir.com'
const NODE: TNode = 'Acala'
const NODE_2: TNode = 'Acala'
const AMOUNT = 1000
const CURRENCY = 'ACA'
const CURRENCY_ID = BigInt(-1)
const ADDRESS = '23sxrMSmaUMqe2ufSJg8U3Y8kxHfKT67YbubwXWFazpYi7w6'
const CHANNEL_MAX_SIZE = 2
const CHANNEL_MAX_MSG_SIZE = 6
const CHANNEL_INBOUND = 9
const CHANNEL_OUTBOUND = 4
const PARA_ID_TO = 1999

describe('Builder', () => {
  let api: ApiPromise
  let destApi: ApiPromise

  beforeAll(async () => {
    api = await createApiInstance(WS_URL)
    destApi = await createApiInstance(WS_URL)
  })

  it('should initiatie a para to para transfer with currency symbol', async () => {
    const spy = vi.spyOn(xcmPallet, 'send').mockResolvedValue(undefined as any)

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
    const spy = vi.spyOn(xcmPallet, 'send').mockResolvedValue(undefined as any)

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

  it('should initiatie a para to para transfer with specified asset symbol', async () => {
    const spy = vi.spyOn(xcmPallet, 'send').mockResolvedValue(undefined as any)

    await Builder(api)
      .from(NODE)
      .to(NODE_2, PARA_ID_TO)
      .currency({
        symbol: CURRENCY
      })
      .amount(AMOUNT)
      .address(ADDRESS)
      .build()

    expect(spy).toHaveBeenCalledWith({
      api,
      origin: NODE,
      currency: {
        symbol: CURRENCY
      },
      amount: AMOUNT,
      address: ADDRESS,
      destination: NODE_2,
      paraIdTo: PARA_ID_TO
    })
  })

  it('should initiatie a para to para transfer with specified asset ID', async () => {
    const spy = vi.spyOn(xcmPallet, 'send').mockResolvedValue(undefined as any)
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
    const spy = vi.spyOn(xcmPallet, 'send').mockResolvedValue(undefined as any)

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
    const spy = vi.spyOn(xcmPallet, 'send').mockResolvedValue(undefined as any)

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
    const spy = vi.spyOn(xcmPallet, 'send').mockResolvedValue(undefined as any)

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
    const spy = vi.spyOn(xcmPallet, 'send').mockResolvedValue(undefined as any)

    await Builder(api)
      .from(NODE)
      .to(NODE_2)
      .currency(CURRENCY_ID)
      .amount(AMOUNT)
      .address(ADDRESS)
      .build()

    expect(spy).toHaveBeenCalledWith({
      api,
      origin: NODE,
      currency: CURRENCY_ID,
      amount: AMOUNT,
      address: ADDRESS,
      destination: NODE_2
    })
  })

  it('should initiatie a para to para transfer with fee asset', async () => {
    const spy = vi.spyOn(xcmPallet, 'send').mockResolvedValue(undefined as any)

    const feeAsset = 0

    await Builder(api)
      .from(NODE)
      .to(NODE_2)
      .currency(CURRENCY_ID)
      .feeAsset(feeAsset)
      .amount(AMOUNT)
      .address(ADDRESS)
      .build()

    expect(spy).toHaveBeenCalledWith({
      api,
      origin: NODE,
      currency: CURRENCY_ID,
      amount: AMOUNT,
      address: ADDRESS,
      feeAsset,
      destination: NODE_2
    })
  })

  it('should initiatie a para to para transfer with two overriden multi asset', async () => {
    const spy = vi.spyOn(xcmPallet, 'send').mockResolvedValue(undefined as any)

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
      .currency(overridedCurrencyMultiLocation)
      .feeAsset(feeAsset)
      .amount(AMOUNT)
      .address(ADDRESS)
      .build()

    expect(spy).toHaveBeenCalledWith({
      api,
      origin: NODE,
      currency: overridedCurrencyMultiLocation,
      amount: AMOUNT,
      address: ADDRESS,
      feeAsset,
      destination: NODE_2
    })
  })

  it('should initiatie a para to para transfer with one overriden multi asset', async () => {
    const spy = vi.spyOn(xcmPallet, 'send').mockResolvedValue(undefined as any)

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
      .currency(overridedCurrencyMultiLocation)
      .amount(AMOUNT)
      .address(ADDRESS)
      .build()

    expect(spy).toHaveBeenCalledWith({
      api,
      origin: NODE,
      currency: overridedCurrencyMultiLocation,
      amount: AMOUNT,
      address: ADDRESS,
      destination: NODE_2
    })
  })

  it('should initiatie a relay to para transfer', async () => {
    const spy = vi.spyOn(xcmPallet, 'transferRelayToPara').mockResolvedValue(undefined as any)

    await Builder(api).to(NODE).amount(AMOUNT).address(ADDRESS).build()

    expect(spy).toHaveBeenCalledWith({ api, destination: NODE, amount: AMOUNT, address: ADDRESS })
  })

  it('should initiatie a relay to para transfer with custom paraId', async () => {
    const spy = vi.spyOn(xcmPallet, 'transferRelayToPara').mockResolvedValue(undefined as any)

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
    const spy = vi.spyOn(xcmPallet, 'transferRelayToPara').mockResolvedValue(undefined as any)

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
    const spy = vi.spyOn(xcmPallet, 'transferRelayToPara').mockResolvedValue(undefined as any)

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
    const spy = vi.spyOn(xcmPallet, 'transferRelayToPara').mockResolvedValue(undefined as any)

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
    const spy = vi.spyOn(xcmPallet, 'send').mockResolvedValue(undefined as any)

    const currency = getRelayChainSymbol(NODE)

    await Builder(api).from(NODE).amount(AMOUNT).address(ADDRESS).build()

    expect(spy).toHaveBeenCalledWith({
      api,
      origin: NODE,
      currency,
      amount: AMOUNT,
      address: ADDRESS
    })
  })

  it('should initiatie a para to relay transfer with currency symbol', async () => {
    const spy = vi.spyOn(xcmPallet, 'send').mockResolvedValue(undefined as any)

    const currency = getRelayChainSymbol(NODE)

    await Builder(api).from(NODE).amount(AMOUNT).address(ADDRESS).useKeepAlive(destApi).build()

    expect(spy).toHaveBeenCalledWith({
      api,
      origin: NODE,
      currency,
      amount: AMOUNT,
      address: ADDRESS,
      destApiForKeepAlive: destApi
    })
  })

  it('should initiatie a para to relay transfer with fee asset', async () => {
    const spy = vi.spyOn(xcmPallet, 'send').mockResolvedValue(undefined as any)

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
      currency,
      amount: AMOUNT,
      address: ADDRESS,
      feeAsset,
      destApiForKeepAlive: destApi
    })
  })

  it('should initiatie a para to relay transfer with overriden version', async () => {
    const spy = vi.spyOn(xcmPallet, 'send').mockResolvedValue(undefined as any)

    const currency = getRelayChainSymbol(NODE)
    const version = Version.V2

    await Builder(api).from(NODE).amount(AMOUNT).address(ADDRESS).xcmVersion(version).build()

    expect(spy).toHaveBeenCalledWith({
      api,
      origin: NODE,
      currency,
      amount: AMOUNT,
      address: ADDRESS,
      version
    })
  })

  it('should initiatie a para to relay transfer with fee asset, keep alive and overriden version', async () => {
    const spy = vi.spyOn(xcmPallet, 'send').mockResolvedValue(undefined as any)

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
      currency,
      amount: AMOUNT,
      address: ADDRESS,
      feeAsset,
      destApiForKeepAlive: destApi,
      version
    })
  })

  it('should open a channel', () => {
    const spy = vi.spyOn(parasSudoWrapper, 'openChannel').mockImplementation(() => {
      return undefined as any
    })

    Builder(api)
      .from(NODE)
      .to(NODE_2)
      .openChannel()
      .maxSize(CHANNEL_MAX_SIZE)
      .maxMessageSize(CHANNEL_MAX_MSG_SIZE)
      .build()

    expect(spy).toHaveBeenCalledWith({
      api,
      origin: NODE,
      destination: NODE_2,
      maxSize: CHANNEL_MAX_SIZE,
      maxMessageSize: CHANNEL_MAX_MSG_SIZE
    })
  })

  it('should return a channel open serialized api call', () => {
    const serializedApiCall = Builder(api)
      .from(NODE)
      .to(NODE_2)
      .openChannel()
      .maxSize(CHANNEL_MAX_SIZE)
      .maxMessageSize(CHANNEL_MAX_MSG_SIZE)
      .buildSerializedApiCall()

    expect(serializedApiCall).toHaveProperty('module')
    expect(serializedApiCall).toHaveProperty('section')
    expect(serializedApiCall).toHaveProperty('parameters')
    expect(serializedApiCall.module).toBeTypeOf('string')
    expect(serializedApiCall.section).toBeTypeOf('string')
    expect(Array.isArray(serializedApiCall.parameters)).toBe(true)
  })

  it('should close a channel', () => {
    const spy = vi.spyOn(hrmp, 'closeChannel').mockImplementation(() => {
      return undefined as any
    })

    Builder(api)
      .from(NODE)
      .closeChannel()
      .inbound(CHANNEL_INBOUND)
      .outbound(CHANNEL_OUTBOUND)
      .build()

    expect(spy).toHaveBeenCalledWith({
      api,
      origin: NODE,
      inbound: CHANNEL_INBOUND,
      outbound: CHANNEL_OUTBOUND
    })
  })

  it('should return a channel close serialized api call', () => {
    const serializedApiCall = Builder(api)
      .from(NODE)
      .closeChannel()
      .inbound(CHANNEL_INBOUND)
      .outbound(CHANNEL_OUTBOUND)
      .buildSerializedApiCall()

    expect(serializedApiCall).toHaveProperty('module')
    expect(serializedApiCall).toHaveProperty('section')
    expect(serializedApiCall).toHaveProperty('parameters')
    expect(serializedApiCall.module).toBeTypeOf('string')
    expect(serializedApiCall.section).toBeTypeOf('string')
    expect(Array.isArray(serializedApiCall.parameters)).toBe(true)
  })

  it('should request a para to para transfer serialized api call with currency id', async () => {
    const serializedApiCall = await Builder(api)
      .from(NODE)
      .to(NODE_2)
      .currency('DOT')
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
    const serializedApiCall = await Builder(api)
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
    const serializedApiCall = await Builder(api)
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
})
