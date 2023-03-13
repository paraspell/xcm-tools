import { ApiPromise } from '@polkadot/api'
import { vi, describe, expect, it, beforeEach } from 'vitest'
import { Bool, TNode } from '../../../types'
import { createApiInstance } from '../../../utils'
import * as hrmp from '../../hrmp'
import * as parasSudoWrapper from '../../parasSudoWrapper'
import * as xcmPallet from '../../xcmPallet'
import * as xyk from '../../xyk'
import { Builder } from './Builder'

const WS_URL = 'wss://para.f3joule.space'
const NODE: TNode = 'Acala'
const NODE_2: TNode = 'Acala'
const AMOUNT = 1000
const CURRENCY = 'ACA'
const CURRENCY_ID = -1
const ADDRESS = '23sxrMSmaUMqe2ufSJg8U3Y8kxHfKT67YbubwXWFazpYi7w6'
const CHANNEL_MAX_SIZE = 2
const CHANNEL_MAX_MSG_SIZE = 6
const CHANNEL_INBOUND = 9
const CHANNEL_OUTBOUND = 4

describe('Builder', () => {
  let api: ApiPromise

  beforeEach(async () => {
    api = await createApiInstance(WS_URL)
  })

  it('should initiatie a para to para transfer with currency symbol', async () => {
    const spy = vi.spyOn(xcmPallet, 'send').mockImplementation(() => {
      return undefined as any
    })

    Builder(api).from(NODE).to(NODE_2).currency(CURRENCY).amount(AMOUNT).address(ADDRESS).build()

    expect(spy).toHaveBeenCalledWith(api, NODE, CURRENCY, AMOUNT, ADDRESS, NODE_2)
  })

  it('should initiatie a para to para transfer with currency id', async () => {
    const spy = vi.spyOn(xcmPallet, 'send').mockImplementation(() => {
      return undefined as any
    })

    Builder(api).from(NODE).to(NODE_2).currency(CURRENCY_ID).amount(AMOUNT).address(ADDRESS).build()

    expect(spy).toHaveBeenCalledWith(api, NODE, CURRENCY_ID, AMOUNT, ADDRESS, NODE_2)
  })

  it('should initiatie a relay to para transfer', async () => {
    const spy = vi.spyOn(xcmPallet, 'transferRelayToPara').mockImplementation(() => {
      return undefined as any
    })

    Builder(api).to(NODE).amount(AMOUNT).address(ADDRESS).build()

    expect(spy).toHaveBeenCalledWith(api, NODE, AMOUNT, ADDRESS)
  })

  it('should initiatie a para to relay transfer with currency symbol', async () => {
    const spy = vi.spyOn(xcmPallet, 'send').mockImplementation(() => {
      return undefined as any
    })

    Builder(api).from(NODE).currency(CURRENCY).amount(AMOUNT).address(ADDRESS).build()

    expect(spy).toHaveBeenCalledWith(api, NODE, CURRENCY, AMOUNT, ADDRESS, undefined)
  })

  it('should initiatie a para to relay transfer with currency id', async () => {
    const spy = vi.spyOn(xcmPallet, 'send').mockImplementation(() => {
      return undefined as any
    })

    Builder(api).from(NODE).currency(CURRENCY_ID).amount(AMOUNT).address(ADDRESS).build()

    expect(spy).toHaveBeenCalledWith(api, NODE, CURRENCY_ID, AMOUNT, ADDRESS, undefined)
  })

  it('should open a channel', async () => {
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

  it('should close a channel', async () => {
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

  it('should add liquidity', async () => {
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

  it('should remove liquidity', async () => {
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

  it('should buy', async () => {
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

  it('should sell', async () => {
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

  it('should create pool', async () => {
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
})
