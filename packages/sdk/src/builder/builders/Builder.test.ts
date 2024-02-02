// Contains builder pattern tests for different Builder pattern functionalities

import { type ApiPromise } from '@polkadot/api'
import { vi, describe, expect, it, beforeEach } from 'vitest'
import { type Bool, type TNode } from '../../types'
import { createApiInstance } from '../../utils'
import * as hrmp from '../../pallets/hrmp'
import * as parasSudoWrapper from '../../pallets/parasSudoWrapper'
import * as xcmPallet from '../../pallets/xcmPallet'
import * as xyk from '../../pallets/xyk'
import { getRelayChainSymbol } from '../../pallets/assets'
import { Builder } from './Builder'

const WS_URL = 'wss://para.f3joule.space'
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

  beforeEach(async () => {
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

    expect(spy).toHaveBeenCalledWith(
      api,
      NODE,
      CURRENCY,
      AMOUNT,
      ADDRESS,
      NODE_2,
      undefined,
      undefined
    )
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

    expect(spy).toHaveBeenCalledWith(
      api,
      NODE,
      CURRENCY,
      AMOUNT,
      ADDRESS,
      NODE_2,
      PARA_ID_TO,
      undefined
    )
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

    expect(spy).toHaveBeenCalledWith(
      api,
      NODE,
      CURRENCY,
      AMOUNT,
      ADDRESS,
      NODE_2,
      PARA_ID_TO,
      destApi
    )
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

    expect(spy).toHaveBeenCalledWith(
      api,
      NODE,
      CURRENCY_ID,
      AMOUNT,
      ADDRESS,
      NODE_2,
      undefined,
      undefined
    )
  })

  it('should initiatie a relay to para transfer', async () => {
    const spy = vi.spyOn(xcmPallet, 'transferRelayToPara').mockResolvedValue(undefined as any)

    await Builder(api).to(NODE).amount(AMOUNT).address(ADDRESS).build()

    expect(spy).toHaveBeenCalledWith(api, NODE, AMOUNT, ADDRESS, undefined, undefined)
  })

  it('should initiatie a relay to para transfer with custom paraId', async () => {
    const spy = vi.spyOn(xcmPallet, 'transferRelayToPara').mockResolvedValue(undefined as any)

    await Builder(api).to(NODE, PARA_ID_TO).amount(AMOUNT).address(ADDRESS).build()

    expect(spy).toHaveBeenCalledWith(api, NODE, AMOUNT, ADDRESS, PARA_ID_TO, undefined)
  })

  it('should initiatie a relay to para transfer with useKeepAlive', async () => {
    const spy = vi.spyOn(xcmPallet, 'transferRelayToPara').mockResolvedValue(undefined as any)

    await Builder(api)
      .to(NODE, PARA_ID_TO)
      .amount(AMOUNT)
      .address(ADDRESS)
      .useKeepAlive(destApi)
      .build()

    expect(spy).toHaveBeenCalledWith(api, NODE, AMOUNT, ADDRESS, PARA_ID_TO, destApi)
  })

  it('should initiatie a para to relay transfer with currency symbol', async () => {
    const spy = vi.spyOn(xcmPallet, 'send').mockResolvedValue(undefined as any)

    const currency = getRelayChainSymbol(NODE)

    await Builder(api).from(NODE).amount(AMOUNT).address(ADDRESS).build()

    expect(spy).toHaveBeenCalledWith(
      api,
      NODE,
      currency,
      AMOUNT,
      ADDRESS,
      undefined,
      undefined,
      undefined
    )
  })

  it('should initiatie a para to relay transfer with currency symbol', async () => {
    const spy = vi.spyOn(xcmPallet, 'send').mockResolvedValue(undefined as any)

    const currency = getRelayChainSymbol(NODE)

    await Builder(api).from(NODE).amount(AMOUNT).address(ADDRESS).useKeepAlive(destApi).build()

    expect(spy).toHaveBeenCalledWith(
      api,
      NODE,
      currency,
      AMOUNT,
      ADDRESS,
      undefined,
      undefined,
      destApi
    )
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

    expect(spy).toHaveBeenCalledWith(api, NODE, NODE_2, CHANNEL_MAX_SIZE, CHANNEL_MAX_MSG_SIZE)
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

    expect(spy).toHaveBeenCalledWith(api, NODE, CHANNEL_INBOUND, CHANNEL_OUTBOUND)
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

  it('should add liquidity', () => {
    const spy = vi.spyOn(xyk, 'addLiquidity').mockImplementation(() => {
      return undefined as any
    })

    const ASSET_A = 0
    const ASSET_B = 1
    const AMOUNT_A = 2
    const AMOUNT_B_MAX_LIMIT = 3

    Builder(api)
      .addLiquidity()
      .assetA(ASSET_A)
      .assetB(ASSET_B)
      .amountA(AMOUNT_A)
      .amountBMaxLimit(AMOUNT_B_MAX_LIMIT)
      .build()

    expect(spy).toHaveBeenCalledWith(api, ASSET_A, ASSET_B, AMOUNT_A, AMOUNT_B_MAX_LIMIT)
  })

  it('should remove liquidity', () => {
    const spy = vi.spyOn(xyk, 'removeLiquidity').mockImplementation(() => {
      return undefined as any
    })

    const ASSET_A = 0
    const ASSET_B = 1
    const LIQUIDITY_AMOUNT = 2

    Builder(api)
      .removeLiquidity()
      .assetA(ASSET_A)
      .assetB(ASSET_B)
      .liquidityAmount(LIQUIDITY_AMOUNT)
      .build()

    expect(spy).toHaveBeenCalledWith(api, ASSET_A, ASSET_B, LIQUIDITY_AMOUNT)
  })

  it('should buy', () => {
    const spy = vi.spyOn(xyk, 'buy').mockImplementation(() => {
      return undefined as any
    })

    const ASSET_OUT = 0
    const ASSET_IN = 1
    const AMOUNT = 2
    const MAX_LIMIT = 3
    const DISCOUNT: Bool = 'Yes'

    Builder(api)
      .buy()
      .assetOut(ASSET_OUT)
      .assetIn(ASSET_IN)
      .amount(AMOUNT)
      .maxLimit(MAX_LIMIT)
      .discount(DISCOUNT)
      .build()

    expect(spy).toHaveBeenCalledWith(api, ASSET_OUT, ASSET_IN, AMOUNT, MAX_LIMIT, DISCOUNT)
  })

  it('should sell', () => {
    const spy = vi.spyOn(xyk, 'sell').mockImplementation(() => {
      return undefined as any
    })

    const ASSET_OUT = 0
    const ASSET_IN = 1
    const AMOUNT = 2
    const MAX_LIMIT = 3
    const DISCOUNT: Bool = 'Yes'

    Builder(api)
      .sell()
      .assetIn(ASSET_IN)
      .assetOut(ASSET_OUT)
      .amount(AMOUNT)
      .maxLimit(MAX_LIMIT)
      .discount(DISCOUNT)
      .build()

    expect(spy).toHaveBeenCalledWith(api, ASSET_IN, ASSET_OUT, AMOUNT, MAX_LIMIT, DISCOUNT)
  })

  it('should create pool', () => {
    const spy = vi.spyOn(xyk, 'createPool').mockImplementation(() => {
      return undefined as any
    })

    const ASSET_A = 0
    const AMOUNT_A = 1
    const ASSET_B = 2
    const AMOUNT_B = 3

    Builder(api)
      .createPool()
      .assetA(ASSET_A)
      .amountA(AMOUNT_A)
      .assetB(ASSET_B)
      .amountB(AMOUNT_B)
      .build()

    expect(spy).toHaveBeenCalledWith(api, ASSET_A, AMOUNT_A, ASSET_B, AMOUNT_B)
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
})
