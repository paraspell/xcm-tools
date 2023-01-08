import { vi, describe, expect, it } from 'vitest'
import { TNode } from '../../types'
import { createApiInstance } from '../../utils'
import * as hrmp from '../hrmp'
import * as parasSudoWrapper from '../parasSudoWrapper'
import * as xcmPallet from '../xcmPallet'
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
  it('should initiatie a para to para transfer', async () => {
    const api = await createApiInstance(WS_URL)

    const spy = vi.spyOn(xcmPallet, 'send').mockImplementation(() => { return undefined as any })

    Builder(api)
      .from(NODE)
      .to(NODE_2)
      .currency(CURRENCY)
      .currencyId(CURRENCY_ID)
      .amount(AMOUNT)
      .address(ADDRESS)
      .build()

    expect(spy).toHaveBeenCalledWith(api, NODE, CURRENCY, CURRENCY_ID, AMOUNT, ADDRESS, NODE_2)
  })

  it('should initiatie a relay to para transfer', async () => {
    const api = await createApiInstance(WS_URL)

    const spy = vi.spyOn(xcmPallet, 'transferRelayToPara').mockImplementation(() => { return undefined as any })

    Builder(api)
      .to(NODE)
      .amount(AMOUNT)
      .address(ADDRESS)
      .build()

    expect(spy).toHaveBeenCalledWith(api, NODE, AMOUNT, ADDRESS)
  })

  it('should initiatie a para to relay transfer', async () => {
    const api = await createApiInstance(WS_URL)

    const spy = vi.spyOn(xcmPallet, 'send').mockImplementation(() => { return undefined as any })

    Builder(api)
      .from(NODE)
      .currency(CURRENCY)
      .currencyId(CURRENCY_ID)
      .amount(AMOUNT)
      .address(ADDRESS)
      .build()

    expect(spy).toHaveBeenCalledWith(api, NODE, CURRENCY, CURRENCY_ID, AMOUNT, ADDRESS, undefined)
  })

  it('should open a channel', async () => {
    const api = await createApiInstance(WS_URL)

    const spy = vi.spyOn(parasSudoWrapper, 'openChannel').mockImplementation(() => { return undefined as any })

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
    const api = await createApiInstance(WS_URL)

    const spy = vi.spyOn(hrmp, 'closeChannel').mockImplementation(() => { return undefined as any })

    Builder(api)
      .from(NODE)
      .closeChannel()
      .inbound(CHANNEL_INBOUND)
      .outbound(CHANNEL_OUTBOUND)
      .build()

    expect(spy).toHaveBeenCalledWith(api, NODE, CHANNEL_INBOUND, CHANNEL_OUTBOUND)
  })
})
